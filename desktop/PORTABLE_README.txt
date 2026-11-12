Ultra Studio - Windows desktop preview

Extract the entire archive, then open UltraStudio.exe. Keep _internal next to
UltraStudio.exe. No Python, Node.js, MongoDB, or Docker installation is needed
to run this packaged app. Windows 10/11 x64 with Microsoft Edge WebView2 Runtime
and .NET Framework 4.6.2 or later is required.

This preview uses your existing ComfyUI and optional Ollama installations.
Start those services separately. In Ultra Studio Settings choose their URLs.
On the same Windows PC the defaults are localhost:8188 and localhost:11434.
Managed service/model installation is a later milestone.

The desktop library starts empty. It is separate from your current Docker app.
No existing database is migrated automatically. User data is saved under
%LOCALAPPDATA%\UltraStudio, outside this portable app folder. Closing the app
stops its local API and queue worker; ComfyUI/Ollama are left running. A render
already accepted by ComfyUI can continue there; reopen the app to resume polling.

Close Ultra Studio before copying its entire data folder for a backup or
replacing the portable app folder with a newer build. Keep your original
Docker data and ComfyUI outputs. Images referenced on other services remain
at their original locations.

If startup fails, read %LOCALAPPDATA%\UltraStudio\logs\desktop.log.
This build is a testing preview, not a signed installer or a commercial release.
