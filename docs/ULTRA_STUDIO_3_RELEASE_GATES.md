# Ultra Studio 3.0 — Development and release gates

This document distinguishes implemented code from product readiness. Do not merge this branch into main or deploy to production until the gates pass.

| Phase | Committed scope | Remaining work |
|---|---|---|
| 1 — Photoshoot storyboard | Per-shot editor, ordering, drafts, preflight | Confirm all editor options match actual DNA schema; render and mobile tests |
| 2 — Virtual camera | Orbit UI, elevation mapping, rear-view prompt detection | Verify prompt and generated orientation across models |
| 3 — Character DNA | Controlled A/B dispatch/results and saved regional preferences; expanded body sliders are surfaced in workspace groups, every non-default numeric slider now receives its exact value cue, and shape descriptors reach Chroma, Krea 2 and Pony | Verify actual DNA shape, baseline capture, model effects and output consistency in isolated ComfyUI staging |
| 4 — Wardrobe/environment | Per-shot outfit, scene and lighting editing; named looks per character; 20 new layered outfit sets across activewear, formalwear, ceremony, seasonal layers and creative workwear | Full layered outfit composition inside the 3.0 storyboard, shared cross-device persistence, and live mobile validation |
| 5 — Local AI director | Studio 3 reviewable shot suggestions wired to the existing validated AI shoot-plan endpoint and editable storyboard; prompt library has full backup/restore, category packs, per-control batch edits, and a reviewed multi-category batch import with destination suggestions | Verify local Ollama configuration, schema mapping for every supported control, and live assistant behavior |
| 6 — Video studio | Persistent editable clip timeline, motion/camera prompts, duration calculation, and clip-to-existing-generation-form handoff | Multi-clip queue orchestration, timeline-aware render results, stitching/export, and live video validation |
| 7 — Generation engine | Image/video workflow-kind checks, optional seed validation, ComfyUI offline warning, required source-image checks, distinct installed LoRA paths with duplicate/root-path cleanup, and exact slider signatures in model prompts | Model/workflow graph capability checks, GPU scheduling, and live ComfyUI validation |
| 8 — Premium responsive UX | Guided navigation model, stable category memory, refreshed champagne-and-steel-blue Studio palette, reduced-motion-aware view transitions and theme-aware focus states | Route/UI integration, accessibility and mobile usability tests |

## Release blockers
1. Reinstall frontend dependencies and rerun the full Jest suite and production build. The Windows run supplied on 2026-11-23 had **25 failing suites and 63 failing tests**; the build completed successfully. Branch fixes since that run are not yet verified by a fresh full test run.
2. Confirm A/B dispatch payload against live backend schema and model compiler, including whether character DNA is nested under `dna.physique` and how `subjects` is stored.
3. Test queue status, image URLs and ComfyUI output from isolated staging; do not use production MongoDB or render directories.
4. Test browser refresh, switching characters, locked fields, failed/partial queues, and mobile layout.
5. Validate output consistency: same model/workflow, seed, camera, pose, scene and character reference; vary only selected physique region.
6. Do not auto-merge or start production Docker. Require explicit user approval for deployment.

## Test commands (PowerShell, separate checkout)
```powershell
cd C:\Users\jrhar\UltraStudio3-Test\frontend
corepack yarn install
$env:CI = 'true'
corepack yarn test --watchAll=false --runInBand
corepack yarn build
```

## Status
Development foundations and selected UI features are committed. Studio 3 can request validated shot suggestions, keep them in an editable draft, and apply them after review. The default Studio theme uses champagne gold and steel blue with reduced-motion-aware transitions and focus states. The shared pose library includes portrait and editorial poses and now maps every selectable body pose to a prompt and mannequin. The wardrobe catalog adds 20 layered outfit sets. Physique Studio adds shoulder, arm, and calf controls; detailed descriptors are now included by the custom Chroma, Krea 2 and Pony compilers, and numeric slider values are preserved in compiled prompts. An A/B comparison panel loads only when opened, so the regular character editor does not require its query provider just to render. The prompt library's new batch importer accepts JSON, CSV or line-based text, suggests categories and controls, flags matching labels as updates, and lets the user change destinations or skip rows before saving the draft. Imported prompts remain reviewable before they are applied to the Mongo-backed prompt catalog.

The supplied Windows validation log reports **25 failed suites, 190 passed suites, 63 failed tests, and 3,153 passed tests** on the earlier branch state. Its production build compiled successfully. The current isolated checkout has no installed frontend dependencies: installing packages stalled at registry resolution in this restricted runtime, so Jest and a fresh production build could not be run here. JavaScript syntax checks pass for the new batch importer and modified prompt compiler. Do not treat phases 3–8 as release-complete: A/B dispatch and image consistency, local Ollama behavior, ComfyUI workflow/model compatibility, GPU scheduling, video queue/export, and desktop/mobile usability still need full integration validation. Keep this branch separate; do not merge or deploy to production until the release blockers pass.
