# Focused wardrobe navigation

The Design view now has one wardrobe editor on desktop and mobile. It opens with the outfit mode and a compact current-outfit summary, followed by Clothes, Shoes, Layers, Accessories and Styling. Groups without active fields are hidden until Show inactive controls is enabled.

Choose a field using Editing. Only that field is displayed. Grouped choices use a Category dropdown and an open search across all categories, replacing the wall of category chips. Existing options, custom library fields, saved selections and field locks remain available. Direct setting-search requests can reveal inactive fields for inspection; outfit mode still controls whether they can be edited.

The Design sidebar expands one main group at a time and follows section changes. The empty desktop preview starts collapsed, becomes available when an image or running render exists, and can be opened manually. A manually hidden preview stays hidden. Your setup is expandable within the preview panel.

This changes the Builder Design view and mobile creation sheet; it does not replace the separate Studio Workspace layout or modify prompt compilation. The shared choice picker also gives wardrobe categories a compact selector in other editors that use DnaSection.

Validation: component tests cover browsing without data changes, mode locks, custom fields, inactive-field requests, sidebar navigation and preview visibility. The Windows UI runner now checks wardrobe navigation and retained selections at desktop, short-desktop and mobile sizes. Run scripts/Test-UI.ps1 after deployment to capture browser screenshots and traces. Browser execution was not available in the development environment.

Deployment: frontend rebuild only after pulling the merge.
