# Ordered fashion and lifestyle shot sets

Open a character's Photo Shoot, then choose **Shot list → Ordered shot sets**.
The initial set contains four standing shots: front, three-quarter, side and back.
Add chair, couch or bedroom lifestyle sets and choose a clothed outfit for each new set.

Expand a shot to change its pose, view, framing, camera height or outfit.
Move shots up or down, or remove them. The shot count follows the reviewed list,
up to 40 frames. Empty lists cannot be queued. Switching setup sections keeps the list.

Use **Set & lighting** for one shared room, background and lighting. Living room
and bathroom are available as environment choices alongside studio and bedroom.
Add appropriate furniture to the shared background when using seated sets.
Changing a set does not move the character to another location automatically.

Ordered sets replace pose, outfit and expression rotation while enabled, and
turn off the existing coverage sequence. They are a separate fashion/lifestyle
planning mode, with no exposure progression or specialty detail sequence.

Every frame is compiled from its reviewed selections. Front/side/back view and
camera height are separate controls. Saved hand position and face-focus choices
are replaced to avoid fighting the selected pose or rear view. Per-frame camera
height is also applied to queued DNA, not only to the preview prompt.
Shot labels are persisted and shown on the shoot's frame cards.

Match saved photo continues to use the same source photo for every frame.
This helps retain identity, but generated views and clothing can still drift.
No live ComfyUI render is part of the automated tests.

## Code review

- `frontend/src/lib/lifestyleShotSets.js`: reusable templates and per-shot mappings.
- `frontend/src/components/LifestyleShotSets.jsx`: ordered list editor.
- `frontend/src/pages/ShootSetup.jsx`: preview compilation and queue payload.
- `frontend/src/lib/shootFrames.js`: per-frame camera DNA.
- `frontend/src/lib/shootPlanner.js` and `backend/shoot_planner.py`: camera mapping and override application.
- `backend/server.py`: saved shot labels and camera overrides.
- `frontend/src/pages/ShootDetail.jsx`: saved frame labels.
- `frontend/src/lib/dna.js`: additional room choices.

The shot-set definitions and editor can be reviewed independently of generation.
Automated checks cover ordering, empty-list handling, prompt views, saved camera
overrides and reuse of the character reference.
