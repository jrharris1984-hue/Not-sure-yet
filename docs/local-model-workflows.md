# Additional workflows using the installed models

Four separate workflows extend the existing library. No model downloads or automatic installations are performed. Filenames below were visible in the supplied screenshots; dispatch verifies that the running ComfyUI instance actually exposes them, including matching relative model subfolders.

| Workflow | Where to open it | Inputs |
| --- | --- | --- |
| FLUX.2 Klein 4B · Reference Image Edit | Tools → Edit a photo | 1–3 ordered reference images and an edit instruction |
| Qwen 2511 · Reference Image Composer | Tools → Edit a photo | 2–3 ordered reference images and a composition instruction |
| FLUX.1 Dev FP8 · Text to Image | Free Text to Image or the character builder | Text prompt |
| WAN 2.2 5B · Text to Video | Create → Text to video | Motion/scene prompt; no starting image |

The reference workflows open a dedicated editor on desktop and mobile. The numbered uploads retain separate file paths, and Gallery → Tools can supply image 1. Missing required references, duplicate filenames, gaps in numbering, and submission failures are shown without reporting a successful render. References and output dimensions are stored in render recipes. These two workflows are omitted from the character-builder dropdown because their required inputs belong in the dedicated editor.

## Files reused

| Workflow | diffusion_models | text_encoders | vae |
| --- | --- | --- | --- |
| Klein editing | flux-2-klein-4b-fp8.safetensors | qwen_3_4b.safetensors | flux2-vae.safetensors |
| Qwen composition | qwen_image_edit_2511_fp8mixed.safetensors | qwen_2.5_vl_7b_fp8_scaled.safetensors | qwen_image_vae.safetensors |
| FLUX.1 generation | flux1-dev-fp8.safetensors | clip_l.safetensors + t5xxl_fp8_e4m3fn_scaled.safetensors | ae.safetensors |
| WAN 5B video | wan2.2_ti2v_5B_fp16.safetensors | umt5_xxl_fp8_e4m3fn_scaled.safetensors | wan2.2_vae.safetensors |

Klein uses the installed standard Qwen 3 4B encoder, not the unverified custom NVFP4 encoder from the existing text-to-image graph. Existing workflows remain available. No required task LoRA or ControlNet is added. Native ComfyUI support for the listed nodes is required; update ComfyUI if dispatch reports missing nodes.

## Sampling and reference wiring

- Klein distilled: 4 steps, CFG 1, Euler, Flux2Scheduler. Each reference is scaled, VAE encoded, and appended with ReferenceLatent to both conditioning branches. Its model is trained for reference editing; this is not a low-denoise copy of the source image. Output starts from an EmptyFlux2LatentImage canvas. Up to three references are exposed in this first editor.
- Qwen: 40 steps, CFG 4, Euler/simple, AuraFlow shift 3. TextEncodeQwenImageEditPlus receives ordered images on both conditioning branches. A fresh EmptySD3LatentImage provides the output canvas so composition is not forced to reconstruct image 1 alone. This is a baseline, not a promise of exact identity preservation.
- FLUX.1 Dev: 28-step default, CFG 1, Euler/simple, FluxGuidance 3.5. Uses ordinary image generation without pose preprocessing. The draft/balanced/quality recipes use 20/28/32 steps. ModelSamplingFlux dimensions track the selected canvas.
- WAN 5B: 30 steps, CFG 5, UniPC/simple, shift 8. Uses Wan22ImageToVideoLatent with no start_image, which creates the native 48-channel latent. Reusing the 14B EmptyHunyuanLatentVideo would be incorrect. Video dimensions are aligned to 32 and frame counts to 4n+1, and the normalized values are retained in the recipe. Draft/balanced/quality use 512×320/41 frames, 640×384/81 frames, and 832×480/121 frames.

FLUX.1 uses sampler CFG 1 with embedded guidance 3.5. Negative text is not an active edit control for the distilled Klein default at CFG 1, or the zeroed FLUX.1 negative branch.

## Enable and smoke test

After merging, pull main and rebuild Ultra Studio. Restart ComfyUI if files were moved, refresh bundled workflows in Settings, and enable the additions. Their filenames are matched against the connected ComfyUI model lists; a screenshot of another model directory alone does not establish that ComfyUI scans it.

Start with one small output and no optional LoRA. For Klein, change a clothed studio portrait's wall color. For Qwen, combine two separate clothed portraits into a studio group image. For FLUX.1, render a simple landscape. For WAN, start with a short sailboat scene. Check the intended change, reference order, actual output size and Gallery output before using larger settings.

Automated tests validate graph wiring, exact model resolution, reference order, recipe persistence, error handling and dispatch against mocked ComfyUI. They do not run GPU inference. On a 12 GB GPU, these configurations can require CPU/RAM offloading; multi-reference editing and video need a practical memory test. No runtime or visual-quality guarantee is made.

## Primary workflow references

- https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_flux2_klein_image_edit_4b_distilled.json
- https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
- https://huggingface.co/Qwen/Qwen-Image-Edit-2511
- https://comfyanonymous.github.io/ComfyUI_examples/wan22/text_to_video_wan22_5B.json
- https://huggingface.co/black-forest-labs/FLUX.1-dev
