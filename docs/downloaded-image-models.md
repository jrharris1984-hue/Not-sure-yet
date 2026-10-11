# Downloaded model comparison presets

Refresh bundled workflows in Settings after updating Ultra Studio. This adds
independent image workflows without replacing existing workflows:

| Workflow | Exact local filename | ComfyUI folder |
| --- | --- | --- |
| Krea 2 · AKSIOM V1 BF16 | `krea2AKSIOMEXAPORNV1_fullPrecisionBf16V01.safetensors` | `models/diffusion_models` |
| Krea 2 · LUSTIFY v10 FP8 | `lustifyNSFWCheckpoint_v10Krea2_fp8.safetensors` | `models/diffusion_models` |
| Krea 2 · ST-KREAL 2.91 FP8 | `stKREAL291FEMBOYS.safetensors` | `models/diffusion_models` |
| Chroma · GonzaLomo v3 FP8 | `gonzalomoChroma_v30_fp8.safetensors` | `models/diffusion_models` |
| Chroma · DanrisiMix Ultra INT8 Turbo | `Chroma1-HD-DanrisiMix-Hyper-Flash-Turbo-Ultra-int8-convrot.safetensors` | `models/diffusion_models` |

These are separate diffusion weights, rather than all-in-one checkpoints.
Each Krea preset uses `qwen3vl_4b_fp8_scaled.safetensors` in
`models/text_encoders` and `qwen_image_vae.safetensors` in `models/vae`.
Both Chroma presets use `t5xxl_fp8_e4m3fn_scaled.safetensors` in `models/text_encoders`
and `ae.safetensors` in `models/vae`. Existing copies can be reused.

Restart ComfyUI after moving files. Subfolders and filename case differences
are resolved from ComfyUI's model list. Different downloaded version filenames
must be selected in the workflow JSON; the app never substitutes an unrelated
model. If models or nodes are missing, the render reports the required setup.

The Krea comparison baseline is 8 steps, CFG 1, Euler, beta scheduler.
AKSIOM's uploaded model card recommends Euler/beta and 8–9 steps. This is
also a starting comparison recipe for LUSTIFY and ST-KREAL, not a verified
author recommendation for those models. Sampling controls remain adjustable.
GonzaLomo starts with the existing Chroma Euler/beta recipe. These graphs
start without baked-in LoRAs so model comparisons are independent.

## DanrisiMix Ultra INT8 Turbo setup

This preset selects the exact Mykee INT8 Convrot file (approximately 9.19 GB),
using ComfyUI's standard `UNETLoader` with default weight dtype. Update ComfyUI
if its standard loader cannot recognize the quantized file. It is a separate
diffusion model, not an all-in-one checkpoint.

The adapted creator baseline is 12 steps, CFG 1, Heun, Flow Shift 1, and
`SigmoidOffsetScheduler` with `square_k=1`, `base_c=0.5`, `start_sigma=1`.
Install this custom node through ComfyUI Manager's Git URL installation:

https://github.com/silveroxides/ComfyUI_SigmoidOffsetScheduler

Alternatively, clone that repository into `ComfyUI/custom_nodes`. Restart
ComfyUI after installing it and copying the model. Ultra Studio reports the
missing scheduler and its installation URL before dispatching the render.

After merging and rebuilding Ultra Studio, open Settings, click **Refresh
bundled workflows**, and select **Chroma · DanrisiMix Ultra INT8 Turbo** in
Studio's workflow dropdown. Start with one Draft image. Draft changes the
canvas to 768 × 768; Balanced uses 1024 × 1024; Quality uses 1024 × 1536.
All tiers retain the 12-step recipe. Advanced steps, CFG, sampler, canvas and
seed remain adjustable. At CFG 1, the negative prompt has no guidance effect;
the graph connects it so it can contribute when CFG is increased.

This is an Ultra Studio API graph adapted from the creator workflow, using
the uploader-supported standard loader, the existing T5 FP8 encoder, and
the creator's selected empty-latent path. It omits optional GGUF, QuantOps,
RoPE and adaptive-guidance nodes. It does not require those optional packages
and is not a bit-for-bit reproduction of the creator's quantized/GGUF graph.
Offline validation cannot verify INT8 loading, GPU memory use or image quality.

Sources:
- https://huggingface.co/Mykee/Chroma-Models-Turbo-INT8-Convrot?not-for-all-audiences=true
- https://huggingface.co/silveroxides/Chroma1-HD-Hyper-Flash-Turbo/blob/main/chroma1-hd-hyper-flash-turbo-workflow.json
- https://github.com/silveroxides/ComfyUI_SigmoidOffsetScheduler/blob/main/__init__.py

Graph validation and offline tests do not verify image quality or memory use
on the user's GPU. Start with one Draft image. The BF16 AKSIOM download is
approximately 24 GiB of weights and is heavier than the FP8 Krea downloads.

## MiniMax H3 is a separate setup

`minimaxH3Sparseref15_prunedPartialINT8V10.safetensors` belongs in
`models/diffusion_models`, but it is not compatible with the Krea or Chroma
graphs. The uploaded card identifies an FL2VA-based hybrid. It requires an H3
text/vision encoder and H3 VAE, plus an appropriate H3 workflow. It is not
registered as a working image preset by this update.

For still images, a compatible H3 still-image workflow is needed; for video,
use the corresponding native H3 workflow with its additional audio components.
To integrate the exact hybrid build, export its working ComfyUI workflow in
API format, including its loader, encoder and VAE filenames. A model-card
screenshot alone cannot establish those bindings.

Sources checked:
- https://huggingface.co/Comfy-Org/Krea-2
- https://docs.comfy.org/tutorials/video/minimax/minimax-h3
- https://github.com/astropuzzo/ComfyUI-MiniMax-H3-Image-Studio
- User-supplied model cards and local filename screenshot.
