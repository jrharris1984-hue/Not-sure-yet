# Ultra Studio 3.0 — Development and release gates

This document distinguishes implemented code from product readiness. Do not merge this branch into main or deploy to production until the gates pass.

| Phase | Committed scope | Remaining work |
|---|---|---|
| 1 — Photoshoot storyboard | Per-shot editor, ordering, drafts, preflight | Confirm all editor options match actual DNA schema; render and mobile tests |
| 2 — Virtual camera | Orbit UI, elevation mapping, rear-view prompt detection | Verify prompt and generated orientation across models |
| 3 — Character DNA | Region presets, A/B recipe, dispatch, polling results, temporary preference | Verify actual character data shape, reliable baseline capture, model effects, persisted preference |
| 4 — Wardrobe/environment | Immutable look/scene merge utilities | Build searchable visual editor, saved look persistence, UI integration |
| 5 — Local AI director | Editable shot-plan draft utilities | Ollama endpoint integration, schema validation, approval/review UI |
| 6 — Video studio | Timeline draft, clip duration utilities | Existing video workflow integration, render status, editing/export UI |
| 7 — Generation engine | Image/video workflow-kind checks, optional seed validation, ComfyUI offline warning, and required source-image checks in shared preflight logic | Registry lookup, model/workflow graph capability checks, GPU scheduling, and live ComfyUI validation |
| 8 — Premium responsive UX | Guided navigation model | Route/UI integration, accessibility and mobile usability tests |

## Release blockers
1. Run frontend install, targeted Jest suite and production build. Fix failures.
2. Confirm A/B dispatch payload against live backend schema and model compiler, including whether character DNA is nested under `dna.physique` and how `subjects` is stored.
3. Test queue status, image URLs and ComfyUI output from isolated staging; do not use production MongoDB or render directories.
4. Test browser refresh, switching characters, locked fields, failed/partial queues, and mobile layout.
5. Validate output consistency: same model/workflow, seed, camera, pose, scene and character reference; vary only selected physique region.
6. Do not auto-merge or start production Docker. Require explicit user approval for deployment.

## Test commands (PowerShell, separate checkout)
```powershell
cd C:\Users\jrhar\UltraStudio3-Test\frontend
corepack yarn install --frozen-lockfile
$env:CI = 'true'
corepack yarn test --watchAll=false --runInBand
corepack yarn build
```

## Status
Development foundations and selected UI features are committed. The shared generation preflight now rejects image/video workflow mismatches and missing source images for image-to-video, with unit coverage added. End-to-end product phases 3–8 remain **incomplete**; the preflight does not inspect workflow graphs, installed models, or GPU capacity. Frontend tests, production builds, and ComfyUI validation have not been run for this increment; treat the code as unverified until the release blockers above pass.
