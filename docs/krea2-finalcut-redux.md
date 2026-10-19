# Krea 2 FinalCut V1 Redux — native-loader baseline

Ultra Studio workflow: **Krea 2 · FinalCut V1 Redux (Comfy Quants)**.

Required files in ComfyUI:

- `models/diffusion_models/krea2FinalcutV1Redux_comfyQuants.safetensors`
- `models/text_encoders/qwen3vl_4b_fp8_scaled.safetensors`
- `models/vae/qwen_image_vae.safetensors`

The model basename was supplied without an extension; this recipe assumes `.safetensors`. If Windows hides extensions, check the actual filename before renaming anything. Subfolders are resolved through Ultra Studio's existing exact-file validation; another Krea model is never substituted when this file is missing.

The graph uses UNETLoader with weight_dtype=default, CLIPLoader type=krea2, the separate Qwen Image VAE, EmptyLatentImage, KSampler, VAEDecode and SaveImage. Positive and negative text inputs remain connected; at CFG 1, negative guidance has no effect. No extra LoRA is required. The training description's mention of PONY does not change this graph into an SDXL/Pony workflow.

Start with one image at 768×1024, 10 steps, Euler, CFG 1, simple scheduler and denoise 1. The supplied creator description recommends 8–12 steps and Euler or similar. CFG 1 and the simple scheduler are Krea Turbo starting assumptions, not independently verified FinalCut recommendations. Steps and CFG remain adjustable through the existing krea2_test profile rather than being forced to the original Turbo defaults.

The creator's 1536×2440 claim is not a guaranteed 12 GB GPU setting. Establish a working small render on the RTX 4070 SUPER first. Ultra Studio currently caps requested dimensions at 2048, so 2440-pixel output is not enabled by this change.

## Quantization compatibility

Comfy Quants is a family of formats, not one loader. Its official format table distinguishes native formats from formats requiring dedicated loaders: https://github.com/Comfy-Org/comfy-quants#quantization-formats

The exact file metadata, creator workflow and local GPU load were unavailable. This is a native-UNETLoader baseline, not a verified guarantee for this particular quant. Keep weight_dtype at default. If ComfyUI reports unsupported quantization, unknown tensor layout or model type, capture that error and obtain the creator's loader requirements before changing CUDA/PyTorch or installing custom nodes. The workflow's filename/node validation cannot detect unsupported tensor formats inside an otherwise listed file.

## Enable in Ultra Studio

1. Restart ComfyUI after adding the diffusion model.
2. After merging this change, pull main and rebuild Docker Compose.
3. In Settings → Workflow library, refresh bundled workflows.
4. Enable/select **Krea 2 · FinalCut V1 Redux (Comfy Quants)** in the builder workflow list if your visibility settings hide it.
5. Test one ordinary photograph at the baseline settings above.

`backend/seed_workflows/krea2_finalcut_redux.json` is the ComfyUI API-format graph used by Ultra Studio; it is not a positioned ComfyUI canvas document. Existing workflows and the selected default are unchanged.
