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
- FastAPI backend (`/app/backend/server.py`): `/api/health`, `/api/settings`, `/api/comfyui/health` + `/object_info`, full `/api/characters` CRUD + `duplicate`, `/api/renders` list + dispatch + poll + delete + cancel, `/api/ai/freeform|refine|suggest` (**Venice.AI** direct via httpx — uncensored model), `/api/ws/comfyui` WS proxy for live previews, `/api/kink_presets` CRUD, `/api/characters/tags` cloud
- **Photo Shoot**: `/api/shoots` CRUD, retry, sequential background dispatcher with pose+outfit+seed overrides; ComfyUI-offline tolerant. Shoot packs: Editorial, Boudoir, Portrait, Action, Explicit, Foot Set, Watersports Set, Kink Set.
- **Wet Dream Expansion (2026-02)**: 3 new DNA sections (Feet, Kink, Watersports) → wizard is now 16 steps. Intimate expanded with fluids/mess sub-block (cum_state, saliva, squirt, lactation, sweat, lube, tears). Scenario acts extended with extreme insertion / rough / cum play / fantasy groups. Single Intensity dial replaced with dual Explicit + Kink dials (multiplied into prompt independently). Raunch mode toggle per-character swaps editorial vocabulary for graphic vernacular in Venice prompts (Pony stays untouched). Pony builder gets canonical booru tag mapping (foot_focus, footjob, peeing, urine, watersports, shibari, bondage, ahegao, cum_in_pussy, etc.). 7 Kink Presets built-in (Foot Goddess, Piss Slut, Bound & Wrecked, Bukkake Queen, Puppy Pet, Lactation Mommy, Toilet Toy) + "save current" custom preset store.
- **Live Preview**: WebSocket proxy + `useComfyWs` hook + `LivePreview` component streams ComfyUI sampler previews (binary frames) and step progress inline in Builder render panel and Shoot frame cards.
- **Cancel Render**: `POST /api/renders/{rid}/cancel` calls ComfyUI `/interrupt` + `/queue` DELETE + local `cancelled` state. Stop button on every LivePreview overlay.
- **Tag Filters**: `GET /api/characters/tags` cloud with counts. Library chip row for AND filtering (`?tag=a&tag=b`). Builder TagInput chip editor.
- **Age safeguards**: negative prompt hard-locks "underage, child, teen, teenager, young girl, minor, kid, loli, shota" in both Venice and Pony builders — non-removable in every path. DNA age slider stays at 18-70 (min: 18).
- **Multi-Subject Individual Traits (2026-02)**: characters now hold a `subjects[]` array (up to 4) where each subject carries its own DNA + field_locks. Per-subject sections: identity, physique, face, hair, skin, intimate, feet, wardrobe, pose, kink, watersports. Shot-level shared: scenario, scene, lighting, camera, style. Auto-adds Subject B when the user picks cast_size≠solo or a pairing; auto-seeds age/ethnicity from the pairing (e.g. mother-daughter → B=21, inherits ethnicity from A; twins → B is a full clone). Copy-A→active button, Randomize-active vs Randomize-all buttons, per-subject Wet Dream. Prompt builders (`buildMultiVenicePrompts`, `buildMultiPonyPrompts`) emit per-subject clauses with cast headcount + solo-block negative. Backward compat: legacy single-DNA characters auto-migrate on load.
- **Venice.AI integration (2026-02)**: AI Assist now uses `api.venice.ai/api/v1/chat/completions` with `venice-uncensored` model. Key & model configured via `VENICE_API_KEY` / `VENICE_MODEL` env vars in `backend/.env`. OpenRouter is retained as fallback if the env var is missing.
- **Quick Create wizard (2026-02)**: joi.ai-inspired full-screen guided flow at `/character/new/quick` and `/character/:id/quick`. Presents one field at a time as big picture-cards (Unsplash stock photos for main options like ethnicity/body/outfit/environment, gradient tiles fallback). Persistent SVG silhouette portrait right side driven live from DNA (skin tone, body shape, hair length/color) + trait chip stack. Supports all 16 sections in sequence with skip/randomize/section buttons. Multi-subject switcher in the top bar. On finish, hands off to the detailed 16-section Builder for deep refinement. Toggle button (`btn-open-quick-create`) added to Builder header. Existing Builder gets a subtle amber/rose "hero glow" via `.builder-hero` class and softer chip motion (spring-eased translateY on hover/active).
- Mongo collections: `characters` (with `subjects[]` field), `renders`, `settings` (singleton), `shoots`, `kink_presets`
- Frontend routes: `/` Library, `/character/new`, `/character/:id` Builder, `/gallery`, `/settings`, `/shoots`, `/shoot/new/:cid`, `/shoot/:sid`
- Studio-dark theme, mobile bottom nav (5 tabs), data-testid coverage everywhere

## Prioritized backlog

### P0 (blocking)
- (none)

### P1
- Save Per-Character LoRA Weights & preferred workflow
- Contact Sheet Export (PDF/grid image of a shoot)
- WebSocket ComfyUI `/ws` for live progress — DONE
- Video-specific kink motion presets

### P2
- Now-Rendering floating strip (watch previews from any page)
- Shoot Presets (save entire shoot config)
- Auto-suggest tags from DNA on save
- LoRA/checkpoint pickers pulled from `/object_info`
- Save Custom Expansions (edit chip expansion phrases in Settings)
- Raw Prompt Override (advanced text area before dispatch)
- Multi-select Cast Type
- Fallback Per-Kind (image/video/edit)
- Render queue view / cancel button (per-render cancel — DONE)
- Prompt token weighting UI (e.g., `(term:1.2)`)

## Next tasks
- Contact Sheet Export
- Save Per-Character LoRA Weights + preferred workflow
- Per-Subject Pose Packs in Photo Shoot (different pose per subject per frame)
