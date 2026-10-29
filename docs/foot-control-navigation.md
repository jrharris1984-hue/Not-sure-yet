# Foot control navigation

Standard Builder now separates physical appearance from styling and composition, on desktop and mobile:

- **Appearance → Foot appearance:** arch, foot size, toe length and sole texture. Custom foot fields remain here.
- **Wardrobe → Foot styling:** nails, grooming, accessories, condition and the older hosiery setting.
- **Pose & Framing → Detail shots · Feet:** focus, framing, position, presentation and existing interaction choices.
- **Scene → Surface under feet:** the supporting surface.

The optional panels start closed and show one detail at a time. Foot appearance includes links to the related panels. Selected-detail navigation opens the appropriate destination. Existing mobile search routes can still open the original fields.

Values remain stored in `dna.feet`; no preset migration is required. Opening a panel does not enable Feet focus. Section and field locks remain effective. Reset, randomize and AI suggestions on standard Foot appearance are scoped to its visible appearance fields, preserving relocated values.

Existing prompt rules explain when shoes, coverings or framing prevent a detail from contributing. These notes describe prompt assembly, not a guarantee about generated pixels. The main wardrobe hosiery setting retains precedence over the legacy foot hosiery setting.

The dedicated Feet specialty workflow retains its full control set. No model settings, prompt mappings or generation rules change.

Validation: 44 targeted frontend tests cover destination completeness, saved-value preservation, specialty compatibility, locks, disclosure navigation, footwear notes and existing editor/mobile behavior. Production build checked separately. Live browser and generation testing must be done against the running application.
