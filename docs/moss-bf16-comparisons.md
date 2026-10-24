# MOSS BF16 comparison workflows

Two independent text-to-image templates use the exact downloaded filenames:

| Workflow | Diffusion model | Steps | CFG | Sampler / scheduler |
| --- | --- | --- | --- | --- |
| MOSS Image · Lox Stardust Mix v1.0 BF16 (Test) | loxsStardustMixMoss_v10_bf16.safetensors | 25 | 3 | er_sde / simple |
| MOSS Image · Jib Mix Realistic v1 BF16 (8-Step Test) | jibMixMossRealistic_v1OneToOne_bf16.safetensors | 8 | 1 | euler / simple |

Stardust starts at 1024 × 1024 (about 1 MP); Jib starts at 768 × 1024. Both use batch 1, with native UNETLoader/default weight dtype, CLIPLoader type moss_image, EmptyFlux2LatentImage, and no additional LoRA. Required shared files:

- models/text_encoders/qwen3.5_9b_w4a8_gptq.safetensors
- models/vae/flux2-vae_small.safetensors

Place the diffusion files in models/diffusion_models (subfolders are resolved by filename). Missing files are reported explicitly; another installed Moss model is not substituted. Restart ComfyUI after adding files. Native Moss support is required. BF16 weights may need CPU offloading on a 12 GB GPU; a local render is necessary to verify memory use and model compatibility.

After merging, update the repository and rebuild the backend and frontend. In Settings → Workflow library, click **Refresh bundled workflows**, which refreshes bundled copies and adds these workflows while preserving their IDs and the default workflow. Enable them in Builder workflow visibility if needed. Selecting a Moss model in the Design toolbar loads that graph's sampling baseline; later manual changes and quality presets can override it. The newer workspace uses the graph sampling values when it does not send overrides. Start with one image, no optional LoRA, and the same prompt/seed to compare results.

## Evidence and limits (2026-10-24)

- [Comfy-Org model card](https://huggingface.co/Comfy-Org/MOSS-Image) lists the shared Qwen3.5 encoder and FLUX.2 VAE variants.
- The Stardust creator text supplied by the user recommends ER-SDE/simple, 25–50 steps, CFG 3–5 and 1–2 MP. The default uses the lower ends of those ranges. Face_yolov9c @ 0.25, Eyeful_V2-Paired @ 0.2, Hand_yolov9c @ 0.35, and SeedVR2 are optional creator recommendations, not nodes or downloads included here. The creator workflow JSON and these extra local dependencies have not been supplied, so their exact wiring is not reproduced.
- [Jib creator announcement](https://www.reddit.com/r/StableDiffusion/comments/1xdgxmy/jib_mix_moss_realistic_out_now_free/) says the 8-step LoRA is already merged. Euler/simple and CFG 1 are starting assumptions, not independently verified version-specific recommendations. Do not add another acceleration LoRA for the initial test.
- The supplied [Jib version](https://civitai.red/models/3016339/jib-mix-moss-realistic?modelVersionId=3424160) and [Stardust version](https://civitai.red/models/3015623/loxs-stardust-mix-or-moss-sft?modelVersionId=3423134) pages and version API were inaccessible during implementation. Filenames come from the user, assuming .safetensors extensions. The user subsequently supplied the Stardust creator settings and license text; the Stardust baseline follows that text. Jib version-specific CFG/sampler settings remain unverified.

The supplied Stardust license permits personal, non-commercial generation, prohibits commercial use of the model and outputs, and prohibits redistribution and fine-tuning. This repository contains workflow JSON only, not model weights. Review the creator terms before using it in a product.

Automated tests validate graph registration, connections, exact file resolution, shared model architecture, no double LoRA loading, editable sampling, and frontend default extraction. They do not establish image quality or successful inference on the local GPU.
