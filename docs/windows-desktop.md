# Windows desktop implementation

Target: one Ultra Studio installer with a first-run setup that can use existing
ComfyUI/Ollama services or install managed copies and selected workflow packs.
Opening Ultra Studio should start its managed services without command windows.

## Milestone 1: writable data and migration snapshots

Implemented:

- `ULTRA_STUDIO_DESKTOP=1` selects `%LOCALAPPDATA%\UltraStudio` on Windows.
- `ULTRA_STUDIO_DATA_DIR` selects an explicit absolute data folder.
- Render uploads and cached images use `renders` under that folder. Bundled
  resources, including workflow JSON, continue to come from the application folder.
- The path module reserves `backups`, `logs`, `services`, and
  `ultra-studio.sqlite3` for subsequent desktop milestones.
- A utility reads all user MongoDB collections into a SQLite migration snapshot.
  It preserves MongoDB document identities and BSON types, custom fields,
  empty collections, secrets, saved characters, prompt libraries, shoots,
  workflows, and render/queue records. Inspection validates integrity, schema,
  identities, and counts without printing record contents.

Docker continues using **MongoDB by default**. Migration snapshots are separate
from live databases and require the explicit import described below. The setup
preview is described at the end of this document. Existing Docker configuration
and its render volume retain their defaults.

### Prepare a migration snapshot from the current Docker installation

Stop the backend and frontend to prevent data changes during export. Leave MongoDB
running. The export reads multiple collections; it does not provide a consistent
cross-collection snapshot while the application is writing.

From PowerShell in the repository folder:

```powershell
docker compose stop backend frontend
docker compose run --rm --no-deps -v "${PWD}/data:/migration" backend python desktop_data.py export --output /migration/ultra-studio-migration-01.sqlite3
docker compose run --rm --no-deps -v "${PWD}/data:/migration" backend python desktop_data.py inspect /migration/ultra-studio-migration-01.sqlite3
docker compose start backend frontend
```

The backend image must first be rebuilt from this change. Export never updates
MongoDB and refuses to overwrite an existing destination. Choose a fresh filename
for each backup. If export or inspection fails, retain the original data and
restart the application; do not proceed with migration.

The snapshot includes credentials saved in settings and AI secrets. Keep it
private. It contains database records and image references, **not the image or
model files themselves**. Back up `backend/renders` and your ComfyUI output folder
separately. Preserve the original `data/mongo` folder throughout migration.

For native installations with dependencies already installed:

```powershell
python backend/desktop_data.py export --mongo-url mongodb://127.0.0.1:27017 --database ultra_studio --output D:\UltraStudioBackups\migration-01.sqlite3
python backend/desktop_data.py inspect D:\UltraStudioBackups\migration-01.sqlite3
```

No data migration runs automatically at application startup. The snapshot utility
does not install software, change model paths, or modify the source database.

## Milestone 2: optional live SQLite storage

Set `ULTRA_STUDIO_STORAGE=sqlite` to use SQLite without a MongoDB service. Leaving
it unset selects MongoDB, including when `ULTRA_STUDIO_DESKTOP=1` is set.
The live database defaults to `ultra-studio.sqlite3` in the writable data folder.
`ULTRA_STUDIO_SQLITE_PATH` can select another absolute filename. Unknown provider
names and migration snapshots used as live databases are rejected.

The provider implements the application's document queries, projections,
character thumbnails/tag aggregations, settings, shoots, gallery, secrets,
and queue operations. Conditional queue updates and compound unique indexes run
in SQLite write transactions; uncertain render submissions retain the existing
conservative recovery behavior. Unsupported query/update operations raise errors.
BSON payloads and unknown fields are preserved. Common string `id` lookups are
indexed; other queries currently scan collection documents. Large-library
performance and Windows installer behavior still need testing.

### Import a snapshot into a NEW database

Keep the original MongoDB data and snapshot. Stop the application that would use
the destination before importing. Import never overwrites an existing filename,
merges into an existing database, or downloads image/model files. It validates a
consistent copy and checks media correction uniqueness before publishing.

Native PowerShell, with Python backend dependencies already installed:

```powershell
python backend/desktop_data.py import D:\UltraStudioBackups\migration-01.sqlite3 --output "$env:LOCALAPPDATA\UltraStudio\ultra-studio.sqlite3"
```

For an isolated Docker import test using the snapshot exported above:

```powershell
docker compose run --rm --no-deps -v "${PWD}/data:/migration" backend python desktop_data.py import /migration/ultra-studio-migration-01.sqlite3 --output /migration/sqlite-test/ultra-studio.sqlite3
```

The imported records keep their existing service URLs and image paths. Reuse the
original ComfyUI output location; copy local cached/uploaded renders into the new
data folder's `renders` directory. An imported queue retains queued/running jobs;
starting the backend can resume them. Use a fresh database for the isolated smoke
test below if you do not want existing jobs to resume.

### Test without changing the running Docker app

Rebuild first (`docker compose build backend`). Run the focused backend checks:

```powershell
docker compose run --rm --no-deps backend python -m unittest discover -s tests -p test_sqlite_storage_unit.py -v
```

For a separate, empty API on port 8002, choose an unused data folder:

```powershell
docker compose run --rm --no-deps -e ULTRA_STUDIO_STORAGE=sqlite -e ULTRA_STUDIO_DATA_DIR=/sqlite-test -v "${PWD}/data/sqlite-smoke:/sqlite-test" -p 127.0.0.1:8002:8001 backend
```

Open `http://localhost:8002/docs` to try character/settings/gallery endpoints.
`http://localhost:8002/api/health` reports `storage: sqlite`. Press Ctrl+C to stop
this test. The normal frontend still uses its existing backend on port 8001.
This is an API/storage test, not the desktop launcher or an end-to-end GPU render
test. Do not copy a live database alone while it is open: SQLite can also have
`-wal` and `-shm` files. Stop the backend cleanly before backing up the data folder.

For a native backend test:

```powershell
$env:ULTRA_STUDIO_STORAGE = "sqlite"
$env:ULTRA_STUDIO_DESKTOP = "1"
python -m uvicorn server:app --app-dir backend --host 127.0.0.1 --port 8002
```

To return a native backend to MongoDB, remove `ULTRA_STUDIO_STORAGE` and use its
original MongoDB environment settings. SQLite import/startup never modifies the
original MongoDB database. New SQLite edits remain in SQLite; switching providers
does not synchronize changes between them.

## Milestone 3: desktop launcher and portable Windows build

The `desktop/main.py` entry point starts the SQLite backend on loopback, waits
for storage readiness, and opens the existing React interface in a native window.
The API and interface share one origin, including WebSocket previews and uploads.
It normally uses port 8765 and chooses another free port if that port is occupied.
Closing the window stops this app's API and queue worker; it leaves independently
started ComfyUI/Ollama services running. Accepted ComfyUI renders can continue
there; reopening Ultra Studio resumes polling the saved queue.

Desktop storage is always SQLite in `%LOCALAPPDATA%\UltraStudio`, or the absolute
folder selected with `ULTRA_STUDIO_DATA_DIR`. The desktop launcher selects the
SQLite filename in that folder rather than using `ULTRA_STUDIO_SQLITE_PATH` from
an unrelated development environment. One desktop instance can use a data folder
at a time. The database, uploaded/cached renders, logs, and WebView profile are
outside the application package and survive replacing the portable app folder.
Bundled files are read-only resources. No data import happens automatically.

### Download a Windows preview without building locally

The **Windows desktop preview** GitHub Actions workflow runs for launcher pull
requests and can also be started manually after this workflow is on `main`:

1. Open the repository's **Actions** tab and select **Windows desktop preview**.
2. Select a successful run. For a new manual build, choose **Run workflow** on
   `main`, then wait for it to finish.
3. Download the **UltraStudio-Windows-x64-preview** artifact from that run.
4. Extract the entire ZIP. Open `UltraStudio.exe`; keep `_internal` beside it.

The package includes Python, backend dependencies, the built interface, and
workflow JSON templates. Running it does not require Docker, MongoDB, Node.js,
or an installed Python interpreter. It targets Windows 10/11 x64 with Microsoft
Edge WebView2 Runtime and .NET Framework 4.6.2 or later. If the window cannot open,
check `logs/desktop.log` in the data folder; a missing WebView2 Runtime must be
installed separately in this preview. This is a portable testing build, not a
signed installer. GPU/model/service setup is not bundled yet.

The workflow compiles on Windows, runs desktop/SQLite tests, and starts the actual
frozen executable twice with an isolated data folder from another working
folder. This verifies backend and bundled resources; an actual Windows window
and GPU render still require manual testing.

### Fresh laptop checklist

A laptop with no ComfyUI/Ollama installed can still test the desktop interface:

- Run the setup executable, then choose existing services to test the interface
  without installing ComfyUI, Docker or Python. Alternatively use the portable app.
- Create a character, edit it, and save it. Visit the library and reopen it.
- Change a setting, close the window, and reopen the executable. Confirm your
  character and setting remain saved.
- Resize the window and navigate between pages. File upload and JSON library
  import/export should work through the normal app controls.
- Start a second copy: it should report that the data folder is already in use.
- Confirm a missing ComfyUI connection appears as unavailable rather than
  preventing the app from opening. An image job waits for ComfyUI; this preview
  cannot generate an image without that service and its models.

For image generation, configure a reachable ComfyUI installation in Settings,
either on this laptop or on your existing PC. New desktop settings default to
`http://localhost:8188` for ComfyUI and `http://localhost:11434` for Ollama.
Imported Docker settings retain their old URLs; update those URLs when moving
to native services. Ollama is optional; AI Assist still needs its selected service.
Managed NVIDIA ComfyUI and the SDXL starter can now be installed through first-run
setup; automatic Ollama and other workflow packs remain future milestones.

The desktop starts with a separate empty library. To import existing data, close
it first and use the explicit snapshot import from milestone 2. Do not delete the
original Docker data. Desktop edits do not sync back into MongoDB. Back up the
complete desktop data folder only after closing the window cleanly.

### Build locally on Windows (developer option)

Building requires Python 3.11 x64 (with the `py` launcher), Node.js 22 with
Corepack available, and internet access for dependency downloads. Use the
repository's Windows script from PowerShell:

```powershell
cd "$env:USERPROFILE\Not-sure-yet"
./scripts/build-windows-desktop.ps1
```

It uses a dedicated `desktop/.venv`, builds React with same-origin API URLs, and
packages the backend/interface with PyInstaller. Output is
`desktop/dist/UltraStudio/UltraStudio.exe`; distribute that **entire folder**.
It does not package `.env`, MongoDB data, cached renders, or model folders.

For a source GUI launch after building the interface and installing
`desktop/requirements.txt` into a Python environment:

```powershell
python desktop/main.py
```

For a non-GUI bundle check in a separate new folder:

```powershell
$env:ULTRA_STUDIO_DATA_DIR = "$env:TEMP\UltraStudioSmoke"
./desktop/dist/UltraStudio/UltraStudio.exe --smoke-test
Remove-Item Env:ULTRA_STUDIO_DATA_DIR
```

Smoke tests start the backend and seed settings, so use an empty data folder.
Avoid using an imported queue for a build test: queued jobs can resume when the
backend starts. Rebuilds/upgrades must keep user data outside the portable app.

## Remaining milestones

1. Test the managed NVIDIA starter on clean Windows hardware and expand to more
   workflow/model/custom-node packs, automatic Ollama setup and other GPU types.
2. Add signed releases and updates after validating installation/restoration.
   Review redistribution terms for shipped software, custom nodes and models.

Managed services must have an independent data folder and pinned versions. Use
existing model directories when selected by the user. App upgrades must preserve
user data, and removal of large models or renders must be an explicit choice.

## Windows setup preview and managed NVIDIA starter

The Windows build workflow now produces **UltraStudio-Setup.exe** as well as the
portable archive. It installs the packaged app per-user, adds a setup/repair
shortcut, and installs Microsoft's signed WebView2 bootstrapper only when the
runtime is missing. Build with `scripts/build-windows-installer.ps1` on Windows;
Python/Node/Inno Setup are build-machine requirements, not end-user requirements.

First launch can leave existing services alone or install a private pinned
ComfyUI v0.39.0 NVIDIA portable runtime (2.0 GB). The driver must already be
installed. NVIDIA UUIDs select the GPU, preferring RTX 4070 SUPER if present.
Managed startup binds only loopback port 8188, verifies a CUDA device, and fails
if another service occupies that port. Studio owns/stops only the child it starts.
Closing Studio interrupts active managed renders; existing services keep running.
Use the Start menu setup/repair shortcut to switch modes or retry setup.

The optional starter model is SDXL Base 1.0 (6.9 GB), pinned by repository revision
and SHA-256, using only built-in nodes. Setup validates nodes/model detection and
runs a 512px eight-step test render before committing its configuration. It adds
one named starter workflow and initially selects it. Subsequent launches preserve
that workflow and the user's chosen default. Existing workflows are not replaced.
Other workflows listed in Studio are templates and still require their models
and custom nodes. Automatic Ollama and additional workflow-pack installation
remain future work; existing Ollama works through Settings.

Allow 30 GB free initially. Downloads are resumed with validated HTTP ranges and
published only after size/checksum verification. Extraction uses a private staging
folder; unexpected paths/symlinks are rejected. An existing unmarked service
folder or modified model file is preserved and reported, not overwritten. Retry
through setup/repair. Configuration lives in `desktop-services.json`; services in
`services/comfyui-v0.39.0`; download cache in `services/downloads`; logs in `logs`.
Application removal preserves this separate data folder, including models.

The optional reuse folder must be a **models** folder with `checkpoints`, `loras`,
`vae`, etc. as children. Paths are referenced, not copied; preserve those drives
when resetting Windows. Existing custom nodes are not automatically reused.
Back up the current Docker database with the migration commands above and copy
`backend/renders`, ComfyUI `output`, model folders, custom nodes, workflows and
`extra_model_paths.yaml` to a separate drive before resetting Windows. Test the
snapshot inspection and open copied images; retain originals until restoration
and a render have been verified. Prompt-library JSON alone is not a full backup.

The build checks native setup UI/archive dependencies in the frozen app, installs
it silently into a test directory, runs the installed API/UI smoke check, and
checks uninstall preserves its database. CI has no GPU and cannot validate actual
CUDA loading, multi-GPU selection or model rendering; those require a clean
Windows machine with the target GPU. This is an unsigned preview. Review
ComfyUI GPL-3.0, SDXL CreativeML Open RAIL++-M and runtime redistribution terms
before any commercial release. Upgrades do not update ComfyUI/models automatically.
