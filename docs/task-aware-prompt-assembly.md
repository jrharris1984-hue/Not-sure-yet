# Task-aware prompt assembly

This phase addresses the image/video final-assembly finding in the workflow prompt audit.

A shared task policy distinguishes images, edits and videos independently of sampling profiles. Both image-to-video and text-to-video now reject automatic still-image photographic additions during final assembly, including callers that accidentally request them. WAN 5B and Sulphur/LTX aliases follow the same policy. Direct image-edit instructions also remain free of automatic photo boilerplate.

Builder text-to-video no longer prepends its still-image language lead or likeness trigger. Character selections, motion descriptions and additional user notes remain available. Explicit user text is not filtered; exact prompt replay preserves its original wording and whitespace.

Selected image LoRAs, their trigger words, likeness overrides and image LoRA controls are excluded from video dispatch. The saved selections are retained when switching back to an image workflow. LoRAs already embedded in the video graph, including acceleration adapters, are untouched. This change does not introduce a video LoRA picker.

Both video tasks display the final motion prompt. One payload helper supplies identical `prompt_positive` and `video_instruction` strings from that assembled result. The existing backend video path consumes `video_instruction` directly. Image-to-video still requires a starting image; text-to-video does not. Stale image Pose Assist state no longer redirects a text-to-video submission into image generation.

Validation: 87 tests passed across task policy, final assembly, model compilers, freeform generation and workspace generation. Integration-style unit probes run WAN I2V, WAN T2V, WAN 5B and LTX through compilation, final assembly and payload construction in Detailed and Scene formats. Tests cover exact text preservation, selected-adapter isolation, returning to images, custom video kinds and reference edits. Production build passed with the existing bundle-size warning.

Browser acceptance and GPU rendering remain pending. After rebuilding the frontend, choose an image LoRA, switch to each video task, and verify that the motion prompt and submitted metadata contain no added image trigger or final photo boilerplate. Confirm image-to-video asks for a source image, text-to-video opens without one, and returning to an image workflow retains its previous adapter selection. Existing video graph adapters should remain present.

This phase does not rewrite the model compiler's existing scene/anatomy wording, change sampling defaults, add an LTX-specific prose compiler, or benchmark output quality. Removing repeated compiler wording is a separate comparison task.
