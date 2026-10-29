# Unified workspace shell — first pass

The Design editor now uses one detail selector instead of a grid of field cards. Existing category groups, setting search, custom fields and selected-value summaries remain. Switching from Advanced to Simple retains the current optional detail, so the user does not lose their place.

The toolbar puts workflow selection inside a labeled menu showing the current workflow name. Escape closes the menu and restores focus. Character name, Save and Render remain in the toolbar. Model choices and generation behavior are unchanged.

Desktop views are explicit: Edit, Split and Preview. Split requires at least 1280px; narrower desktop windows offer Edit and Preview. Resizing a saved Split view to a narrow width shows Edit. View changes preserve the mounted editor and its unsaved state. Category/detail navigation returns to Edit. The view preference is scoped to the browser tab. Mobile keeps its existing Edit/Preview/Results navigation and bottom action dock.

The Studio theme uses quieter supporting surfaces and fewer raised controls. The central editor retains subtle depth. Choice lists use the surrounding editor/page scroll instead of their own 360px scroll area; existing pagination still bounds long lists. Tools remain in the existing expandable Tools section for this pass; a unified Tools drawer is future work.

Validation: 42 component tests across five suites; production build (existing bundle-size warning); UI runner syntax and diff checks. The Windows browser checks now exercise Edit/Preview retention, workflow-menu keyboard dismissal and Split before preview expansion. Browser execution and visual verification on the user's app remain pending.

Deployment after merging and pulling: rebuild frontend only, refresh, then run scripts/Test-UI.ps1. Backend and prompt data are unchanged.
