# Wardrobe overview and focused controls

The Builder's shared `DnaSection` (desktop and mobile editing sheets) and Studio workspace inspector now use the same wardrobe overview.

- **Choose an outfit** selects full-set mode, with existing set color, layer and coverage controls.
- **Build from garments** selects custom mode and restores previously saved individual choices. It does not split a complete outfit description into invented pieces.
- **Currently wearing** summarizes selections after the existing wardrobe resolution rules. It is a selection summary, not a guarantee of visible details in a generated image. Model/framing adjustments remain visible in the final prompt.
- Only four selected rows show initially; additional details expand on demand. Existing conflict explanations are available under **Why some choices are inactive**.
- Inactive controls are hidden by default, with **Show inactive controls** exposing them and their existing explanations. Mode-inactive groups are excluded from the default group chooser. No fields or values are deleted.
- A directly focused inactive field remains visible, including links from setting search. Studio search also retains inactive matches. Section and mode locks disable mode switches.

No prompt compiler, outfit data, saved character, randomizer or render settings are changed in this phase. Existing field labels and selection keys are retained. Complete outfit descriptions are not structured garment records; reliable per-piece customization requires a later data-model change. This update makes the existing mode behavior clear instead of silently converting outfits.

## Validation

62 tests across wardrobe overview, DnaSection, StudioWorkspace, wardrobe modes and workspace fields. Checks cover conflict resolution without input mutation, full-set exclusions, custom labels, locked mode changes, inactive-control reveal, directly focused fields, stored-choice restoration and navigation to complete outfit collections. Production build and whitespace checks also run.

Desktop/short-desktop/mobile visual checks and local rendering remain pending. In the UI, test a complete set with saved custom pieces, switch modes and back, reveal inactive controls, and open an inactive field through search. Existing saved pieces should return unchanged. Verify that the wardrobe summary remains readable on a narrow phone and the mode controls stack vertically.
