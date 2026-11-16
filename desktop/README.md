# Ultra Studio Desktop — isolated Phase 1 prototype

**Development prototype only. Not an installer, distributable application, or finished migration.**
This branch does not change the Docker application or main branch.

## Prerequisites

- Windows 10/11, Python 3.11, Node.js 20+, Yarn, and backend Python dependencies.
- An existing ComfyUI installation running on `127.0.0.1:8188` for local generation.
- Existing application data is **not** imported automatically.

## Run

From the repository root, in PowerShell:

```powershell
cd frontend
yarn install
$env:PUBLIC_URL = "/"
yarn build
cd ..
python -m venv .desktop-venv
.\.desktop-venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd desktop
npm install
$env:ULTRA_STUDIO_PYTHON = (Resolve-Path ..\.desktop-venv\Scripts\python.exe).Path
npm start
```

The launcher starts FastAPI on loopback port 18761, serves the React build on loopback port 18760, and opens an Electron window. It selects SQLite and stores prototype data under Electron's per-user data directory, **not the Docker MongoDB database**.

In Settings, configure ComfyUI to `http://127.0.0.1:8188` if needed. Do not import production data or delete old installations while testing.

## Limitations and verification gates

- Python, ComfyUI, and AI models are not bundled; a first-run setup assistant is future work.
- Only one instance should run; ports are currently fixed. A production launcher needs port allocation, an instance lock, and API access controls.
- No Windows runtime smoke test or end-to-end generation test has been performed yet.
- Existing database secrets and media files are not copied.
- The local web server is loopback-only. API security, protocol handling, WebSocket routes, and file/URL access require a dedicated security review before public distribution.
- On Windows, closing Electron should terminate the backend, but process-tree cleanup needs verification.
- A production installer must use packaged Python binaries and a signed release pipeline.

### Acceptance checklist

1. Launch with Docker stopped; verify SQLite-backed `/api/health`.
2. Open Character Builder, Randomizer Studio, Gallery, and Settings.
3. Detect and connect to local ComfyUI; refresh workflow/model inventory.
4. Generate one image and verify gallery persistence after restart.
5. Verify no data or media changes to the Docker installation.
6. Test app exit, missing ComfyUI, port conflicts, and restart recovery.
