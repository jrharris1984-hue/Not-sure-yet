"""Desktop lifecycle tests; no graphical desktop or external AI services needed."""
import asyncio
from contextlib import contextmanager
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from types import SimpleNamespace
from contextlib import nullcontext
from unittest.mock import patch
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).parents[2] / 'desktop'))
sys.path.insert(0, str(Path(__file__).parents[1]))
from fastapi import FastAPI
from fastapi.testclient import TestClient
from runtime import BackendRuntime, DesktopFiles, InstanceLock, prepare_environment, resource_frontend


class DesktopStaticTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / 'static').mkdir()
        (self.root / 'index.html').write_text('<html>desktop</html>')
        (self.root / 'static' / 'app.js').write_text('window.desktop=true')
        self.app = FastAPI()
        @self.app.get('/api/health')
        async def health():
            return {'ok': True, 'storage': 'sqlite'}
        self.app.mount('/', DesktopFiles(directory=self.root, html=True))

    def tearDown(self):
        self.temporary.cleanup()

    def test_history_routes_assets_and_api_routing(self):
        with TestClient(self.app) as client:
            for path in ['/', '/library', '/characters/123', '/index.html']:
                response = client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.text, '<html>desktop</html>')
            self.assertEqual(client.get('/static/app.js').text, 'window.desktop=true')
            self.assertEqual(client.get('/api/health').json()['storage'], 'sqlite')
            for path in ['/api/missing', '/api', '/static/missing', '/missing.js', '/favicon.ico', '/%2e%2e/secret']:
                response = client.get(path)
                self.assertEqual(response.status_code, 404, path)
                self.assertNotEqual(response.text, '<html>desktop</html>')
            self.assertEqual(client.post('/library').status_code, 405)

    def test_windows_normalized_paths_keep_api_and_asset_404s(self):
        # Exercise Windows-style Starlette paths even on a Linux test runner.
        with patch.object(DesktopFiles, 'get_path', side_effect=lambda scope: scope['path'].lstrip('/').replace('/', '\\')):
            with TestClient(self.app) as client:
                self.assertEqual(client.get('/api/missing').status_code, 404)
                self.assertEqual(client.get('/static/missing').status_code, 404)
                self.assertEqual(client.get('/static/app.js').text, 'window.desktop=true')
                self.assertEqual(client.get('/characters/123').text, '<html>desktop</html>')

    def test_head_history_route_has_no_response_body(self):
        with TestClient(self.app) as client:
            response = client.head('/library')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, b'')


class DesktopLifecycleTests(unittest.TestCase):
    def test_bind_collision_wait_for_readiness_and_graceful_stop(self):
        occupied = socket.socket()
        occupied.bind(('127.0.0.1', 0))
        occupied.listen()
        lifecycle = []
        app = FastAPI()
        @app.on_event('startup')
        async def startup():
            await asyncio.sleep(0.03)
            lifecycle.append('started')
        @app.on_event('shutdown')
        async def shutdown():
            lifecycle.append('stopped')
        @app.get('/api/health')
        async def health():
            return {'ok': True, 'storage': 'sqlite'}
        runtime = BackendRuntime(app, port=occupied.getsockname()[1])
        try:
            url = runtime.start(timeout=3)
            self.assertTrue(url.startswith('http://127.0.0.1:'))
            self.assertNotEqual(runtime.socket.getsockname()[1], occupied.getsockname()[1])
            self.assertEqual(lifecycle, ['started'])
            with urlopen(url + '/api/health') as response:
                self.assertTrue(json.load(response)['ok'])
        finally:
            runtime.stop()
            occupied.close()
        self.assertFalse(runtime.thread.is_alive())
        self.assertEqual(lifecycle, ['started', 'stopped'])

    def test_failed_startup_leaves_no_worker_or_bound_socket(self):
        app = FastAPI()
        @app.on_event('startup')
        async def startup():
            raise RuntimeError('test startup failure')
        runtime = BackendRuntime(app, port=0)
        with self.assertRaises(RuntimeError):
            runtime.start(timeout=2)
        self.assertFalse(runtime.thread.is_alive())
        self.assertIsNone(runtime.socket)

    def test_unhealthy_backend_times_out_and_shuts_down(self):
        app = FastAPI()
        @app.get('/api/health')
        async def health():
            return {'ok': False, 'storage': 'sqlite'}
        runtime = BackendRuntime(app, port=0)
        with self.assertRaises(RuntimeError):
            runtime.start(timeout=0.3)
        self.assertFalse(runtime.thread.is_alive())
        self.assertIsNone(runtime.socket)

    def test_instance_lock_blocks_another_process_and_releases_after_close(self):
        with tempfile.TemporaryDirectory() as directory:
            script = 'from runtime import InstanceLock; import sys\nwith InstanceLock(sys.argv[1]): pass'
            env = dict(os.environ)
            env['PYTHONPATH'] = os.pathsep.join([str(Path(__file__).parents[2] / 'desktop'), str(Path(__file__).parents[1]), env.get('PYTHONPATH', '')])
            with InstanceLock(directory):
                denied = subprocess.run([sys.executable, '-c', script, directory], env=env, capture_output=True, text=True, timeout=10)
                self.assertNotEqual(denied.returncode, 0)
                self.assertIn('already running', denied.stderr)
            accepted = subprocess.run([sys.executable, '-c', script, directory], env=env, capture_output=True, text=True, timeout=10)
            self.assertEqual(accepted.returncode, 0, accepted.stderr)

    def test_desktop_environment_and_frozen_resources_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict(os.environ, {'ULTRA_STUDIO_DATA_DIR': directory, 'ULTRA_STUDIO_STORAGE': 'mongo'}):
                paths = prepare_environment()
                self.assertEqual(os.environ['ULTRA_STUDIO_STORAGE'], 'sqlite')
                self.assertTrue(paths.logs_dir.is_dir())
                self.assertEqual(paths.database_path, Path(directory).resolve() / 'ultra-studio.sqlite3')
            with patch.object(sys, 'frozen', True, create=True), patch.object(sys, '_MEIPASS', directory, create=True):
                self.assertEqual(resource_frontend(), Path(directory) / 'frontend')

    def test_missing_webview2_is_reported_before_using_legacy_renderer(self):
        import main
        registry = SimpleNamespace(HKEY_CURRENT_USER=1, HKEY_LOCAL_MACHINE=2,
                                   KEY_WOW64_32KEY=32, KEY_WOW64_64KEY=64, KEY_READ=8,
                                   OpenKey=lambda *args: nullcontext('key'),
                                   QueryValueEx=lambda *args: ('0.0.0.0', 1))
        with patch.dict(sys.modules, {'winreg': registry}), patch.object(sys, 'platform', 'win32'):
            with self.assertRaisesRegex(RuntimeError, 'WebView2 Runtime'):
                main.ensure_webview2()
            registry.QueryValueEx = lambda *args: ('130.0.0.0', 1)
            main.ensure_webview2()

    def test_real_desktop_shell_with_stub_window_and_restart_persistence(self):
        # Exercise the real entry point/API/shutdown in fresh processes. Only the
        # platform GUI is replaced; Windows rendering is a manual preview check.
        with tempfile.TemporaryDirectory() as directory:
            # This test covers a returning user with existing services. The
            # separate frozen setup probe checks the native first-run runtime.
            (Path(directory) / 'desktop-services.json').write_text(json.dumps({'version': 1, 'mode': 'existing'}))
            env = {**os.environ, 'ULTRA_STUDIO_DATA_DIR': directory}
            env.pop('ULTRA_STUDIO_SQLITE_PATH', None)
            backend = Path(__file__).parents[1]
            desktop = backend.parent / 'desktop'
            script = """
import json, sys, types
from pathlib import Path
from urllib.request import urlopen, Request
sys.path.insert(0, sys.argv[1])
import main
main.ensure_webview2=lambda:None
def fail_on_dialog(message):
    raise AssertionError(message)
main.show_error=fail_on_dialog
root=Path(sys.argv[2])/'interface'
root.mkdir(exist_ok=True)
(root/'index.html').write_text('<html>Desktop test</html>')
main.resource_frontend=lambda:root
record={}
def create_window(title,url,**kwargs):
    record.update(title=title,url=url,options=kwargs)
def start(**kwargs):
    assert kwargs['gui']=='edgechromium'
    assert kwargs['private_mode'] is False
    assert Path(kwargs['storage_path']).parent==Path(sys.argv[2]).resolve()
    with urlopen(record['url']+'/library') as response:
        assert b'Desktop test' in response.read()
    with urlopen(record['url']+'/api/settings') as response:
        settings=json.load(response)
    assert settings['ollama_url']=='http://localhost:11434'
    assert settings['workflows']
    with urlopen(record['url']+'/api/characters') as response:
        existing=json.load(response)
    if not existing:
        request=Request(record['url']+'/api/characters',data=json.dumps({'name':'Desktop persisted'}).encode(),headers={'Content-Type':'application/json'})
        with urlopen(request) as response:
            assert json.load(response)['name']=='Desktop persisted'
    else:
        assert existing[0]['name']=='Desktop persisted'
    with urlopen(record['url']+'/api/health') as response:
        assert json.load(response)['storage']=='sqlite'
view=types.SimpleNamespace(settings={},create_window=create_window,start=start)
sys.modules['webview']=view
assert main.main([])==0
assert view.settings['ALLOW_DOWNLOADS']
assert record['title']=='Ultra Studio'
# The process is still alive here: the port must already be closed after GUI exit.
try:
    urlopen(record['url']+'/api/health',timeout=0.2)
except OSError:
    pass
else:
    raise AssertionError('desktop backend remained running')
"""
            for _ in range(2):
                result = subprocess.run([sys.executable, '-c', script, str(desktop), directory], env=env,
                                        cwd=directory, capture_output=True, text=True, timeout=30)
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((Path(directory).resolve() / 'ultra-studio.sqlite3').is_file())
            self.assertTrue((Path(directory) / 'logs' / 'desktop.log').is_file())


if __name__ == '__main__':
    unittest.main()
