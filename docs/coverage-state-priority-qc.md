# Clothing coverage owns garment state

Previously only some coverage modes suppressed Clothing state. Other choices, including custom library choices mapped to Use selected outfit, could retain conflicting state instructions.

Every active, resolved Clothing coverage selection now overrides Clothing state before garment compatibility and concealment checks. The render copy drops the state and its catalog snapshot; the saved character remains unchanged. Clearing coverage or selecting Use selected outfit restores the saved state, subject to existing garment compatibility rules. Full-set mode retains its existing ownership rules.

Validation covers every simplified coverage choice, authored state keywords across seven image compilers in compact and detailed formats, restored state after clearing coverage, and source immutability. All 2,193 frontend tests across 129 suites passed, along with the production build and git diff --check. No GPU rendering was performed.

The concurrent full-body report is separate: the updated prompt visibly includes the early full-length instruction, but the uploaded 768 × 1152 result still crops the lower legs. Neither that PNG nor the earlier uploaded image includes generation metadata. The bundled Unlocked v50 template has no crop node. Gallery appends enhanced to download filenames even when downloading the primary output, so the name alone does not establish an enhancement pass. Prompt compliance cannot be guaranteed from these compiler tests; a controlled seed and camera test is the next diagnostic step.
