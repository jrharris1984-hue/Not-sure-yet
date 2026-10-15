Ultra Studio - Windows setup preview

Use UltraStudio-Setup.exe for a per-user installation, Start menu shortcuts,
and automatic Microsoft WebView2 installation when needed. Internet is required.
The first launch offers existing services or private managed ComfyUI. Managed
setup currently supports modern NVIDIA RTX GPUs with an installed NVIDIA driver.
Choose the GPU; setup prefers an RTX 4070 SUPER if detected.

Managed setup downloads pinned ComfyUI v0.39.0 (2.0 GB), its embedded Python/CUDA
runtime, and optionally SDXL Base 1.0 (6.9 GB). Allow at least 30 GB free initially.
Downloads resume after interruption and must pass SHA-256 checks. The starter
uses built-in nodes, performs a small GPU test render, and appears in the app as
Desktop starter - SDXL Base 1.0. Additional workflows need their own models/nodes.
Ollama installation and additional workflow-pack installers are not included yet.
Existing Ollama can be connected in Settings.

Managed ComfyUI starts with Studio on loopback port 8188 and stops when Studio
closes. Close another ComfyUI using that port or select existing services instead.
Existing services are never stopped or modified. Closing Studio with managed
ComfyUI interrupts any render still running in that private service.

Managed services, models, logs and the SQLite database live under
%LOCALAPPDATA%\UltraStudio, separate from application files. Uninstall preserves
this data. The desktop library is separate from Docker; no automatic migration.
Use the setup/repair Start menu shortcut to change service setup or retry it.
GPU drivers remain a Windows/vendor prerequisite and may require a reboot.

To use the portable archive, keep _internal next to UltraStudio.exe. No separate
Python, Node.js, Git, MongoDB or Docker installation is needed for the packaged
app. Windows 10/11 x64, WebView2 and .NET Framework 4.6.2+ are required.

Before reinstalling Windows, back up the Studio database and render files plus
ComfyUI models, custom nodes, workflows, output and extra model path settings.
A database migration snapshot contains records, not the images/models themselves.
See docs/windows-desktop.md in the source repository for migration instructions.

Close Studio before backing up its entire data folder. Models/images on external
services or directories must be backed up separately. Logs: logs/desktop.log and
logs/comfyui.log. This is an unsigned testing preview, not a commercial release.

Downloaded software/model notices:
ComfyUI: https://github.com/Comfy-Org/ComfyUI/tree/v0.39.0 (GPL-3.0)
SDXL Base 1.0: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
Model license: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md
WebView2: https://developer.microsoft.com/microsoft-edge/webview2/
