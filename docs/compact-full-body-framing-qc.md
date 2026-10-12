# Compact full-body framing

The reported Chroma Unlocked v50 output is 768 × 1152 pixels and crops the lower legs and feet in the image itself. The supplied editor screenshot has full-body framing selected. The positive prompt carries only a late `full body framing` label; rebuilding compact prose discarded the detailed compiler's stronger composition instruction.

Compact still-image prompts now put a concrete full-length camera instruction before appearance and wardrobe descriptions whenever the resolved framing is full body or wide shot: include the whole person from head to both feet, any worn footwear, and space above the head and below the soles. A reclining pose also requests space around the entire reclining body. Camera angle and pose wording remain selected. Portrait and other intentional crops do not acquire the full-length instruction. Multi-subject framing uses the resolved subject controls and does not change existing shared-camera resolution.

The bundled Chroma Unlocked v50 graph contains no crop or resize node. The uploaded PNG has no generation metadata, so its actual generation graph and enhancement steps cannot be verified from the file alone. This fix addresses an observable prompt weakness, not a confirmed runtime image-processing crop. Workflow settings and dimensions are unchanged.

Regression checks cover eight still-image compiler families, intentional tighter crops, wide reclining framing, subject-specific resolved controls, expanded catalog wording, source immutability and reported prompt word counts. Tests and production build verify compiler behavior; live GPU output still requires visual testing.
