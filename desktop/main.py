"""Ultra Studio desktop entry point (GUI runs on the main thread)."""
import argparse
import logging
from pathlib import Path
import sys

# Source launches work from any current directory. Frozen modules are resolved
# by PyInstaller; no developer checkout or installed Python is needed at runtime.
if not getattr(sys, 'frozen', False):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))

from runtime import BackendRuntime, InstanceLock, configure_logging, desktop_app, prepare_environment, resource_frontend, verify_runtime


def ensure_webview2():
    """Reject the legacy IE renderer on Windows instead of showing a blank UI."""
    if sys.platform != 'win32':
        return
    import winreg
    runtime_key = r'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'
    for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
        for view in (winreg.KEY_WOW64_32KEY, winreg.KEY_WOW64_64KEY):
            try:
                with winreg.OpenKey(hive, runtime_key, 0, winreg.KEY_READ | view) as key:
                    version, _ = winreg.QueryValueEx(key, 'pv')
                if int(str(version).split('.')[0]) >= 86:
                    return
            except (OSError, ValueError):
                pass
    raise RuntimeError('Microsoft Edge WebView2 Runtime is required to open Ultra Studio. Install it from https://developer.microsoft.com/microsoft-edge/webview2/ and try again.')


def show_error(message):
    if sys.platform == 'win32':
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, str(message), 'Ultra Studio', 0x10)
    elif sys.stderr is not None:
        print(message, file=sys.stderr)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Ultra Studio desktop application')
    parser.add_argument('--smoke-test', action='store_true', help='Check bundled UI and backend without opening a window')
    parser.add_argument('--setup', action='store_true', help='Configure or repair desktop services')
    parser.add_argument('--setup-smoke-test', action='store_true', help='Check frozen native setup and archive dependencies')
    args = parser.parse_args(argv)
    paths = None
    handler = None
    service = None
    try:
        paths = prepare_environment()
        handler = configure_logging(paths)
        with InstanceLock(paths.data_dir):
            config = None
            if args.setup_smoke_test:
                from starter_pack import verify_setup_runtime
                verify_setup_runtime()
                return 0
            if not args.smoke_test:
                from setup_ui import service_setup
                service, config = service_setup(paths, reconfigure=args.setup)
            app = desktop_app(resource_frontend())
            runtime = BackendRuntime(app)
            try:
                url = runtime.start()
                if args.smoke_test:
                    verify_runtime(url)
                else:
                    from starter_pack import connect_studio
                    connect_studio(url, config)
                    ensure_webview2()
                    import webview
                    webview.settings['ALLOW_DOWNLOADS'] = True
                    webview.settings['ALLOW_FILE_URLS'] = False
                    webview.create_window('Ultra Studio', url, width=1280, height=900,
                                          min_size=(640, 480), background_color='#09090b', text_select=True)
                    try:
                        webview.start(gui='edgechromium', private_mode=False,
                                      storage_path=str(paths.data_dir / 'webview'))
                    except Exception as error:
                        raise RuntimeError('The application window could not open. Install Microsoft Edge WebView2 Runtime, then try again.') from error
            finally:
                # Exiting the GUI stops only our own API/queue worker. Existing
                # ComfyUI/Ollama processes are owned by the user and keep running.
                runtime.stop()
                if service is not None:
                    service.stop()
        return 0
    except Exception:
        from services import Cancelled
        if isinstance(sys.exc_info()[1], Cancelled):
            return 0
        logging.getLogger('desktop').exception('Desktop launch failed')
        location = str(paths.logs_dir / 'desktop.log') if paths else 'your writable data folder'
        message = f'Ultra Studio could not open. See {location} for details.'
        # Known user-actionable failures are safe to display without a traceback.
        error = sys.exc_info()[1]
        if isinstance(error, RuntimeError):
            message = f'{error}\n\nLog: {location}'
        if args.smoke_test or args.setup_smoke_test:
            if sys.stderr is not None:
                print(message, file=sys.stderr)
        else:
            show_error(message)
        return 1
    finally:
        if service is not None:
            service.stop()
        if handler is not None:
            logging.getLogger().removeHandler(handler)
            handler.close()


if __name__ == '__main__':
    raise SystemExit(main())
