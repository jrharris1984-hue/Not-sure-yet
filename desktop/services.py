"""Private ComfyUI downloads and lifecycle; never modifies an existing installation."""
import hashlib
from contextlib import contextmanager
import json
import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import shutil
import socket
import subprocess
import sys
import threading
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen, build_opener, ProxyHandler

COMFY = {
    'url': 'https://github.com/Comfy-Org/ComfyUI/releases/download/v0.39.0/ComfyUI_windows_portable_nvidia.7z',
    'sha256': '3dca347842ed1c6c833105fafb1669284685a3e54df41578d5f94bcc898ae039',
    'size': 2003629308,
}
MODEL = {
    'url': 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/462165984030d82259a11f4367a4eed129e94a7b/sd_xl_base_1.0.safetensors',
    'sha256': '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
    'size': 6938078334,
}
PORT = 8188
URL = f'http://127.0.0.1:{PORT}'


@contextmanager
def external_libraries():
    # PyInstaller's DLL directory is inherited by Windows children. Embedded
    # ComfyUI uses a different Python version and must load its own libraries.
    frozen_windows = sys.platform == 'win32' and getattr(sys, 'frozen', False)
    if frozen_windows:
        import ctypes
        ctypes.windll.kernel32.SetDllDirectoryW(None)
    try:
        yield
    finally:
        if frozen_windows:
            ctypes.windll.kernel32.SetDllDirectoryW(str(sys._MEIPASS))


def external_environment():
    env = dict(os.environ)
    for name in ('PYTHONHOME', 'PYTHONPATH'):
        env.pop(name, None)
    if getattr(sys, 'frozen', False):
        bundled = Path(sys._MEIPASS).resolve()
        env['PATH'] = os.pathsep.join(entry for entry in env.get('PATH', '').split(os.pathsep)
                                    if entry and not Path(entry).resolve().is_relative_to(bundled))
    return env


class Cancelled(RuntimeError):
    pass


def check_cancel(cancel):
    if cancel.is_set():
        raise Cancelled('Setup cancelled. Downloaded portions are retained for retry.')


def digest(path, cancel):
    value = hashlib.sha256()
    with Path(path).open('rb') as source:
        while chunk := source.read(4 * 1024 * 1024):
            check_cancel(cancel)
            value.update(chunk)
    return value.hexdigest()


def download(spec, destination, progress, cancel):
    """Resume immutable downloads; publish only after size and SHA-256 validation."""
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        progress('Checking existing download…')
        if destination.stat().st_size == spec['size'] and digest(destination, cancel) == spec['sha256']:
            return destination
        raise RuntimeError(f'{destination.name} differs from the expected file. Move it aside before retrying; setup will not overwrite it.')
    partial = destination.with_name(destination.name + '.part')
    offset = partial.stat().st_size if partial.exists() else 0
    if offset > spec['size']:
        partial.unlink()
        offset = 0
    check_cancel(cancel)
    if offset != spec['size']:
        headers = {'User-Agent': 'UltraStudioSetup/1', 'Accept-Encoding': 'identity'}
        if offset:
            headers['Range'] = f'bytes={offset}-'
        try:
            response = urlopen(Request(spec['url'], headers=headers), timeout=30)
        except HTTPError as error:
            raise RuntimeError(f'Download failed ({error.code}). Retry setup when the download service is available.') from error
        with response:
            if offset and response.status == 206:
                expected = f'bytes {offset}-'
                if not response.headers.get('Content-Range', '').startswith(expected):
                    raise RuntimeError('The download server returned an incorrect resume range.')
            elif response.status == 200:
                offset = 0  # Servers ignoring Range must restart, never append.
            else:
                raise RuntimeError(f'Unexpected download response: {response.status}')
            with partial.open('ab' if offset else 'wb') as target:
                while chunk := response.read(1024 * 1024):
                    check_cancel(cancel)
                    offset += len(chunk)
                    if offset > spec['size']:
                        raise RuntimeError('Download exceeded the expected size.')
                    target.write(chunk)
                    progress(f'Downloading {destination.name}: {offset / spec["size"]:.0%} ({offset / 1e9:.1f} / {spec["size"] / 1e9:.1f} GB)')
    if partial.stat().st_size != spec['size']:
        raise RuntimeError('Download was interrupted. Retry setup to resume it.')
    progress(f'Verifying {destination.name}…')
    if digest(partial, cancel) != spec['sha256']:
        partial.unlink()
        raise RuntimeError('Download checksum failed. Retry to download a fresh copy.')
    partial.replace(destination)
    return destination


def validate_member(name):
    normalized = name.replace('\\', '/')
    posix, windows = PurePosixPath(normalized), PureWindowsPath(name)
    if posix.is_absolute() or windows.drive or '..' in posix.parts or ':' in normalized:
        raise RuntimeError('The service archive contains an unsafe path.')


def install_comfy(paths, progress, cancel, model=True, model_directory=''):
    root = paths.services_dir / 'comfyui-v0.39.0'
    ready = root / '.ultra-studio-managed.json'
    if not ready.exists():
        if root.exists():
            raise RuntimeError('An incomplete service folder exists. Move it aside before retrying.')
        if shutil.disk_usage(paths.services_dir).free < 30 * 1024**3:
            raise RuntimeError('Setup needs at least 30 GB free in the Ultra Studio data drive.')
        archive = download(COMFY, paths.services_dir / 'downloads' / 'comfyui-v0.39.0.7z', progress, cancel)
        stage = paths.services_dir / 'comfyui-extracting'
        if stage.exists():
            shutil.rmtree(stage)
        stage.mkdir()
        try:
            import py7zr
            progress('Extracting ComfyUI and its private Python runtime…')
            with py7zr.SevenZipFile(archive, 'r') as package:
                # FileInfo from list() omits symlink attributes in py7zr 1.0.
                # Read the actual archive records before extraction instead.
                for item in package.files:
                    validate_member(item.filename)
                    if item.is_symlink:
                        raise RuntimeError('The service archive contains a symbolic link.')
                package.extractall(stage)
            check_cancel(cancel)
            candidates = list(stage.glob('*/python_embeded/python.exe'))
            if len(candidates) != 1:
                raise RuntimeError('The ComfyUI archive has an unexpected layout.')
            extracted = candidates[0].parents[1]
            if not (extracted / 'ComfyUI' / 'main.py').is_file():
                raise RuntimeError('The downloaded service is missing its entry point.')
            ready_stage = extracted / ready.name
            ready_stage.write_text(json.dumps({'version': 'v0.39.0', 'sha256': COMFY['sha256']}), encoding='utf-8')
            extracted.rename(root)
        finally:
            shutil.rmtree(stage, ignore_errors=True)
    if model:
        download(MODEL, root / 'ComfyUI' / 'models' / 'checkpoints' / 'sd_xl_base_1.0.safetensors', progress, cancel)
    if model_directory:
        directory = Path(model_directory).resolve()
        if not directory.is_dir():
            raise RuntimeError('The selected model folder no longer exists.')
        # JSON strings are valid YAML scalars, including Windows paths.
        lines = ['ultra_studio_external:', '  base_path: ' + json.dumps(str(directory))]
        for key in ('checkpoints', 'loras', 'vae', 'clip', 'text_encoders', 'diffusion_models', 'controlnet', 'upscale_models', 'clip_vision', 'embeddings'):
            lines.append(f'  {key}: {key}')
        (root / 'ComfyUI' / 'extra_model_paths.yaml').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    else:
        (root / 'ComfyUI' / 'extra_model_paths.yaml').unlink(missing_ok=True)
    return root


def nvidia_gpus():
    """Query driver-provided IDs so CUDA selection survives multiple GPUs."""
    try:
        with external_libraries():
            result = subprocess.run(['nvidia-smi', '--query-gpu=uuid,name,memory.total', '--format=csv,noheader,nounits'],
                                    env=external_environment(), capture_output=True, text=True, timeout=15,
                                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if result.returncode:
            return []
        return [{'id': parts[0].strip(), 'name': parts[1].strip(), 'memory': parts[2].strip()}
                for line in result.stdout.splitlines() if len(parts := line.split(',')) == 3]
    except (OSError, subprocess.TimeoutExpired):
        return []


def load_config(paths):
    filename = paths.data_dir / 'desktop-services.json'
    if not filename.exists():
        return None
    config = json.loads(filename.read_text(encoding='utf-8'))
    if config.get('mode') not in ('existing', 'managed') or config.get('version') != 1:
        raise RuntimeError('Unknown desktop setup configuration. Run UltraStudio.exe --setup to configure services again.')
    if config['mode'] == 'managed' and not str(config.get('gpu', '')).startswith('GPU-'):
        raise RuntimeError('Managed setup requires a valid NVIDIA GPU. Run UltraStudio.exe --setup again.')
    return config


def save_config(paths, config):
    filename = paths.data_dir / 'desktop-services.json'
    temporary = filename.with_suffix('.tmp')
    temporary.write_text(json.dumps(config, indent=2), encoding='utf-8')
    temporary.replace(filename)


class ComfyService:
    def __init__(self, paths):
        self.paths, self.process, self.log = paths, None, None

    def start(self, gpu, progress, cancel, timeout=180):
        root = self.paths.services_dir / 'comfyui-v0.39.0'
        if not (root / '.ultra-studio-managed.json').is_file():
            raise RuntimeError('Managed ComfyUI is missing. Run UltraStudio.exe --setup to repair it.')
        if gpu not in {item['id'] for item in nvidia_gpus()}:
            raise RuntimeError('The selected NVIDIA GPU is unavailable. Install its driver or run setup again.')
        with socket.socket() as probe:
            try:
                probe.bind(('127.0.0.1', PORT))
            except OSError as error:
                raise RuntimeError('Port 8188 is already in use. Close the other ComfyUI instance or choose existing services in setup.') from error
        self.log = (self.paths.logs_dir / 'comfyui.log').open('ab')
        env = external_environment()
        env['CUDA_VISIBLE_DEVICES'] = gpu
        try:
            with external_libraries():
                self.process = subprocess.Popen([str(root / 'python_embeded' / 'python.exe'), '-s', str(root / 'ComfyUI' / 'main.py'),
                                                 '--windows-standalone-build', '--listen', '127.0.0.1', '--port', str(PORT), '--disable-auto-launch'],
                                                cwd=root, env=env, stdout=self.log, stderr=subprocess.STDOUT,
                                                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            opener = build_opener(ProxyHandler({}))
            deadline = time.monotonic() + timeout
            progress('Starting ComfyUI and checking GPU readiness…')
            while time.monotonic() < deadline:
                check_cancel(cancel)
                if self.process.poll() is not None:
                    raise RuntimeError('ComfyUI could not start. See logs/comfyui.log; check your NVIDIA driver.')
                try:
                    with opener.open(URL + '/system_stats', timeout=1) as response:
                        stats = json.load(response)
                    if not stats.get('devices') or not any(item.get('type') == 'cuda' for item in stats['devices']):
                        raise RuntimeError('ComfyUI started without a CUDA GPU. Check your NVIDIA driver.')
                    os.environ['COMFYUI_OUTPUT_DIR'] = str(root / 'ComfyUI' / 'output')
                    return URL
                except (OSError, ValueError):
                    pass
                time.sleep(0.2)
            raise RuntimeError('ComfyUI startup timed out. See logs/comfyui.log and retry.')
        except BaseException:
            self.stop()
            raise

    def stop(self):
        try:
            if self.process is not None and self.process.poll() is None:
                self.process.terminate()
                try:
                    self.process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait(timeout=5)
        finally:
            self.process = None
            if self.log is not None:
                self.log.close()
                self.log = None
