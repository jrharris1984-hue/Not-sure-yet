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


def show_error(message):
    if sys.platform == 'win32':
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, str(message), 'Ultra Studio', 0x10)
    elif sys.stderr is not None:
        print(message, file=sys.stderr)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Ultra Studio desktop application')
    parser.add_argument('--smoke-test', action='store_true', help='Check bundled UI and backend without opening a window')
    args = parser.parse_args(argv)
    paths = None
    handler = None
    try:
        paths = prepare_environment()
        handler = configure_logging(paths)
        with InstanceLock(paths.data_dir):
            app = desktop_app(resource_frontend())
            runtime = BackendRuntime(app)
            try:
                url = runtime.start()
                if args.smoke_test:
                    verify_runtime(url)
                else:
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
        return 0
    except Exception:
        logging.getLogger('desktop').exception('Desktop launch failed')
        location = str(paths.logs_dir / 'desktop.log') if paths else 'your writable data folder'
        message = f'Ultra Studio could not open. See {location} for details.'
        # Known user-actionable failures are safe to display without a traceback.
        error = sys.exc_info()[1]
        if isinstance(error, RuntimeError):
            message = f'{error}\n\nLog: {location}'
        if args.smoke_test:
            if sys.stderr is not None:
                print(message, file=sys.stderr)
        else:
            show_error(message)
        return 1
    finally:
        if handler is not None:
            logging.getLogger().removeHandler(handler)
            handler.close()


if __name__ == '__main__':
    raise SystemExit(main())
