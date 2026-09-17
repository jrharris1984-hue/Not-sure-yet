# Ultra Studio Character DNA Builder — PRD

## Original problem statement
Web-based, mobile-first personal tool for a solo user to design realistic adult characters via a structured "DNA" form, generate/refine traits with an LLM (OpenRouter, uncensored model), save a character library, and dispatch jobs to a local ComfyUI server for image/video output.

## User personas
- **Solo creator (you)** — single localhost user, no auth, single library.

## Core requirements (static)
- Sectioned DNA form (11 sections: Identity, Physique, Face, Hair, Skin, Wardrobe, Pose, Scene, Lighting, Camera, Style)
- Sliders, chips, searchable dropdowns; live prompt-string preview; randomize/lock/reset per section
- AI assist via OpenRouter: freeform→DNA, refine, per-section suggest (user-configurable NSFW-permissive model)
- ComfyUI integration: user-supplied server URL + user-supplied workflow JSON, dispatch via `/prompt`, health check, offline-tolerant
- Character library in MongoDB (search, favorite, duplicate, delete, import/export JSON)
- Gallery of renders linked to character + DNA snapshot
- Dark studio theme (mobile-first + desktop 3-pane)
- No auth. All NSFW content stays local.

## What's been implemented (2026-02)
- FastAPI backend (`/app/backend/server.py`): `/api/health`, `/api/settings`, `/api/comfyui/health` + `/object_info`, full `/api/characters` CRUD + `duplicate`, `/api/renders` list + dispatch + poll + delete, `/api/ai/freeform|refine|suggest` (OpenRouter direct via httpx)
- **Photo Shoot (2026-02)**: `/api/shoots` CRUD (`POST/GET/DELETE`), `/api/shoots/{id}/retry/{frame_index}`. Sequential background dispatcher builds N frames (4-20) applying pose + outfit + seed overrides per frame; ComfyUI-offline tolerant. Frames linked to `renders` via `shoot_id` + `shoot_frame_index`. Seed modes: `same` / `character_pose` (base + i) / `fresh`.
- Mongo collections: `characters`, `renders`, `settings` (singleton), `shoots`
- Frontend routes: `/` Library, `/character/new`, `/character/:id` Builder, `/gallery`, `/settings`, `/shoots`, `/shoot/new/:characterId`, `/shoot/:shootId`
- Photo Shoot UI: 3 pose modes (Random / Pack / Manual pick), curated pose packs (Editorial, Boudoir, Portrait, Action, Explicit), outfit rotation across shots, scenario lock toggle, seed mode selector, live shot-list preview, per-frame retry, delete shoot
- Studio-dark theme (Outfit/Manrope/JetBrains Mono, amber+emerald accents, grain overlay, hairline borders, chip pills, tactile sliders)
- Mobile bottom nav (5 tabs) + desktop 3-pane builder with sticky section rail
- Live prompt builder from DNA (`buildPrompts` in `lib/dna.js`) + copy-to-clipboard
- Randomize all / per-section, section lock, per-section AI suggest, export/import DNA JSON
- OpenRouter integration (user key in Settings, defaults to `cognitivecomputations/dolphin-mixtral-8x7b`)
- ComfyUI dispatcher: paste-your-own workflow JSON with configurable positive/negative prompt node IDs; graceful `offline` status when ComfyUI unreachable; seed override auto-patches `seed` and `noise_seed` on all sampler nodes
- data-testid coverage on every interactive control

## Prioritized backlog

### P0 (blocking)
- (none)

### P1
- Save Per-Character LoRA Weights & preferred workflow (recall exact tuning on re-render)
- WebSocket live progress from ComfyUI (currently polls `/history` every 2.5s)
- Video workflow polish (audio, frame count, aspect from DNA `camera.aspect_ratio`)
- Tag chips + tag filter UI

### P2
- LoRA/checkpoint pickers pulled from `/object_info`
- Save Custom Expansions (edit chip expansion phrases in Settings)
- Raw Prompt Override (advanced text-area before dispatch)
- Multi-select Cast Type
- Fallback Per-Kind (image/video/edit)
- Optional Object Storage for gallery sharing
- Render queue view / cancel button
- Prompt token weighting UI (e.g., `(term:1.2)`)

## Next tasks
- Save Per-Character LoRA Weights + preferred workflow
- Wire WebSocket to ComfyUI `/ws` for live progress
- Tag input + tag filter chips in Library
