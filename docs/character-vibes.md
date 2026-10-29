# Character vibe (optional)

The former Archetype control is now labeled Character vibe (optional). It is an optional personality or mood cue, not a required step. The underlying identity.archetype key and every previous choice remain compatible with saved characters.

A Boudoir & portrait group adds Romantic muse, Natural confidence, Vintage glamour, Refined elegance, Playful charm, Quiet mystery, Bold confidence and Soft serenity. New prompt phrases describe presence or mood without assigning clothing, body features, pose, lighting or camera settings. Existing themed prompts retain their previous behavior; helper text explains that older themes may suggest styling.

Saved prompt libraries receive missing options once through character_vibe_version 1. Only the old default field labels are renamed; custom field labels, existing choice labels and keywords are retained. Removed fields are not recreated. After the update has run, later option deletions remain deleted. No library reset is needed.

Validation: 38 frontend tests and four backend migration/settings-handler tests passed; production build and Python compilation passed. The SQLite storage integration suite could not start because bson is not installed in this environment. Live browser and GPU generation checks were not run.

After merging and pulling, rebuild both backend and frontend. Find the control under Identity, then Character vibe (optional). Leave it unselected to omit a character theme.
