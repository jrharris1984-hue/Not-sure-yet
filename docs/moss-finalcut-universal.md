# MOSS FinalCut Universal FP8 and Realistic Photography Krea2

## MOSS Image · FinalCut Universal FP8 (6 Step)

Files:

- `models/diffusion_models/mossImageFinalcut5GB_universal.safetensors`
- `models/text_encoders/qwen3.5_9b_w4a8_gptq.safetensors`
- `models/vae/flux2-vae_small.safetensors`

The supplied basename is assumed to have a `.safetensors` extension. This is a separate MOSS graph with native UNETLoader (default dtype), CLIPLoader type `moss_image`, EmptyFlux2LatentImage, real positive/negative text conditioning, KSampler and SaveImage. It does not reuse the Krea2 Qwen3-VL encoder or Qwen Image VAE. Exact files and the MOSS CLIP type are validated against ComfyUI before dispatch. Missing dependencies never silently switch to Krea weights.

Starts at 768×1024, one image, six steps, Euler, CFG 2.5 and denoise 1. Six steps, Euler and CFG 2–3 follow the supplied creator description for Universal FP8. The simple scheduler is a starting choice. No Turbo adapter or automatic prompt upsampler is added. Empty negative text is a baseline; the existing negative prompt editor remains connected. Requested dimensions are rounded down to multiples of 16 for MOSS.

The official template provides the Qwen3.5 W4A8 encoder and FLUX.2 small VAE paths, the moss_image CLIP type and FLUX.2 latent structure:

- https://huggingface.co/Comfy-Org/MOSS-Image
- https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_moss_image_base_t2i.json

A ComfyUI build with native MOSS support is required. On Desktop, model support may lag nightly releases. The selected Universal FP8 file's tensors and a local GPU render were unavailable here; no quality, speed, VRAM fit or quant-format compatibility guarantee is made. Begin at the baseline resolution before testing the creator's 1920×1280 claim. The quoted twofold quality comparison is the creator's claim, not an independently measured result.

Optional MOSS-trained LoRAs are offered from `models/loras/MOSS/`, MOSS Image folders, recognizable MOSS filenames or a manual MOSS family assignment. Qwen/Krea/FLUX LoRAs are kept separate despite the shared encoder or VAE families. No adapter is needed for the first test. The graph targets Universal FP8; it does not apply the different INT8 4-step recipe or claim NVFP4 LoRA support.

## Krea 2 · Realistic Photography (Baseline)

Assumes the additional download is a full diffusion model at `models/diffusion_models/realisticPhotography_krea2Turbo.safetensors`. Uses the installed `qwen3vl_4b_fp8_scaled.safetensors` encoder (type krea2) and `qwen_image_vae.safetensors`. Starts at 768×1024, 8 Euler steps, simple, CFG 1. Sampling remains adjustable through krea2_test, and the separate-model resolver requires the exact filename.

The model listing and tensor metadata could not be verified from the basename. These are standard Krea2 Turbo starting values, not confirmed creator settings. If the download is actually a LoRA, this graph is inappropriate: put it in a Krea2 LoRA folder and select it on an existing Krea2 workflow instead. The original download page or a loader error can settle that distinction.

## Activate

After merging, pull main and rebuild Docker Compose. Restart ComfyUI after copying the required models. In Ultra Studio, open Settings → Workflow library → Refresh bundled workflows, enable the new entries in builder visibility settings if needed, then select the desired workflow. Test one image first.

The JSON files in `backend/seed_workflows` are API-format graphs for Ultra Studio, not positioned ComfyUI canvas files. Backend tests validate graph connections, registration, correct dependencies, selected-model preservation and MOSS dimension alignment. A live ComfyUI render remains required.
