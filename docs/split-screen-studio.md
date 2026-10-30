# Split-screen Studio

At widths of 1280px and above, the Builder now opens with the editing form and image reveal side by side, including before the first render. Navigating to another detail keeps Split active. Explicit Edit/Preview choices are still available; the new layout uses a fresh tab preference so a previous automatic collapse does not hide the update. On shorter and narrower screens the normal page scroll and mobile sheets remain available. Wide, tall screens let the form scroll beside the sticky reveal.

The reveal displays ComfyUI preview frames when available, actual current-stage sampling progress and the backend queue position. A decorative skeleton is used before a preview arrives; it is not a percentage estimate. Prior images are labeled and are not blurred into a pretend new result. Completed output replaces the live draft. A per-node `executed` event no longer marks an entire graph done, and progress resets between jobs and sampling nodes. Builder shares one live subscription across its views.

## Generation shortcuts

Use **Set up modes** to assign a workflow to Turbo and Studio. The choices come from visible still-image workflows whose single KSampler defaults can be read and validated. Each shortcut applies that graph’s steps, CFG, sampler and scheduler, while keeping the chosen canvas size. Unreadable, linked-input and multi-sampler graphs remain in the normal workflow selector; this shortcut does not guess their settings. Assignments are shared between desktop and mobile in the current browser tab.

**Surprise me & generate** randomizes the scene and pose, preserves people/clothes/custom text/locks, checks structured consistency and submits exactly one image from that new snapshot. It runs through the existing model-aware compiler and preflight checks. Repeated clicks while a request is being submitted are ignored. Broader character randomizers remain available separately. One-click Surprise is disabled for image editing/video, Pose Assist, Ollama compilation and manual prompt overrides, with a reason shown. On mobile these shortcuts are in the generation settings sheet.

Character height never changes the output aspect ratio. Negative prompts, LoRA handling and checkpoint choice retain the existing model-specific policies. There is no universal CFG/step override and no promised generation time. Color choices retain readable names alongside larger, approximate swatches.

## Validation and rollout

Targeted frontend tests cover graph sampling validation, preservation of randomizer locks, mode mapping, queue/progress presentation, completed-output replacement, socket state reset and responsive preview navigation. Browser smoke checks include a Surprise dispatch preserving the selected wardrobe and submitting one image. Run the browser checks on the local app; this environment has no working browser installation. ComfyUI/GPU timing and output quality have not been tested here.

After merging, pull main, rebuild frontend, then run `powershell -ExecutionPolicy Bypass -File .\scripts\Test-UI.ps1`. No backend rebuild or model download is needed for this UI change.
