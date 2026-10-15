# Build on Windows. Keep the executable and its _internal folder together.
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files

root = Path(SPECPATH).parent
frontend = root / 'frontend' / 'build'
if not (frontend / 'index.html').is_file():
    raise SystemExit('Build the frontend before packaging Ultra Studio.')

datas = [(str(frontend), 'frontend'), (str(root / 'backend' / 'seed_workflows'), 'seed_workflows')]
# These JSON resources live beside their importing backend modules in a frozen
# app. Never bundle .env, data, cached renders, models, or the developer checkout.
datas += [(str(path), '.') for path in (root / 'backend').glob('*.json')]
datas += collect_data_files('webview')
datas += [(str(root / 'desktop' / 'PORTABLE_README.txt'), '.')]

a = Analysis(
    [str(root / 'desktop' / 'main.py')],
    pathex=[str(root / 'backend'), str(root / 'desktop')],
    binaries=[], datas=datas,
    hiddenimports=['server', 'sqlite_storage', 'uvicorn.logging', 'uvicorn.lifespan.on',
                   'uvicorn.protocols.http.h11_impl', 'uvicorn.protocols.websockets.websockets_impl',
                   'webview.platforms.winforms', 'webview.platforms.edgechromium'],
    hookspath=[], hooksconfig={}, runtime_hooks=[],
    excludes=['motor', 'PyQt5', 'PyQt6', 'PySide2', 'PySide6', 'gi', 'cefpython3', 'pytest'],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name='UltraStudio',
          debug=False, bootloader_ignore_signals=False, strip=False, upx=False,
          console=False, disable_windowed_traceback=False,
          icon=str(frontend / 'icons' / 'icon-512.png'))
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name='UltraStudio')
