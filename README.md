# Ultra Studio · Character DNA Builder

Adult XXX character generator that dispatches to your local ComfyUI.
FastAPI + React + MongoDB. Runs entirely on your machine — nothing leaves your LAN.

---

## Quickest start — Docker (one command)

Prereqs: Docker Desktop (or Docker Engine + Compose v2).

```bash
git clone <your-repo-url> ultra-studio
cd ultra-studio
docker compose up -d --build
```

That's it. Open **http://localhost:3000**.

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001/api`
- Mongo: `mongodb://localhost:27017` (auto-persisted to `./data/mongo`)
- Renders: `./backend/renders` (mounted into the backend container)

On first boot the backend seeds all 6 workflows automatically. Head to **Settings** and:

1. Set **ComfyUI Server URL** to `http://host.docker.internal:8188` on macOS/Windows Docker Desktop, or `http://172.17.0.1:8188` on Linux — this is how a container reaches ComfyUI running on the host.
   - If you want to skip that, run ComfyUI in host-network mode or set `network_mode: host` on the backend service (Linux only).
2. Add your **OpenRouter API key** (optional — enables AI Assist).

Stop:
```bash
docker compose down
```

Update after pulling new code:
```bash
docker compose up -d --build
```

---

## Native start — no Docker

Prereqs: Python 3.11+, Node 20+, Yarn, MongoDB.

### 1. Install MongoDB and start it

```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community

# Windows
winget install MongoDB.Server        # then start the "MongoDB Server" service

# Linux (Ubuntu/Debian)
sudo apt install -y mongodb
sudo systemctl start mongodb
```

### 2. One-shot launcher

**macOS / Linux:**
```bash
chmod +x scripts/start-native.sh
./scripts/start-native.sh
```

**Windows:**
```
scripts\start-native.bat
```

The launcher copies `.env.example` files if needed, creates a Python venv, installs deps, and boots backend (`:8001`) and frontend (`:3000`).

### 3. Manual (if you prefer)

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

# backend
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Second terminal:
```bash
cd frontend
yarn install
yarn start
```

Open **http://localhost:3000**.

### 4. ComfyUI

```bash
python main.py --listen 127.0.0.1 --port 8188
```
The default Settings URL (`http://localhost:8188`) will Just Work in the native setup.

---

## Typical first-use flow

1. **Settings** → verify COMFY badge is green. If not, tap the URL, fix, save.
2. **Settings → Workflow library**: 6 workflows are pre-seeded (Chroma, Z-image Turbo, Qwen Edit, WAN 2.2 I2V, Face-Preserved, Pony V6 XL 5-LoRA). Change default if you prefer Pony.
3. Home → **New character** → run through the 13 sections (or hit **Star presets** → apply Ava Devine / Ebony Mystique / Gracie Bon etc.).
4. Pick workflow from the dropdown → tune LoRA sliders (Pony workflow) → hit **Render**.
5. Result lands in **Gallery** and on the character's page with the exact DNA snapshot.

---

## Model files you need on the ComfyUI side

The bundled workflows reference these files. If ComfyUI complains at dispatch, drop them into the matching folder in your ComfyUI install:

| Workflow                       | Checkpoint / model                                       | LoRAs / extras                                                                                                   |
| ------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Chroma1-HD · Golden T2I**    | `chroma1-hd-golden.safetensors`                          | —                                                                                                                |
| **Z-image Turbo · NSFW**       | `z-image_turbo_nsfw.safetensors`                         | —                                                                                                                |
| **Qwen Image Edit 2511**       | `qwen-image-edit-2511.safetensors`                       | —                                                                                                                |
| **WAN 2.2 5B · Image → Video** | `wan2.2_5b.safetensors`                                  | —                                                                                                                |
| **Face-Preserved · IPAdapter** | your SDXL base + `ip-adapter-faceid.bin`                 | InsightFace models                                                                                               |
| **Pony V6 XL · 5 LoRAs**       | `realismByStableYogi_ponyV2.safetensors`                 | `Realism_Lora_By_Stable_Yogi_Pony_V2`, `real-skin-slider`, `detail-slider-lora-ponyxl-sdxl`, `body-weight-slider-pony`, `breasts-size-slider-pdxl` |

If any file name in the seeded workflow doesn't match what you have locally, open **Settings → the workflow row → Workflow JSON** and edit the file name string in place, then Save.

### Optional Z-Image effect LoRA

The Z-Image workflow includes an **Optional Effect LoRA Slot**. On Windows, the
included installer downloads the optional `girls pee.safetensors` LoRA into the
shared ComfyUI model folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-zimage-pee-lora.ps1
```

Restart ComfyUI (or rescan models), refresh Ultra Studio, choose the LoRA in
**LoRA weights → Optional Effect LoRA Slot**, and raise model strength from
`0.00` only for renders that need the effect. Use optional LoRAs only with a
compatible base model.

For a menu of verified Z-Image Turbo quality, body, wardrobe, and optional
adult-effect LoRAs, use the curated downloader instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-curated-zimage-loras.ps1
```

Choose `R` for the recommended quality/body starter set, `A` for all 12 curated
items, `B` for the complete 30-file `qqnyanddld/nsfw-z-image-lora` collection,
or enter selected catalog numbers such as `1,2,3,5`. Existing downloads are
skipped across every curated subfolder, interrupted `.part` downloads can
resume, and files are organized under `models\loras\Z-Image\Curated`.

---

## Common gotchas

- **COMFY offline badge won't turn green in Docker** — you need `host.docker.internal:8188` (Mac/Windows) or the host's `docker0` IP `172.17.0.1:8188` (Linux). Localhost inside a container is the container itself, not your PC.
- **CORS errors from ComfyUI** — start ComfyUI with `--enable-cors-header "*"` (only needed if you tunnel it or run cross-origin).
- **Yarn install fails on Node < 20** — upgrade Node. This project uses React 19 and CRA5, needs Node 20+.
- **`.env` file not being read** — the backend fails fast on missing `MONGO_URL` / `DB_NAME`. If uvicorn crashes at startup, that's usually why. Copy `.env.example` again.
- **`yarn start` hangs in Docker on file changes** — already handled by `CHOKIDAR_USEPOLLING=true` in `docker-compose.yml`.

---

## Data & privacy

Everything stays on your machine:

- **Character DNA + renders** — Mongo + local disk (`./backend/renders`).
- **AI Assist prompts** — sent to OpenRouter only if you add a key; the model you configure is uncensored/NSFW-permissive.
- **Render dispatch** — goes to *your* ComfyUI URL, nothing else.
- **No auth, no telemetry, no external logging.** This is a single-user local tool.

# Install Ultra Studio on Android

Ultra Studio includes a Progressive Web App (PWA) shell. The Docker frontend
proxies `/api` to the backend, so the browser, API, gallery media, and live
render WebSocket can all use one address.

After the containers are running, expose the frontend through Tailscale HTTPS
from an Administrator PowerShell window:

```powershell
tailscale serve --bg http://localhost:3000
tailscale serve status
```

Open the HTTPS address printed by `tailscale serve status` on the Android phone.
Chrome will offer **Install Ultra Studio**. It can also be installed from
Chrome's three-dot menu with **Add to Home screen** or **Install app**.

To remove the Tailscale HTTPS proxy later:

```powershell
tailscale serve reset
```
