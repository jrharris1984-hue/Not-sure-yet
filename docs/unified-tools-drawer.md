# Unified Tools drawer

Desktop Design now opens supporting tools in a right-side modal drawer instead of expanding the page above the editor. Character, Randomize, Creation mode (where available), Pins and Assistant each have a category button; one panel is visible at a time. Existing tool controls and actions are retained.

Tools mount on first opening, then remain mounted when switching categories or closing the drawer. This preserves unfinished forms and loaded tool results until the Builder is left. Close, Escape and clicking the backdrop dismiss the drawer and restore focus to its trigger. Pin navigation closes Tools before opening the destination.

Character presets use a portal inside the drawer's native modal layer. Escape closes the preset overlay first, leaving Tools open; closing the parent also dismisses its nested preset overlay. Standalone preset menus keep their original portal destination.

Mobile Quick tools uses the same category-navigation component within its existing bottom sheet. Existing randomizers, history, pins, section finder and setup summary remain, with character presets also available in the Character category. Mobile's remaining tools retain their existing access points; this change does not claim identical desktop/mobile tool inventories.

Validation: drawer and mobile component tests, production build, diff checks. Windows UI smoke checks include desktop tool navigation, nested presets, Escape behavior and focus restoration. Browser execution must be verified on the installed app; no live browser run was available here.

Deploy by pulling the merge and rebuilding frontend only. Prompt compilation, backend endpoints and saved character data are unchanged.
