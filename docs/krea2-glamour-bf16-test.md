# Krea 2 CamGlam BF16 comparison workflow

Adds a separate image workflow for the user-provided filename `fucktoyEthotsAnd_v10_bf16.safetensors`, registered as `Krea 2 · CamGlam BF16 Test`. It uses the existing separate-model Krea 2 path, preserving the chosen diffusion model rather than auto-substituting the standard Turbo weights.

Required files:
- `models/diffusion_models/fucktoyEthotsAnd_v10_bf16.safetensors`
- `models/text_encoders/qwen3vl_4b_fp8_scaled.safetensors`
- `models/vae/qwen_image_vae.safetensors`

The workflow uses UNETLoader, CLIPLoader with type krea2, the Qwen Image VAE, EmptyLatentImage and KSampler. Positive and negative conditioning both use text encoders so higher CFG tests do not require rewiring. The existing krea2_test compiler and comparison profiles are reused. The initial graph is 768 × 1024, eight Euler/beta steps, CFG 1, with a neutral fashion portrait prompt. These are experimental starting values, not confirmed creator recommendations. The pasted listing did not provide sampler settings or specify whether the model was distilled. The creator page could not be independently retrieved, and the weights were not available for inspection or GPU loading.

The pasted listing describes approximately 24 GB of BF16 weights. They cannot reside entirely on a 12 GB GPU; offloading will be necessary. No timing, quality or VRAM fit guarantee is made. The workflow validates model filenames and node availability against the connected ComfyUI instance before submission. The BF16 workflow does not require a ConvRot loader.

After copying the model beside the existing working Krea 2 diffusion model, restart ComfyUI. After merging/rebuilding Ultra Studio, use Settings → Workflow library → Refresh bundled workflows and select/enable the new test workflow.

Validation: 197 offline backend tests and 51 subtests passed, plus git diff --check. Regression cases verify graph registration, connections and model subfolder resolution; genuine negative conditioning; adjustable CFG/steps; and dispatched model, both prompts and seed. No frontend, compiler or existing workflow sampling defaults were changed.
