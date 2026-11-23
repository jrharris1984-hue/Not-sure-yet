# Ultra Studio 3.0 — Foundation

Status: development branch only; not merged or locally verified.

## Goals
- Make a complete photoshoot easy to direct, review, and refine.
- Preserve 2.0's existing generation endpoints, saved characters, LoRA configurations and workflows.
- Treat subject orientation, camera elevation and shot framing as independent controls.
- Keep mobile usable without hiding advanced capabilities.

## Phase 1 — Editable Smart Photoshoot Director
1. Start with a saved character and optionally a reference image.
2. Pick a reusable photoshoot template and a shot count.
3. Generate a structured storyboard; each shot independently stores pose, subject view, camera angle, lens, outfit, environment, lighting, seed and workflow selection.
4. Edit, duplicate, reorder and disable shots before queuing.
5. Compile the final per-shot DNA and show a human-readable preview before dispatch.
6. Use existing shoot API contracts unless a versioned migration is necessary.

## Phase 2 — Camera reliability
- Resolve subject orientation separately from camera height and tilt.
- Detect conflicting front-facing prompt fragments for rear-view shots.
- Test front, rear, rear three-quarter, left/right profile, high and low perspectives using fixed seeds.
- Track intended orientation versus rendered output; do not claim prompt instructions guarantee compliance.

## Phase 7 foundation — Engine validation
- Enumerate actual ComfyUI workflows and required nodes before assigning models/LoRAs.
- Validate inputs and GPU constraints before queuing.
- Preserve generation history and source references.

## Safety and compatibility
- Work only on feature/ultra-studio-3-foundation until reviewed.
- Never reset or clean the local production checkout.
- Keep backups of MongoDB and render volumes before any schema changes.
- Add unit tests for shot ordering, per-frame overrides, orientation prompt priority, and legacy shoot compatibility.
- Test desktop and mobile navigation and ensure the production workflow remains operational.

## Acceptance criteria for first release
- A user can create a 6-shot session from a template in under five choices.
- Every shot can have a distinct subject view and camera angle.
- Changes to one shot do not silently modify others.
- Storyboard changes survive navigation and appear in final queued frame payloads.
- Existing 2.0 shoots remain readable and queueable.
- No merge until code review, tests and an explicit release decision.
