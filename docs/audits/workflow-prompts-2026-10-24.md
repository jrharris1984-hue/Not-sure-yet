# Workflow prompt audit — 24 October 2026

Audited repository: `9efb06b23bf654e8e269ac01dff259a05367f6bb` (main after PR #403).

The largest opportunities are consistent workflow defaults, effective conditioning visibility, and less repeated prompt scaffolding. More adjectives, more steps, or another LoRA are not established improvements. No model was rendered for this audit; visual quality, GPU latency, and VRAM usage remain unmeasured.

## Scope and evidence

- Reviewed all **46 bundled workflow registrations / 45 distinct JSON graphs**, including internal pose stages, image variations, edits, enhancement, and video.
- Traced catalog rules → model compiler → Detailed/Compact/Scene formatting → final assembly → Builder/workspace/freeform payloads → backend prompt mapping and generation overrides.
- Exercised 138 compiler/format combinations using the same neutral adult portrait fixture (auburn straight hair, blue shirt, jeans, sneakers, garden, standing, sunlight). These are compilation probes, not image-quality scores. They do not exercise every possible character selection or live custom workflow.
- Extracted the backend's actual `_detect_prompt_nodes` function and checked its bindings against every bundled graph. All detected positive nodes and all detected negative nodes are upstream of sampling. Reachability does **not** mean negative conditioning affects a CFG-1 render or survives zeroing.
- 79 frontend tests passed across compiler, assembly, recipes, workspace generation, and the diagnostic sweep; 19 backend tests passed across local workflow, generation settings, and freeform prompt suites.
- Reviewed current primary model documentation listed below. Fine-tune-specific recipes remain unverified unless attributed to supplied creator instructions. Installed database edits, private workflows, actual model tensor formats, and the user's current ComfyUI version were not available.

## Findings, in priority order

### 1. High: MOSS quality controls replace the selected model's baseline

Evidence: `renderRecipes.js` has no MOSS recipe; `resolvePromptCompiler` returns `standard` for `moss_image`; `renderRecipeStyle` also falls back to that compiler. `Builder.applyQualityTier` consequently writes the generic recipe. Balanced becomes **26 steps / CFG 4.5 / dpmpp_2m**, with scheduler undefined (the graph's scheduler remains).

This affects all three MOSS entries. Their graph baselines are intentionally different:

| Workflow | Graph baseline | Provenance |
| --- | --- | --- |
| Stardust BF16 | 25 steps, CFG 3, ER-SDE, simple | User-supplied creator card: 25–50 steps, CFG 3–5, 1–2 MP |
| Jib BF16 | 8 steps, CFG 1, Euler, simple | Creator announcement supports merged 8-step acceleration; exact CFG/sampler remains an assumption |
| FinalCut Universal | 6 steps, CFG 2.5, Euler, simple | User-supplied creator settings; scheduler is a local starting assumption |

`mossWorkflowSettings` restores these defaults only through the main workflow dropdown. Review controls use `onWorkflow={setWorkflowId}` directly; Smart Setup uses the generic recipe. Therefore model selection paths do not guarantee identical settings. The simplified workspace omits sampling overrides and uses the graph defaults, creating another difference between screens.

**Recommendation:** identify the checkpoint variant independently of its text-encoder family. Route every model selector through one initializer. Preserve graph sampling defaults until the user explicitly changes them; offer model-specific quality controls rather than one MOSS-wide recipe. Keep saved exact recipes exempt from automatic resets.

### 2. High: text-to-video still receives still-image final assembly

Evidence: `Builder.jsx` defines `isVideoWorkflow` as `kind === "video"`, separately from `isTextVideoWorkflow`. Both final-assembly calls exclude only `isVideoWorkflow`, `qwen_edit`, and `wan_i2v` from photographic additions. The `wan_t2v` compiler deliberately avoids this addition, but final assembly adds it back for `text_video`. The final string is sent as `video_instruction`, which the backend uses directly.

Affected: WAN 14B T2V, WAN 5B T2V, Sulphur/LTX T2V. They can also inherit still-image LoRA state because the trigger/selected-LoRA exclusions use the same image-to-video-only condition. This is a payload-path risk, not proof that an incompatible adapter has already been applied.

**Recommendation:** derive a single task capability (`image`, `edit`, `i2v`, `t2v`) and use it consistently in assembly, overrides, LoRA selection, and dispatch. Keep movement and camera direction early for video; do not automatically prepend photographic body boilerplate.

### 3. Medium: generic front-loaded instructions compete with the requested scene

Evidence: `applyPhotographicGuidance` always prepends 29 words of skin/limb/footwear guidance to photographic prompts, except exact replay. The generic detailed compiler adds another anatomy/composition block before identity. In the neutral MOSS fixture, the complete result is 168 words and begins with generic skin, limb and anatomy instructions rather than the requested person and scene. Similar realism language reappears at the end.

Measured fixture word counts (Detailed / Compact / Scene): MOSS 168/119/157; Krea 130/119/157; Chroma 137/119/157; SDXL 168/111/157; Pony 171/109/155. These are word counts, not tokenizer measurements or quality rankings.

**Recommendation:** keep selected subject, action, framing and distinctive details first. Add one short task-appropriate coherence instruction only when needed. Compare current prompts against a version with duplicate realism clauses removed; do not delete selected details to hit an arbitrary length. Compact is a reasonable comparison candidate, not a proven universal winner.

### 4. Medium: negative-prompt availability is not the same as effective conditioning

Evidence: several compilers label negatives `text` even when the bundled graph's sampler/guider is CFG 1. Examples include Jib MOSS, Chroma Turbo/Flash, Qwen AnyPose, Qwen Remix, WAN 14B T2V and Sulphur. Other families intentionally use a zeroed path or no negative text node. `assembleFinalPrompts` prevents automatic additions for `zeroed` but retains manually supplied negative text; the UI can therefore display text that has no useful influence on that graph.

**Recommendation:** show graph-aware status: **active**, **ignored at this guidance**, **zeroed**, or **not connected**. Compute this from the current effective graph/settings, not only the family label. Do not increase CFG merely to activate negatives on a distilled model. Official FLUX guidance likewise favors positively describing the desired result over negative prompting [2].

MOSS is not universally negative-free: its official base guide supports negative prompts [1]. Stardust/FinalCut graph defaults use CFG above 1, whereas the Jib test baseline uses CFG 1. Do not unify their negative behavior blindly.

### 5. Medium: Kroma's Quality preset advertises sampling that Builder overrides

Evidence: `getRenderRecipe('kroma','quality')` offers 12 steps; `resolvePromptCompiler` maps Kroma to Krea, and Builder's `isKrea2` includes Kroma. `renderSettings` consequently forces 8 steps / CFG 1 / Euler / simple. The backend only hard-normalizes the literal `krea2` style, so this discrepancy originates in the frontend.

**Recommendation:** separate Turbo's fixed settings from Kroma's adjustable profile. Show the effective values beside the preset, including the reason for any enforced value.

Related: `krea2_test` quality presets all choose beta scheduling, while FinalCut Redux and Realistic Photography templates start at simple. A shared family label does not establish a fine-tune's correct scheduler.

### 6. Medium: Sulphur/LTX uses a WAN prompt profile

Evidence: `promptModelAliases.js` maps `ltx_t2v` to `wan_t2v`. Sampling already has LTX-specific handling, but wording, budgets, and quality warnings remain WAN-shaped. The neutral detailed fixture places the requested motion late in a 174-word compiler result, before Builder adds further photo guidance.

**Recommendation:** add a dedicated LTX task profile with an action-first chronological paragraph and explicit optional audio context. Lightricks recommends literal action-first descriptions within 200 words [3]; that is a starting convention, not an independently verified recipe for this Sulphur fine-tune. Retain WAN's separate motion-oriented profile [4].

### 7. Medium: length warnings are estimates, not encoder limits

Evidence: `estimatePromptTokens` multiplies a whitespace/comma count by 1.35. `PROFILE_LIMITS` contains hard-coded thresholds; MOSS and the FaceID workflow fall back to the generic profile. ComfyUI's actual tokenizer/encoder behavior, chunking, text syntax, and installed version are not queried. The official CLIP implementation includes a 77-token chunk configuration; this does not mean all later prompt text is discarded [5].

**Recommendation:** label current numbers as heuristic attention/length warnings. Report actual token counts and truncation/chunking from the loaded encoder when supported. Do not interpret a 225-token UI threshold as a universal SDXL truncation rule. Preserve user-selected requirements and rank them, rather than silently cutting them.

### 8. Medium: prompt preview and executed prompt can differ

Evidence: frontend final assembly inserts LoRA triggers with boundary-aware matching and protects Pony score order. Backend selected-LoRA injection separately uses substring matching and prepends missing triggers. Direct freeform payloads do not use final assembly. Qwen edit/enhance also adds preservation/repair instructions on the backend. Backend records its final strings, which is good, but the pre-render preview is not always identical.

**Recommendation:** use one shared finalization contract (or a backend dry-run endpoint) and return the effective prompt/settings before queueing. Add explicit exact-replay semantics to dispatch so triggers/rules cannot unexpectedly alter an exact replay. Keep backend validation, but avoid independently assembling prompts twice.

### 9. Improvement: explicit family coverage should replace silent fallback

MOSS currently compiles through `standard`; FaceID (`venice`, an SD1.5 checkpoint) also uses generic prompts/length warnings. FLUX pose foundation resolves to `standard` from style `flux`, although the special Pose Assist path explicitly supplies zeroed-negative assembly. This special path is important: the resolver mismatch alone does not prove the foundation render is broken.

**Recommendation:** centralize task, base model, checkpoint variant, encoder, prompt convention, negative behavior and sampling defaults in a registry. Add a coverage assertion requiring every registered workflow to name an explicit profile or a documented fallback. Preserve Pony score/tag handling, dedicated edit instructions and separate image/video behavior already present.

### 10. Benchmark gap: no evidence establishes an optimal model or LoRA combination

The graph and compiler checks demonstrate software behavior, not visual quality. No latency, peak VRAM, prompt adherence or identity consistency was measured. The two GPUs do not automatically pool memory; whether offloading or a multi-device configuration helps depends on the actual runtime.

**Recommendation:** first fix profile/settings consistency, then compare current and candidate prompts with fixed seeds within each model. Do not add acceleration LoRAs to Jib without verifying its merged acceleration, and do not assume a LoRA for Krea/FLUX is compatible with MOSS. A matching encoder filename is necessary setup evidence, not proof of an optimal quantization.

## What is already working

- All bundled positive text bindings reach the sampling graph; no obvious disconnected positive node was found.
- Separate edit and image-to-video compilers exist; reference composition has direct instruction handling.
- Pony score ordering is protected, including Compact and Scene formats in the neutral sweep.
- Selected detail preservation, cast consistency, wardrobe resolution, and final assembly already have targeted tests.
- Krea Turbo and distilled Klein enforce their own sampling settings; graph-linked inputs and detailer-specific settings are protected from generic overrides.
- Backend stores final prompts and effective node settings, providing a useful basis for reproducible comparisons.
- MOSS encoder/VAE filenames in the bundled graphs match Comfy-Org's supported component list [6]. This does not independently validate third-party checkpoint compatibility.

## Practical comparison plan

1. Preserve each workflow's own baseline. For the first MOSS comparison use FinalCut 6/2.5/Euler/simple and Stardust 25/3/ER-SDE/simple. Keep Jib 8/1/Euler/simple labeled experimental until the exact creator recipe is verified. Use a common 1024-square canvas, batch 1, no newly added LoRA.
2. Use four neutral scenes: a close portrait, a full-body person in an outfit, two adults with distinct clothes, and a room/object scene. The last case should use freeform input, avoiding automatic human-body guidance.
3. Compare Detailed, Compact, and a proposed concise scene-first version with three fixed seeds per scene per model (36 images per model). Seed equality only provides a controlled comparison within a model; it does not imply equivalent noise across architectures.
4. Score subject count, clothing/color adherence, framing, anatomy, realism, and preservation of requested details separately. Record time and peak VRAM. Keep every final prompt, checkpoint/encoder/VAE identity, LoRA weight, effective sampler/scheduler/CFG/steps, and output dimensions.
5. Test one LoRA at a time only after the base winner is established. Compare median outcomes and failure rates rather than the single most attractive image. Stop settings that cause repeated out-of-memory failures before expanding resolution.

The recommended implementation order is: unified workflow defaults → task-aware final assembly → effective negative/settings feedback → explicit model profiles → measured prompt comparisons. This audit changes no generation behavior.

## Primary references

1. [OpenMOSS user guide](https://github.com/OpenMOSS/MOSS-Image/blob/main/USERGUIDE.md): supported language/tag/layout formats and negative guidance. Base-model guidance does not validate every merge.
2. [Black Forest Labs: FLUX.2 negative prompting](https://help.bfl.ai/articles/7734566352-does-flux-2-support-negative-prompting).
3. [Lightricks LTX-2 prompting](https://github.com/Lightricks/LTX-2#-prompting-for-ltx-2).
4. [WAN 2.2 official repository](https://github.com/Wan-Video/Wan2.2): distinct text/image-to-video paths and optional prompt extension.
5. [ComfyUI CLIP tokenizer source](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy/sd1_clip.py).
6. [Comfy-Org MOSS component layout](https://huggingface.co/Comfy-Org/MOSS-Image).
7. [Krea 2 Turbo official card](https://huggingface.co/krea/Krea-2-Turbo): natural-language image generation; fine-tune recipes must be verified separately.
8. [Hugging Face QwenImage pipeline](https://huggingface.co/docs/diffusers/en/api/pipelines/qwenimage): classifier-free guidance and negative conditioning. API parameter names are not interchangeable with ComfyUI CFG values.

## Complete bundled-workflow coverage

The following values describe the checked-in graph, before runtime/UI overrides. D/C/S are measured **word counts** for the neutral Detailed/Compact/Scene compiler fixture plus task-appropriate final assembly. For video, these counts intentionally exclude the erroneous Builder photo addition described in finding 2. Reference-edit word counts use direct instructions without photo additions. Linked sampler literals are resolved below. These probes validate compilation, not image quality.

| Workflow / graph | Compiler | Graph steps / CFG / sampler / scheduler | D/C/S words | Review emphasis |
| --- | --- | --- | --- | --- |
| MOSS Image · Lox Stardust Mix v1.0 BF16 (Test)<br>`moss_stardust_bf16.json` | `standard` | 25 / 3.0 / er_sde / simple | 168 / 119 / 157 | Explicit MOSS profile + per-checkpoint defaults (1, 4) |
| MOSS Image · Jib Mix Realistic v1 BF16 (8-Step Test)<br>`moss_jib_realistic_bf16.json` | `standard` | 8 / 1.0 / euler / simple | 168 / 119 / 157 | Explicit MOSS profile + per-checkpoint defaults (1, 4) |
| Krea 2 · Realistic Photography (Baseline)<br>`krea2_realistic_photography.json` | `krea2` | 8 / 1 / euler / simple | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| MOSS Image · FinalCut Universal FP8 (6 Step)<br>`moss_finalcut_universal.json` | `standard` | 6 / 2.5 / euler / simple | 168 / 119 / 157 | Explicit MOSS profile + per-checkpoint defaults (1, 4) |
| Z-Image Turbo · Base (No LoRA)<br>`zimage_base.json` | `zimage` | 8 / 1 / res_multistep / simple | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| FLUX.2 Klein 4B · Reference Image Edit<br>`flux2_klein_edit.json` | `flux2_klein` | 4 / 1 / euler / Flux2Scheduler | 12 / 12 / 12 | Direct instructions; preview/dispatch parity (8) |
| Qwen 2511 · Reference Image Composer<br>`qwen_reference_composer.json` | `qwen_edit` | 40 / 4 / euler / simple | 12 / 12 / 12 | Direct instructions; preview/dispatch parity (8) |
| FLUX.1 Dev FP8 · Text to Image<br>`flux1_dev_t2i.json` | `flux1_dev` | 28 / 1 / euler / simple | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| WAN 2.2 5B · Text to Video<br>`wan5b_t2v.json` | `wan_t2v` | 30 / 5 / uni_pc / simple | 174 / 174 / 141 | Task-aware assembly; effective negatives (2, 4) |
| Kroma · v0.3.1 Turbo OPD<br>`kroma_opd.json` | `krea2` | 8 / 1 / euler / simple | 130 / 119 / 157 | Displayed vs enforced steps (5) |
| Krea 2 · FinalCut V1 Redux (Comfy Quants)<br>`krea2_finalcut_redux.json` | `krea2` | 10 / 1 / euler / simple | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| Krea 2 · CamGlam BF16 Test<br>`krea2_glamour_bf16.json` | `krea2` | 8 / 1 / euler / beta | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| Krea 2 · AKSIOM V1 BF16<br>`krea2_aksiom.json` | `krea2` | 8 / 1 / euler / beta | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| Krea 2 · LUSTIFY v10 FP8<br>`krea2_lustify.json` | `krea2` | 8 / 1 / euler / beta | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| Krea 2 · ST-KREAL 2.91 FP8<br>`krea2_stkreal.json` | `krea2` | 8 / 1 / euler / beta | 130 / 119 / 157 | Fine-tune recipe provenance; negative behavior (4, 5) |
| Chroma · GonzaLomo v3 FP8<br>`chroma_gonzalomo.json` | `chroma` | 26 / 3.8 / euler / BetaSamplingScheduler | 137 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Chroma · DanrisiMix Ultra INT8 Turbo<br>`chroma_danrisimix_ultra.json` | `chroma` | 12 / 1 / heun / SigmoidOffsetScheduler | 137 / 119 / 157 | Distilled sampling; effective negative status (4) |
| Chroma · Unlocked v50<br>`chroma_unlocked_v50.json` | `chroma` | 26 / 3.8 / euler / BetaSamplingScheduler | 137 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Chroma · Clyb Uncanny 2K Flash v19<br>`chroma_clyb_uncanny_flash_v19.json` | `chroma` | 8 / 1 / heun / BetaSamplingScheduler | 137 / 119 / 157 | Distilled sampling; effective negative status (4) |
| Krea 2 Turbo · AIO v1.0<br>`krea2_aio.json` | `krea2` | 12 / 1 / euler_ancestral / beta | 130 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Qwen Remix AIO v2 · Image Edit<br>`qwen_remix_edit.json` | `qwen_edit` | 8 / 1 / euler_ancestral / beta | 79 / 79 / 79 | Direct instructions; preview/dispatch parity (8) |
| Sulphur 2 Distilled NVFP4 · Text → Video + Audio<br>`sulphur2_t2v.json` | `wan_t2v` | 8 / 1.0 / euler / LTXVScheduler | 174 / 174 / 141 | Dedicated LTX action-first profile (2, 6) |
| Qwen 2512 · AGQI V2 FP8<br>`qwen_agqi_t2i.json` | `qwen_image` | 40 / 4 / euler / simple | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Qwen Rapid AIO v23 · Text to Image<br>`qwen_rapid_t2i.json` | `qwen_rapid` | 4 / 1 / euler_ancestral / beta | 168 / 119 / 157 | Distilled sampling; effective negative status (4) |
| Qwen 2512 · Custom LoRAs (AGQI)<br>`qwen_custom_loras_t2i.json` | `qwen_image` | 40 / 4 / euler / simple | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| SDXL · Juggernaut XL v9<br>`sdxl.json` | `sdxl` | 35 / 5.0 / dpmpp_2m / karras | 168 / 111 / 157 | Preserve model tags; shorten generic scaffolding (3, 7) |
| SDXL · Realism by Stable Yogi XL V4<br>`sdxl_stable_yogi.json` | `sdxl` | 35 / 5.0 / dpmpp_2m / karras | 168 / 111 / 157 | Preserve model tags; shorten generic scaffolding (3, 7) |
| SDXL · RealPornSDXXXL v1<br>`sdxl_realporn.json` | `sdxl` | 35 / 5.0 / dpmpp_2m / karras | 168 / 111 / 157 | Preserve model tags; shorten generic scaffolding (3, 7) |
| SDXL · xxxRay DMD2<br>`sdxl_xxxray_dmd2.json` | `sdxl_dmd2` | 4 / 1.2 / lcm / normal | 168 / 111 / 157 | Preserve model tags; shorten generic scaffolding (3, 7) |
| Pony · Ultra Realistic by Stable Yogi v2<br>`pony_ultra_realistic.json` | `pony` | 25 / 7.0 / euler_ancestral / normal | 171 / 109 / 155 | Preserve model tags; shorten generic scaffolding (3, 7) |
| Pony · PornWorks Real Porn Photo v0.4<br>`pony_pornworks_v04.json` | `pony` | 25 / 7.0 / euler_ancestral / normal | 171 / 109 / 155 | Preserve model tags; shorten generic scaffolding (3, 7) |
| Chroma1-HD · Golden T2I<br>`chroma.json` | `chroma` | 26 / 3.8 / euler / BetaSamplingScheduler | 137 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Z-image Turbo · NSFW<br>`zimage.json` | `zimage` | 8 / 1 / res_multistep / simple | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Qwen Image Edit 2511<br>`qwen.json` | `qwen_edit` | linked / linked / euler / simple | 79 / 79 / 79 | Direct instructions; preview/dispatch parity (8) |
| Qwen Change Pose · AnyPose<br>`qwen_anypose.json` | `qwen_edit` | 4 / 1 / euler / simple | 79 / 79 / 79 | Direct instructions; preview/dispatch parity (8) |
| Qwen Camera Angle · Multiple Angles<br>`qwen_camera_angle.json` | `qwen_edit` | 40 / 4 / euler / simple | 79 / 79 / 79 | Direct instructions; preview/dispatch parity (8) |
| Qwen Image Repair & Enhance<br>`qwen.json` | `qwen_edit` | linked / linked / euler / simple | 79 / 79 / 79 | Direct instructions; preview/dispatch parity (8) |
| WAN 2.2 5B · Image → Video<br>`wan.json` | `wan_i2v` | 30 / 5 / uni_pc / simple | 82 / 82 / 82 | Motion-first; preview/dispatch parity (8) |
| WAN 2.2 14B · Text → Video<br>`wan_t2v.json` | `wan_t2v` | 4 / 1 / euler / simple | 174 / 174 / 141 | Task-aware assembly; effective negatives (2, 4) |
| Face-Preserved · IPAdapter FaceID<br>`face.json` | `standard` | 25 / 5 / euler / karras | 168 / 119 / 157 | SD1.5-specific length/profile (7, 9) |
| Pony V6 XL · 5 LoRAs<br>`pony.json` | `pony` | 25 / 7 / euler_ancestral / normal | 171 / 109 / 155 | Preserve model tags; shorten generic scaffolding (3, 7) |
| Pose Assist · FLUX DWPose Foundation<br>`flux_pose.json` | `standard` | 28 / — / euler / simple | 168 / 119 / 157 | Special internal assembly path (9) |
| Pose Assist · Chroma Polish<br>`chroma_refine.json` | `chroma` | 26 / 3.8 / euler / BetaSamplingScheduler | 137 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Chroma1-HD · Image Variations<br>`chroma_variation.json` | `chroma` | 26 / 3.8 / euler / simple | 137 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| Krea 2 Turbo<br>`krea2_turbo.json` | `krea2` | 8 / 1 / euler / simple | 130 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |
| FLUX.2 Klein 4B FP8<br>`flux2_klein_4b.json` | `flux2_klein` | 4 / 1.0 / euler / Flux2Scheduler | 168 / 119 / 157 | Reduce repeated scaffolding; compare fixed seeds (3, 10) |

The two `qwen.json` registrations represent edit and enhancement tasks, not two unique graph files. WAN 14B's two staged samplers both declare four steps; this table does not add them into an eight-step claim.

One additional JSON, `krea2_private_magazine.json`, is not in `SEED_WORKFLOWS`. It is a legacy Krea Turbo graph with a `privatemag` seed trigger, a model-only LoRA at 0.8, eight Euler/simple steps, CFG 1, positive node 4 and zeroed negative conditioning. The workflow catalog recognizes the legacy preset name. Existing saved installations may still contain it; new seed registration and the selected-LoRA route are separate. It was inspected as a legacy graph, not counted among the 138 registered-workflow compilation probes.

## Neutral candidate prompt for comparison

For a MOSS/Krea/FLUX natural-language comparison, a candidate replacing the repeated generic scaffold is:

> A full-length photograph of a 30-year-old woman standing in a garden, visible from head to toe. She has straight auburn hair and wears a blue cotton shirt, jeans and white sneakers. The camera is at eye level, with space around her body. Sunlight illuminates the scene with natural color and realistic fabric and skin texture.

This is an **untested candidate**, not a universal optimum. The application should build it from selected values, retain multi-person identity and clothing assignments, and keep model-specific triggers. It must not substitute this fixed scene for the user's choices. Tag-oriented checkpoints need their own convention. Edit prompts should describe the requested change; video prompts should prioritize action over time.
