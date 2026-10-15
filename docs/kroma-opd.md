# Kroma v0.3.1 Turbo OPD

Separate bundled image workflow: **Kroma · v0.3.1 Turbo OPD**.

## Installed files

Verified visible in the supplied screenshots under `G:\ComfyUI\Models`:

| File | Subfolder |
| --- | --- |
| kroma-v0.3.1-turbo-opd.safetensors | diffusion_models |
| qwen3vl_4b_fp8_scaled.safetensors | text_encoders |
| qwen_image_vae.safetensors | vae |

CLIPLoader uses type `krea2`. No LoRA is required or bundled. Existing optional LoRA selection remains available; compatibility of arbitrary installed LoRAs is not guaranteed.

Screenshots establish files exist in that folder, not whether the running ComfyUI instance scans it. Dispatch validates exact filenames through ComfyUI object_info, resolves local subfolders, and reports missing files/nodes instead of substituting another checkpoint.

## Sampling

The creator recommends 8–12 steps, CFG 1–1.5, mu 1.15, and current native Krea 2 support:
https://huggingface.co/lodestones/Kroma/blob/main/README.md

Default: 8 steps, CFG 1, Euler, simple scheduler. The creator does not specify sampler/scheduler; those two choices follow ComfyUI's official Krea 2 Turbo baseline rather than a claimed Kroma-specific creator recipe. Draft canvas is 768×1024; balanced 1024×1024; quality 1024×1536 with 12 steps. Manual sampling controls remain adjustable.

Native ModelSamplingFlux sets both base_shift and max_shift to 1.15. ComfyUI interpolates between these endpoints by canvas area; equal endpoints keep mu fixed at 1.15 for every canvas size. The model chain is UNETLoader → ModelSamplingFlux → KSampler → VAEDecode → SaveImage. This is a model sampling patch, not a nonexistent KSampler shift input. A real negative text encoder remains connected for manual CFG above 1.

Source implementation: https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_model_advanced.py

## Enable after merging

1. Pull main and rebuild Ultra Studio with Docker Compose.
2. Restart ComfyUI to rescan the downloaded files. Ensure it uses the model directory above.
3. In Ultra Studio Settings → Workflow library, refresh bundled workflows and enable Kroma.
4. Select **Kroma · v0.3.1 Turbo OPD** and begin with a neutral studio fashion portrait, no LoRA, Draft tier, one image.

Large model weights can require RAM offloading on a 12 GB GPU. Automated checks use mocked ComfyUI dispatch, not a GPU quality or memory test.
