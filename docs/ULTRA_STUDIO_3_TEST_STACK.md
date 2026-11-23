# Ultra Studio 3 isolated test stack

Use this stack to run the development branch alongside an existing Ultra Studio install. It has no fixed container names, uses project-scoped database/render volumes, and does not publish MongoDB to a host port.

From the repository root in PowerShell:

```powershell
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml up -d --build
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml ps
```

Open `http://localhost:3013/settings`. In **Settings → ComfyUI**, set the URL to `http://host.docker.internal:8188` if ComfyUI is running on the same Windows computer, then save it. The **GPU memory & queue** panel reads the connected ComfyUI status.

To stop only this stack, run:

```powershell
docker compose -p ultra-studio3-test -f docker-compose.studio3-test.yml down
```

Do not add `--volumes` when stopping if you want the test database and renders preserved. This test stack uses isolated data volumes and does not access the production MongoDB or production render folders.
