# Ultra Studio 3.0 — Development and release gates

This document distinguishes implemented code from product readiness. Do not merge this branch into main or deploy to production until the gates pass.

| Phase | Committed scope | Remaining work |
|---|---|---|
| 1 — Photoshoot storyboard | Per-shot editor, ordering, drafts, preflight | Confirm all editor options match actual DNA schema; render and mobile tests |
| 2 — Virtual camera | Orbit UI, elevation mapping, rear-view prompt detection | Verify prompt and generated orientation across models |
| 3 — Character DNA | Controlled A/B dispatch/results and saved regional preferences; detailed sliders now include shoulders, arms, and calves with mapped prompt descriptions | Verify actual DNA shape, baseline capture, model effects and output consistency in isolated ComfyUI staging |
| 4 — Wardrobe/environment | Per-shot outfit, scene and lighting editing; named looks per character; 20 new layered outfit sets across activewear, formalwear, ceremony, seasonal layers and creative workwear | Full layered outfit composition inside the 3.0 storyboard, shared cross-device persistence, and live mobile validation |
| 5 — Local AI director | Studio 3 reviewable shot suggestions wired to the existing validated AI shoot-plan endpoint and editable storyboard | Verify local Ollama configuration, schema mapping for every supported control, and live assistant behavior |
| 6 — Video studio | Persistent editable clip timeline, motion/camera prompts, duration calculation, and clip-to-existing-generation-form handoff | Multi-clip queue orchestration, timeline-aware render results, stitching/export, and live video validation |
| 7 — Generation engine | Image/video workflow-kind checks, optional seed validation, ComfyUI offline warning, and required source-image checks in shared preflight logic | Registry lookup, model/workflow graph capability checks, GPU scheduling, and live ComfyUI validation |
| 8 — Premium responsive UX | Guided navigation model, stable category memory, refreshed champagne-and-steel-blue Studio palette, reduced-motion-aware view transitions and theme-aware focus states | Route/UI integration, accessibility and mobile usability tests |

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
Development foundations and selected UI features are committed. The shared generation preflight now rejects image/video workflow mismatches and missing source images for image-to-video, with unit coverage added. The CreationWorkbench section-memory effect now uses stable dependencies to address the recorded hooks-lint build blocker. Studio 3 now requests validated shot suggestions, keeps them in an editable draft, and applies them only after review. The default Studio theme now uses champagne gold and steel blue with smoother route/card transitions and reduced-motion support. The shared pose library adds 18 portrait and editorial poses used by the main builder and Studio 3 storyboard. The wardrobe catalog adds 20 layered outfit sets. Physique Studio adds shoulder, arm, and calf regions with detailed prompts; model-specific prompt tests have been added. Video mode now has a per-workflow persistent timeline editor; selecting a clip fills the existing generation form, where each clip is queued separately. The shot storyboard also saves named wardrobe/scene/lighting looks per character in browser storage. A/B results can now save the chosen region values back to the selected character while preserving its pose, camera and other subjects. Unit and integration tests are added but the Jest suite/build have not been run. Targeted source-level checks must still be run in the project runtime. End-to-end product phases 3–8 remain **incomplete**; the preflight does not inspect workflow graphs, installed models, or GPU capacity. Frontend tests, production builds, and ComfyUI validation have not been run for this increment; treat the code as unverified until the release blockers above pass.
