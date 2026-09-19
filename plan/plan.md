# Revert joi.ai-inspired changes

## What this plan is

Undo everything that was added in the last round when the joi.ai-style layout was attempted. The multi-subject work and the Venice.AI wiring from earlier in the session stay untouched — this revert is scoped only to the joi.ai layer.

## Exact things being removed

1. **Quick Create wizard page** — the new full-screen guided flow at `/character/new/quick` and `/character/:id/quick`, including its top bar, progress bar, big picture-cards, stock-photo image map, "Finish & open detailed builder" handoff, and the per-step Randomize / Skip / Next controls.
2. **Character portrait component** — the stylised SVG silhouette (head, hair, torso, trait chip stack) that was rendered on the right side of Quick Create.
3. **Quick Create routes** — the two `/quick` routes and the accompanying import wired into the router.
4. **"Quick Create ✨" button in the Builder header** — the fuchsia-tinted entry point next to Save / Render.
5. **Hero glow behind the Builder header** — the `.builder-hero` CSS class and the wrapper class applied at the top of the Builder page.
6. **Chip motion tweaks** — the softer spring-eased chip hover / active state (translateY lift, stronger amber glow, extended transition) added in the same round. Chips return to their previous simpler border + background transition.
7. **PRD entry** — the paragraph describing "Quick Create wizard (2026-02)" is removed from `/app/memory/PRD.md`.
8. **Next-action items** that referenced Quick Create (e.g. "Save Whole Quick Create Preset", "Card Search") are also removed from the PRD backlog if present.

## What is NOT being removed (kept from earlier work)

- Multi-Subject Individual Traits — `subjects[]` model, Subject Switcher, auto-seed on pairing, Copy A → active, per-subject Randomize / Wet Dream, and the multi-subject prompt builders.
- Venice.AI wiring for AI Assist (freeform / refine / suggest) and the `VENICE_API_KEY` env config.
- All prior work: Photo Shoot, live preview, cancel render, tag filters, Wet Dream expansion, dual Explicit / Kink dials, Raunch mode, warmer palette, Grouped Section Rail, DnaAtAGlance, Now-Rendering strip, per-slider padlocks, collapsible panes, mobile overflow cleanup.

## After the revert

The Builder returns to the state it was in right before the joi.ai attempt — the 16-section wizard, section rail on the left, prompt preview on the right, standard chip hover behaviour, no hero glow, no Quick Create entry point. Multi-Subject and Venice AI Assist continue to work.

## Confirmations / decisions

- No new joi.ai-alternative design is being proposed here. This is a pure revert. If a different take on joi.ai is wanted, it will be planned separately after this revert lands.
- Any character created via the Quick Create wizard before revert has already been saved through the normal `/api/characters` endpoint with the standard shape, so those characters remain fully usable in the reverted Builder. No data migration required.
- Nothing needs a database change.

## Open question

Is anything from the joi.ai attempt actually worth keeping? For example:
- a. Keep the softer chip hover motion (small polish, non-intrusive), remove everything else.
- b. Keep the subtle amber hero glow behind the Builder header, remove everything else.
- c. Remove absolutely everything — full revert, no exceptions.

If no reply, the default is (c) — remove absolutely everything.
