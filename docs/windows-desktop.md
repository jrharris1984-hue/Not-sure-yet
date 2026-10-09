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
from live databases and require the explicit import described below. There is
no Windows installer yet. Existing Docker configuration and its render volume
retain their defaults.

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

## Remaining milestones

1. Bundle the backend and existing interface in a Windows desktop application.
2. Add first-run service setup: existing or managed ComfyUI, GPU checks, selected
   workflow packs, dependency downloads, model reuse, retry/resume, and readiness
   tests. Start with a tested hardware/workflow combination and expand coverage.
3. Build and test the installer on Windows, then add signed releases and updates.
   Review redistribution terms for the shipped software, custom nodes, and models.

Managed services must have an independent data folder and pinned versions. Use
existing model directories when selected by the user. App upgrades must preserve
user data, and removal of large models or renders must be an explicit choice.
