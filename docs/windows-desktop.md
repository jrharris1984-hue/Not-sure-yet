# Windows desktop implementation

Target: one Ultra Studio installer with a first-run setup that can use existing
ComfyUI/Ollama services or install managed copies and selected workflow packs.
Opening Ultra Studio should start its managed services without command windows.

## Milestone 1: writable data and migration snapshots

Implemented in this change:

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

The running application **still uses MongoDB**. This snapshot is a verified input
for the upcoming desktop storage migration, not yet a database the application
can open. There is no Windows installer in this milestone. Existing Docker
configuration and its render volume retain their defaults.

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

## Remaining milestones

1. Implement and test the active SQLite storage provider and import from these
   snapshots, including queue recovery, queries, aggregation, and rollback.
2. Bundle the backend and existing interface in a Windows desktop application.
3. Add first-run service setup: existing or managed ComfyUI, GPU checks, selected
   workflow packs, dependency downloads, model reuse, retry/resume, and readiness
   tests. Start with a tested hardware/workflow combination and expand coverage.
4. Build and test the installer on Windows, then add signed releases and updates.
   Review redistribution terms for the shipped software, custom nodes, and models.

Managed services must have an independent data folder and pinned versions. Use
existing model directories when selected by the user. App upgrades must preserve
user data, and removal of large models or renders must be an explicit choice.
