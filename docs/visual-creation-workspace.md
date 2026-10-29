# Visual creation workspace

This redesign changes the Builder's creation experience, rather than adding another parallel editor. It builds on the merged workspace shell. The separate Tools drawer PR can be merged independently.

## Navigation and layout

The desktop category rail has grouped icons and an active-group treatment, with a section heading and previous/next category controls in the main editing area. A shared detail navigator offers direct selection plus previous/next buttons in both the general desktop editor and the focused wardrobe editor, including mobile wardrobe. Boundaries are disabled, custom destinations remain available, and navigation never edits character values.

## Selection experience

Text-chip choices become responsive cards with a labeled selected state and checkmark. Known color choices have approximate swatches; unknown or custom choices remain text labels. Existing pose illustrations and slider controls remain. The shared picker applies wherever DnaSection or GroupedChips is used.

Search is directly visible for longer lists. Selecting a cross-category search result retains the search; explicitly changing the browse category clears it. Favorites can save the current selection for a field and filter its picker without modifying DNA. Favorites are browser-tab preferences (sessionStorage), survive reloads in that tab and are not exported as character data or synced between devices. Short lists omit these extra tools.

## Visual treatment and motion

The Studio theme uses a graphite background, lavender navigation accents and mint selection feedback. Larger targets and a two-column choice grid support mobile. Hover feedback and short category transitions are restrained; reduced-motion preferences disable them. Selection no longer waits for an outgoing category animation before rendering the next controls.

## Scope and validation

Existing workflows, prompt values, custom labels, locks and pose/slider semantics remain. Gallery, Queue, Settings and the separate Studio Workspace route are not redesigned in this change.

64 tests across eight component suites passed; production build passed with the existing bundle-size warning. Windows smoke checks now exercise Favorites and previous/next detail navigation at desktop, short-desktop and mobile sizes. Live browser rendering and GPU generation were not available here; run scripts/Test-UI.ps1 after deploying and review the resulting screenshots.

Deployment after merging and pulling requires rebuilding frontend only.
