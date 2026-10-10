"""First-run native setup, available before WebView2 or ComfyUI are running."""
import queue
import threading
from services import Cancelled, ComfyService, check_cancel, install_comfy, load_config, nvidia_gpus, save_config


def service_setup(paths, reconfigure=False):
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk

    config = None if reconfigure else load_config(paths)
    service = ComfyService(paths)
    if config and config['mode'] == 'existing':
        return service, config
    root = tk.Tk()
    root.title('Ultra Studio setup')
    root.geometry('700x520')
    root.minsize(620, 480)
    frame = ttk.Frame(root, padding=24)
    frame.pack(fill='both', expand=True)
    ttk.Label(frame, text='Set up Ultra Studio', font=('Segoe UI', 20)).pack(anchor='w')
    ttk.Label(frame, text='Install a private ComfyUI, or connect to services you already have.\nYour existing Docker installation and ComfyUI folders are preserved.', wraplength=640).pack(anchor='w', pady=(12, 16))
    mode = tk.StringVar(value='managed')
    ttk.Radiobutton(frame, text='Install and manage ComfyUI for this Windows user', variable=mode, value='managed').pack(anchor='w')
    ttk.Radiobutton(frame, text='Use existing services (set their addresses in Studio Settings)', variable=mode, value='existing').pack(anchor='w', pady=(4, 12))
    gpus = nvidia_gpus() if config is None else []
    gpu_names = [f'{g["name"]} · {g["memory"]} MB · {g["id"][-8:]}' for g in gpus]
    ttk.Label(frame, text='NVIDIA GPU (install the NVIDIA driver first if this list is empty)').pack(anchor='w')
    selected = ttk.Combobox(frame, values=gpu_names, state='readonly')
    selected.pack(fill='x', pady=(4, 12))
    if gpu_names:
        preferred = next((i for i, g in enumerate(gpus) if '4070 SUPER' in g['name']), 0)
        selected.current(preferred)
    starter = tk.BooleanVar(value=True)
    ttk.Checkbutton(frame, text='Download starter SDXL model (6.9 GB; CreativeML Open RAIL++-M license)', variable=starter).pack(anchor='w')
    ttk.Label(frame, text='Starter pack uses built-in ComfyUI nodes. Other workflow packs require\ntheir own models and nodes. Allow 30 GB free for initial setup.', wraplength=640).pack(anchor='w', pady=(4, 12))
    model_folder = tk.StringVar()
    row = ttk.Frame(frame)
    row.pack(fill='x')
    ttk.Entry(row, textvariable=model_folder).pack(side='left', fill='x', expand=True)
    ttk.Button(row, text='Reuse models folder…', command=lambda: model_folder.set(filedialog.askdirectory(parent=root) or model_folder.get())).pack(side='right')
    status = tk.StringVar(value=f'Data and services: {paths.data_dir}')
    ttk.Label(frame, textvariable=status, wraplength=640).pack(anchor='w', pady=16)
    bar = ttk.Progressbar(frame, mode='indeterminate')
    bar.pack(fill='x')
    actions = ttk.Frame(frame)
    actions.pack(fill='x', pady=12)
    events = queue.Queue()
    cancel = threading.Event()
    outcome = []
    busy = False

    def progress(text):
        # Keep bounded even on fast local downloads; only newest status matters.
        try:
            while True:
                events.get_nowait()
        except queue.Empty:
            pass
        events.put(('progress', text))

    def work(chosen):
        try:
            if chosen['mode'] == 'managed':
                if config is None:
                    install_comfy(paths, progress, cancel, chosen['starter'], chosen['model_directory'])
                service.start(chosen['gpu'], progress, cancel)
                if config is None and chosen['starter']:
                    from starter_pack import test_render
                    test_render(progress, cancel)
            if config is None:
                check_cancel(cancel)
                save_config(paths, chosen)
            events.put(('done', chosen))
        except Exception as error:
            service.stop()
            events.put(('error', error))

    def begin():
        nonlocal busy
        if busy:
            return
        if config:
            chosen = config
        else:
            if mode.get() == 'managed' and selected.current() < 0:
                messagebox.showerror('NVIDIA driver needed', 'No NVIDIA GPU was detected. Install its driver and reopen setup, or choose existing services.', parent=root)
                return
            if mode.get() == 'managed' and 'RTX' not in gpus[selected.current()]['name']:
                messagebox.showerror('GPU support', 'This preview supports NVIDIA RTX cards. Choose existing services for other hardware.', parent=root)
                return
            chosen = {'version': 1, 'mode': mode.get(), 'gpu': gpus[selected.current()]['id'] if mode.get() == 'managed' else '',
                      'starter': starter.get(), 'model_directory': model_folder.get()}
        busy = True
        start_button.configure(state='disabled')
        bar.start()
        cancel.clear()
        threading.Thread(target=work, args=(chosen,), daemon=True).start()

    def close():
        if busy:
            cancel.set()
            status.set('Cancelling safely… extraction may need to finish first.')
        else:
            root.destroy()

    def poll():
        nonlocal busy
        try:
            while True:
                kind, value = events.get_nowait()
                if kind == 'progress':
                    status.set(value)
                else:
                    busy = False
                    bar.stop()
                    if kind == 'done':
                        outcome.append(value)
                        root.destroy()
                        return
                    if isinstance(value, Cancelled):
                        root.destroy()
                        return
                    start_button.configure(state='normal')
                    status.set(str(value))
                    messagebox.showerror('Setup needs attention', str(value), parent=root)
        except queue.Empty:
            pass
        root.after(100, poll)

    start_button = ttk.Button(actions, text='Continue', command=begin)
    start_button.pack(side='right')
    ttk.Button(actions, text='Cancel', command=close).pack(side='right', padx=8)
    root.protocol('WM_DELETE_WINDOW', close)
    root.after(100, poll)
    if config:
        # Subsequent launches only show startup progress; no repeat downloads.
        for widget in frame.winfo_children():
            if widget not in (bar, actions):
                try:
                    widget.configure(state='disabled')
                except tk.TclError:
                    pass
        root.after(50, begin)
    root.mainloop()
    if not outcome:
        service.stop()
        raise Cancelled('Ultra Studio setup was cancelled.')
    return service, outcome[0]
