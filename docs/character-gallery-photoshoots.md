# Character galleries and Smart Photoshoots

Each character card on the roster has a Gallery link. The existing Gallery opens with a character ID filter, preserving thumbnail browsing, images and videos, edits, downloads, albums and comparison. The backend filters before pagination; the client loads every page rather than the older 500-image chooser limit. Records without a character ID do not belong to a character gallery. All renders remains available through a return link.

The roster's Smart Photoshoots entry and its per-character Shoot buttons now open /shoots. This combines the editable Smart Photoshoot style library and saved custom sessions in one area. A character picker filters the saved sessions and supplies both creation entries:

- Open Smart director: loads the saved character, selects Smart batch mode, starts with at least six shots, and opens the desktop review/mobile Create step. Rendering remains an explicit user action.
- Custom session controls: retains the existing continuity/reference tools, pose packs, outfit sequences and AI planner, plus persisted frame review, retries and ZIP downloads.

Existing custom session URLs and saved data remain valid. The two rendering engines are retained: Smart director batches still appear in the character Gallery, while persisted custom sessions appear in Saved sessions. This change consolidates navigation and management, not their database records or every planner control into a single editor.

Character Preview Lab stays a separate entry on the roster and Create page.

Character gallery navigation resets selection and the lightbox. Global cleanup actions are hidden there because their endpoints affect the full library; individual and selected-image actions remain available.
