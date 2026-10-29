# Rounded, colorful creation interface

The default Studio theme now uses a softer violet canvas, rounded choice cards, pill-shaped controls and a raised action bar. Category accents distinguish People (blue), Appearance (lavender), Wardrobe (rose) and Scene (mint). Text and selected checkmarks remain the primary signals, so color is supplementary.

Desktop category headings have a short orientation hint. The sidebar uses colored icon tiles and highlights the active category group. Short desktop windows retain compact headings and cards. Mobile keeps the existing bottom-sheet workflow, with rounded sheets, tactile field cards and a clearer generation dock.

**All details** opens a grid of controls in the current editing group. It is available when there are more than three details, including custom fields. Choosing one closes the grid and returns focus to its trigger; Escape closes it without changing the selected detail. The existing select and previous/next controls remain available.

Choice groups use a short spring entrance. Selection checkmarks settle with a small spring animation; pointer hover and press provide immediate feedback. Reduced-motion preferences disable these effects. No continuous decorative animation or new animation dependency was introduced.

The rich palette applies to Studio; saved alternative color themes retain their palettes. Prompt values, rendering behavior and presets are unchanged.

## Validation

- 44 frontend tests passed across six suites, including custom-detail navigation, dismissal and focus restoration.
- Production build checked before publication.
- Browser smoke script extended to cover the detail picker on desktop, short desktop and mobile.
- Browser execution was unavailable here: the Chromium download returned an invalid archive. Run `powershell -ExecutionPolicy Bypass -File .\scripts\Test-UI.ps1` against the updated app to verify the three viewport layouts.

## Deployment

After merging, pull the updated main branch before rebuilding frontend. The visual refresh is under the default Studio theme. Backend changes are not required.
