# Z-Image local dependency repair

The supplied ComfyUI log reports missing root-level `ZITnsfwLoRA.safetensors` paths on the base and four inactive placeholder nodes, plus `bbox/face_yolov8m.pt` missing from an empty detector list. Earlier log entries also show LoRA matrix-shape errors. Those earlier entries do not identify the adapter file or establish that they came from the same Z-Image job.

Z-Image dispatch now resolves installed model, encoder, VAE, active adapter, detector and upscaler filenames against the connected ComfyUI object_info lists. Exact paths are preferred; a unique matching basename can resolve a relocated file. Missing or ambiguous active adapters produce a clear setup failure rather than substituting an unrelated adapter. All changes apply to the dispatch copy; saved templates are retained.

Zero-strength model-only LoRA placeholders are bypassed after user overrides are applied. This avoids ComfyUI rejecting an unused filename. Nonzero overrides remain active and must resolve correctly.

For the recognized bundled original/enhanced topology only, missing optional detector/detailer/upscaler dependencies remove the enhanced output and its unused ancestors while retaining the original image. Other custom outputs are not automatically removed. Queue and render metadata display a note explaining the original-only output. No enhanced result is fabricated. Existing complete setups retain their enhancement branch.

A separate **Z-Image Turbo · Base (No LoRA)** workflow uses `z_image_turbo_bf16.safetensors`, `qwen_3_4b.safetensors` (CLIP type lumina2), and `ae.safetensors`. These filenames were visible in the supplied model screenshots. It has no required LoRA, detector or upscaler, and provides a general-purpose baseline independent of the legacy enhancement chain. Clear optional LoRA selections when using it to diagnose adapter problems.

After merging, pull main and rebuild. Restart ComfyUI if files were moved. Existing Z-Image workflows receive runtime path repair; refresh bundled workflows in Settings to add the Base entry. Test a simple landscape with no optional LoRA first. Earlier tensor-shape errors are not fixed by renaming files: a base-only render helps isolate incompatible adapters, whose training model must match the selected diffusion model.

Validation covers relocated files, ambiguous/missing active adapters, inactive placeholders, nonzero overrides, missing enhancement dependencies, base-only operation, actual dispatch with mocked ComfyUI, template immutability, and Queue notes. No local GPU execution or adapter tensor-header validation was performed.
