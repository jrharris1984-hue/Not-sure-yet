# Ultra Studio 3.0 Quality Check

**Date:** 2026-11-26
**Branch:** `feature/ultra-studio-3-foundation`  
**Scope:** Registered workflow graphs, prompt compilers/library validation, Golden Chroma recipe restoration, wardrobe catalog and pose organization.

## Findings and changes

### Dirty-Moss V2

The branch seed workflow specifies 1152×1440, 25 steps, CFG 2.5, ER-SDE/simple, and shift 5. The earlier audit incorrectly concluded that the shift node should be removed. Rechecking the primary sources shows the supplied creator recipe specifies shift 5 and the OpenMOSS example graph includes `ModelSamplingSD3` shift 5. Comfy-Org's current MOSS template uses a subgraph and describes shift 5 as the model default. Thus the old direct-UNET seed omitted an expected recipe setting and could explain why the 3.0 result differed from the reported reference, but only a controlled local render can confirm the cause.

The development branch now restores `ModelSamplingSD3` shift 5 in the seeded Dirty-Moss graph. On settings load, a narrow migration adds that node only when the saved workflow has the exact Dirty-Moss name and checkpoint and one direct UNET-to-KSampler model connection; other graph values are preserved. A regression test covers the migration. This updates the saved profile after the backend is rebuilt and its settings route is read; it does not confirm that the model file, encoder, VAE, sampler availability, or installed ComfyUI version produces a correct image.

### Golden Chroma and Gallery recipes

The feature branch's `chroma.json` is byte-identical to the current `main` seed graph. It loads Chroma1-HD, the Chroma T5 encoder and AE VAE, uses `ModelSamplingAuraFlow` shift 1, and includes the GoldenChroma LoRA at model strength 0.5 (plus a zero-strength duplicate node). This is not evidence that the Chroma and another model's workflow JSON were merged.

Gallery recipe restoration selects a workflow by matching the saved ID and name, and aborts if the workflow is missing or ambiguous. It then dispatches the selected workflow graph. However, the saved recipe can also restore a user-selected LoRA. If that is the same GoldenChroma LoRA already embedded in the graph, the previous backend injected a second copy. The feature branch now reuses the embedded LoRA node and changes its strength instead of silently stacking another copy. The focused backend regression test passes in this checkout.

The Chroma graph's recipe settings are structurally intact; an actual same-seed comparison is needed to determine whether a prompt, negative prompt, seed, or LoRA override changed the observed image quality.

### Prompt formats and database

The prompt-library validator checks JSON shape, unique category/field/option IDs, supported control types, text length, rule scopes, and coverage metadata. Prompt compilation has separate model policies, and Golden Chroma has a dedicated short-prompt compiler and 512-token guidance.

MOSS was missing from the prompt-quality profile and therefore fell back to a generic 512-token estimate despite official MOSS guidance supporting prompts around 4K tokens. The feature branch now identifies MOSS workflows by style/name and applies an approximate 3,000-token warning / 3,800-token hard threshold. A frontend regression test was added; it still needs to run in the Windows frontend test environment. The counter is an estimate, not the model tokenizer.

The remaining prompt-library quality gate is semantic: imported user prompts are validated as data, but the app does not prove that every imported phrase is useful for every model family. Keep prompt sets tagged by model family and check the final compiled prompt in Preview before rendering.

## Catalog and wardrobe review

Static catalog inventory found:

- 114 wardrobe items across 20 labeled categories.
- 81 saved wardrobe-set phrases across 11 groups.
- 40 detailed coverage choices.
- 118 mapped photography-pose phrases.

The UI data already groups clothing into outfit, underneath layers, coverage/state, fabric/color/fit, shoes, hosiery, and accessories. The coverage screen's eight main cards are broad state controls; the 40 detailed choices cover openings, removal, garment placement, and other refinements. This explains why navigating only the eight cards can feel like options are missing, while the underlying catalog is larger.

Recommended organization for a follow-up wardrobe pass:

1. Keep the garment/outfit choice separate from the garment-state choice. Show the final resolved stack (outerwear, lingerie/underlayer, hosiery, shoes, accessories) and a plain-language “what remains visible” summary before rendering.
2. Separate coverage states from position details. “Lingerie only,” “topless,” and “garment pulled aside” are different kinds of choices and should not read as interchangeable.
3. Use garment names consistently: chemise, babydoll, slip, camisole, teddy/bodysuit, corset, bustier, basque, garter belt, negligee, peignoir, and kimono robe. The current inventory contains many of these terms, but labels and prompts should continue to distinguish their silhouettes and layering roles.
4. Keep pose posture, pose action, hand/leg placement, gaze, camera angle, and crop as separate controls. This makes the 118 prompt mappings easier to browse and reduces contradictory selections.

## Workload coverage

The static pass previously checked all 60 registered workflow entries / 59 unique seed graph files for JSON parsing and internal node-link references. That is structural validation only. A prior user-reported compatibility check covered one experimental MOSS graph (10 nodes), and the user has reported that several unspecified image renders worked. Neither establishes that all registered image, edit, video, pose, or enhancement workflows load on the installed ComfyUI.

The current environment cannot reach the user's Windows ComfyUI, local models, Ollama, GPU, MongoDB, or phone. Therefore the following remain unverified here: installed model/LoRA filenames, custom-node versions, `/object_info` compatibility for each graph, actual image/video renders, queue completion, mobile layout, and appearance quality across models.

The workflow inventory also has two Qwen catalog entries backed by the same `qwen.json` file (edit and repair/enhance). Treat that as intentional reuse only after validating each route's edit strength and source-image behavior on the Windows staging stack.

## External references reviewed

- [Official Comfy-Org MOSS template and sampling notes](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_moss_image_base_t2i.json)
- [Official MOSS prompt-enhancer skill](https://github.com/OpenMOSS/MOSS-Image/blob/main/skills/moss-image-prompt-enhancer/SKILL.md)
- [Official Comfy-Org Chroma1 Radiance workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_chroma1_radiance_text_to_image.json)
- [Professional Photographers of America boudoir posing guide](https://www.ppa.com/photovision/series/boudoir-photography-with-yuliya-panchenko/watch/boudoir-photography-posing-guide-yuliya-panchenko)
- [Lingerie garment terminology glossary](https://hauteflair.com/blogs/lingerie/bra-terms-a-complete-list-of-lingerie-terms-and-definitions)

## Validation status

- Workflow JSON syntax and internal link-reference checks: passed in the previous static pass; Dirty-Moss sampler graph rechecked after the correction.
- Focused backend workflow, capability, shoot-planner, migration, LoRA, and settings-upgrade tests: 35 passed in the available Python environment.
- Full backend unittest discovery ran 244 tests; eight modules/cases could not complete because this environment lacks `bson`, `requests`, and `pytest`. The failures are dependency/import errors; no assertion failures were reported.
- Frontend dependencies are absent in this checkout, so Jest and production build were not run here.
- GitHub reports no CI check runs for the audit commits. The supplied Windows result of 216 suites / 3,391 tests and a production build applies to commit `864e1de`, before this audit's changes.

## Windows staging checks still required

1. Pull this feature branch and rebuild only the isolated Studio 3 test stack.
2. Run the focused backend and frontend tests, then the full frontend test suite and production build.
3. Reopen the Dirty-Moss workflow settings after the backend reads settings. Confirm the sampler's model input now goes through `ModelSamplingSD3` shift 5, with 1152×1440, 25 steps, CFG 2.5, ER-SDE/simple. Then run a low-cost control render and the supplied 1152×1440 recipe; confirm neither result is multicolored noise.
4. Reopen the affected Gallery recipe. Confirm the recorded workflow, positive/negative prompt, seed, and LoRA list. Render one comparison with the saved recipe and one with the current compiler, using the same seed where the workflow allows it.
5. Check every installed workflow against live ComfyUI `/object_info`; render at least one small image, edit, image-to-video, and text-to-video job per installed family. Record failures by workflow name.
6. Compare coverage states with the same character, outfit, model, prompt, and seed while changing only the coverage control.

This report does not authorize merging to `main` or modifying the production installation.

## Follow-up verification — 2026-11-26

The development branch's Dirty-Moss seed had been changed to omit shift 5, while its documentation still advertised shift 5. This was inconsistent with the recipe supplied by the user and with the OpenMOSS example graph, which includes a `ModelSamplingSD3` shift-5 node. The branch seed now includes the node again. Existing Studio settings are not replaced wholesale: a guarded, idempotent startup migration adds shift 5 only to a saved workflow with the exact Dirty-Moss V2 name/checkpoint and a single direct UNET-to-KSampler model link. Focused migration tests cover that topology and ensure unrelated/custom graphs are left untouched.

The migration is code-reviewed and unit-tested, but has not run against the user's MongoDB. After rebuilding the **isolated Studio 3 test backend**, inspect the saved Dirty-Moss graph or the character workflow settings and confirm the sampler model input passes through `ModelSamplingSD3` with shift 5. Render a baseline and compare it with ComfyUI's own MOSS workflow at the same prompt and seed. A Windows GPU render remains the only validation of the multicolored-noise symptom.

The current local source tree is a detached review checkout. At review start, GitHub's development branch pointed to `84306674c61b719578d1f75de546a8dd46811707`; this follow-up must be committed to that development branch before it can be pulled into the Windows staging checkout.
