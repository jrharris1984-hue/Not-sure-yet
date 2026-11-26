# Ultra Studio 3 isolated test stack

Use this stack to run the development branch alongside an existing Ultra Studio install. It has no fixed container names, uses project-scoped database/render volumes, and does not publish MongoDB to a host port.

## Start on Windows

From the repository root in PowerShell, point the test backend at the same host folder where ComfyUI writes its output. This machine's known path is shown below; change it if your ComfyUI output folder is different.

```powershell
$env:COMFYUI_HOST_OUTPUT_DIR = 'G:/Comfy.ui/output'
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml up -d --build
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml ps
```

The output directory must exist on Windows. You can check it first:

```powershell
Test-Path 'G:\Comfy.ui\output'
```

The test stack mounts that host folder at `/comfyui-output` in the backend. Gallery images may still display through ComfyUI's API without this mount, but file deletion requires the output file to be present at the mounted path. If the folder is not mounted or a Gallery record points to a file that has moved, the backend intentionally keeps the Gallery record and refuses the delete.

Open `http://localhost:3013/settings`. In **Settings → ComfyUI**, set the URL to `http://host.docker.internal:8188` if ComfyUI is running on the same Windows computer, then save it. The **GPU memory & queue** panel reads the connected ComfyUI status.

## Stop the test stack

```powershell
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml down
```

Do not add `--volumes` when stopping if you want the test database and renders preserved. This test stack uses isolated MongoDB and render volumes and does not access the production MongoDB or production render folders. The ComfyUI output mount is the explicit host folder set in `COMFYUI_HOST_OUTPUT_DIR`.
