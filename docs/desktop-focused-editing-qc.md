# Desktop focused editing

Desktop editing required scrolling past long option lists to return to stage navigation. Appearance and wardrobe also displayed too many independent controls at once.

Appearance now has smaller named editing groups. Wardrobe retains its established categories. Each group shows compact field summaries, with only the chosen detail's controls open. Presets and their numeric size controls remain together so existing precedence and editing rules stay understandable. Saved selections remain visible in summaries when another detail is being edited. Custom imported fields remain in an Other details group. Outfit-controlled or locked fields are labeled, and outfit mode remains editable from the wardrobe controls.

A desktop Back/Next dock stays at the bottom of the viewport, navigates directly to the editing section, and provides review or save at the end. Simple navigation follows core sections; optional sections remain accessible through the existing category controls and are included when explicitly opened. Advanced view keeps the complete section sequence. Bottom padding prevents the dock from covering the last controls. Mobile uses its existing editor and navigation.

Regression checks cover focused-field rendering, edits retained across groups, existing-control fallback, complete field grouping including imported fields, wardrobe availability summaries, section navigation and optional-detail routes. No compiler, saved-DNA or rendering logic changes were introduced.

Validation: all 2,230 frontend tests across 131 suites passed. The production build and git diff --check passed. Live desktop visual feedback remains the next usability check.
