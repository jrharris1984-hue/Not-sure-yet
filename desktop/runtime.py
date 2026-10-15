"""Lifecycle and static serving shared by the desktop shell and headless checks."""
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import socket
import sys
import threading
import time
from urllib.request import build_opener, ProxyHandler

from fastapi import HTTPException
from starlette.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware
from storage_paths import resolve_storage_paths


class DesktopFiles(StaticFiles):
    """Serve React history routes without masking missing APIs or assets."""
    async def get_response(self, path, scope):
        # Starlette normalizes URL paths with os.path, yielding backslashes on
        # Windows. Routing guards must compare URL separators on every OS.
        path = path.replace('\\', '/')
        if path == 'api' or path.startswith('api/'):
            raise HTTPException(404, 'Not found')
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            if error.status_code != 404 or scope['method'] not in {'GET', 'HEAD'}:
                raise
            if path.startswith('static/') or Path(path).suffix or '..' in Path(path).parts:
                raise
            return await super().get_response('index.html', scope)


def resource_frontend():
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / 'frontend'
    return Path(__file__).resolve().parents[1] / 'frontend' / 'build'


def prepare_environment():
    # This executable has its own SQLite storage. It never attaches to the Docker
    # MongoDB database or silently imports existing application records.
    os.environ['ULTRA_STUDIO_DESKTOP'] = '1'
    os.environ['ULTRA_STUDIO_STORAGE'] = 'sqlite'
    os.environ['CORS_ORIGINS'] = ''
    paths = resolve_storage_paths(Path(__file__).parent)
    paths.create_directories()
    os.environ['ULTRA_STUDIO_SQLITE_PATH'] = str(paths.database_path)
    return paths


def configure_logging(paths):
    handler = RotatingFileHandler(paths.logs_dir / 'desktop.log', maxBytes=2 * 1024 * 1024, backupCount=3, encoding='utf-8')
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s'))
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)
    return handler


class InstanceLock:
    """One desktop queue worker per data folder, with OS release after a crash."""
    def __init__(self, directory):
        self.path = Path(directory) / 'desktop.lock'
        self.file = None

    def __enter__(self):
        self.file = self.path.open('a+b')
        self.file.seek(0, 2)
        if self.file.tell() == 0:
            self.file.write(b'0')
            self.file.flush()
        self.file.seek(0)
        try:
            if sys.platform == 'win32':
                import msvcrt
                msvcrt.locking(self.file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            self.file.close()
            self.file = None
            raise RuntimeError('Ultra Studio is already running with this data folder. Close its window before opening another copy.') from error
        return self

    def __exit__(self, *args):
        if self.file is not None:
            try:
                self.file.seek(0)
                if sys.platform == 'win32':
                    import msvcrt
                    msvcrt.locking(self.file.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(self.file.fileno(), fcntl.LOCK_UN)
            finally:
                self.file.close()
                self.file = None


def desktop_app(frontend):
    frontend = Path(frontend).resolve()
    if not (frontend / 'index.html').is_file():
        raise RuntimeError('The bundled interface is missing. Build the frontend before launching Ultra Studio.')
    # Import after environment setup. Static files are mounted last, after all
    # API/WebSocket routes; API requests and the interface share one origin.
    import server
    server.app.add_middleware(TrustedHostMiddleware, allowed_hosts=['127.0.0.1'])
    server.app.mount('/', DesktopFiles(directory=frontend, html=True), name='desktop-interface')
    return server.app


class BackendRuntime:
    def __init__(self, app, port=8765):
        self.app, self.preferred_port = app, port
        self.socket = None
        self.thread = None
        self.server = None
        self.error = None
        self.url = None

    def start(self, timeout=30):
        import uvicorn
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            try:
                self.socket.bind(('127.0.0.1', self.preferred_port))
            except OSError:
                if not self.preferred_port:
                    raise
                self.socket.bind(('127.0.0.1', 0))
            self.socket.listen(128)
            self.url = f'http://127.0.0.1:{self.socket.getsockname()[1]}'
            config = uvicorn.Config(self.app, host='127.0.0.1', log_config=None, access_log=False,
                                    timeout_graceful_shutdown=5, lifespan='on', loop='asyncio', http='h11', ws='websockets')
            self.server = uvicorn.Server(config)
            def serve():
                try:
                    self.server.run(sockets=[self.socket])
                except BaseException as error:
                    self.error = error
            self.thread = threading.Thread(target=serve, name='ultra-studio-backend', daemon=True)
            self.thread.start()
            opener = build_opener(ProxyHandler({}))
            deadline = time.monotonic() + timeout
            while time.monotonic() < deadline:
                if self.error or not self.thread.is_alive():
                    raise RuntimeError('The local backend could not start. See desktop.log for details.') from self.error
                if self.server.started:
                    try:
                        with opener.open(self.url + '/api/health', timeout=1) as response:
                            health = json.load(response)
                        if health.get('ok') and health.get('storage') == 'sqlite':
                            return self.url
                    except (OSError, ValueError):
                        pass
                time.sleep(0.05)
            raise RuntimeError('The local backend did not become ready. See desktop.log for details.')
        except BaseException:
            self.stop()
            raise

    def stop(self):
        if self.server is not None:
            self.server.should_exit = True
        if self.thread is not None:
            self.thread.join(timeout=10)
            if self.thread.is_alive():
                raise RuntimeError('The backend has not finished shutting down. Wait before reopening Ultra Studio.')
        if self.socket is not None:
            self.socket.close()
            self.socket = None


def verify_runtime(url):
    """Non-GUI packaged-build check: real UI, settings, workflow assets, storage."""
    opener = build_opener(ProxyHandler({}))
    with opener.open(url + '/', timeout=5) as response:
        if b'<html' not in response.read().lower():
            raise RuntimeError('The bundled interface did not load.')
    with opener.open(url + '/api/settings', timeout=5) as response:
        settings = json.load(response)
    if not settings.get('workflows'):
        raise RuntimeError('Bundled workflow templates did not load.')
    with opener.open(url + '/api/characters', timeout=5) as response:
        if not isinstance(json.load(response), list):
            raise RuntimeError('The local character library did not load.')
