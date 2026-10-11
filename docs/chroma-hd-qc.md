# Chroma HD compiler and dispatch QC

This pass targets the bundled Chroma1-HD Golden T2I workflow, not the Flash, Turbo or separate test-model sampling recipes. No model weights, recipe defaults, loader filenames, scheduler parameters or flow shift were changed.

## Reproduced and fixed

- The lean detailed prompt used a partial wardrobe field list and dropped fabric, fit, pattern, accessory and other styling controls. It now reuses the resolved wardrobe formatter and retains separately resolved styling overrides for complete outfits. Footwear stays out of portrait crops.
- Identity archetype, authored gender wording, selected composition focus and independent hand placement could be omitted. These now remain in the detailed Chroma prompt after conflict resolution; selected male/non-binary/androgynous identities use consistent person wording.
- Focused foot composition retains its compatible sole presentation and foot pose. The shared visibility and stance rules still run first.
- Skin glow now has a visible lighting/skin description in addition to its numeric signature.
- Editor state such as physique control modes and garment priority could become literal prompt words, including `preset`. Priority planning, compact compilation and selection audit now exclude private snapshots and known behavior controls while keeping authored custom fields.
- Compact compilation replaced the guided detailed prompt and lost the common photographic skin/lens and limb-placement guidance. The final compact image prompt now retains that guidance and updates its word count.

## Validation boundaries

The Chroma option matrix checks 983 applicable built-in option values across identity, appearance, wardrobe, pose, scene, lighting, camera and style. It injects unique authored keywords to verify that an applicable choice reaches the detailed prompt or has a specific documented reason for being inactive. It also checks source immutability. Additional tests cover compact/detailed metadata, photo guidance, clothing modifiers, crop visibility and identity wording. This is isolated-option coverage, not an assertion that every possible combination of custom prose is compatible.

The offline API test uses the actual bundled Chroma graph and the real dispatch pipeline with a fake ComfyUI HTTP response. It verifies exact positive/negative text at nodes 748/749, seed at RandomNoise, requested width/height, steps, CFG and sampler, saved recipe correspondence, and immutable model/encoder/VAE/tokenizer/shift and beta scheduler parameters. Existing backend checks cover the broader queue and sampling paths.

Primary-source references checked for the encoder/VAE and workflow arrangement:
- https://huggingface.co/lodestones/Chroma1-HD/blob/main/ComfyUI_Chroma1-HD_T2I-workflow.json
- https://comfy.org/hub/models/local/chroma1-hd-fp8mixed/

The local app's Balanced recipe remains 768x1152, 26 steps, CFG 3.8, Euler. These are app defaults, not a claim that the creator guarantees optimal output at these settings. Portrait-specific dimensions can be changed through the existing render controls.

Live GPU output, actual encoder tokenization, model-file integrity and physical mobile interaction were not tested here. Custom keyword text can still contain semantic contradictions, and sampling/model limitations can still cause ignored traits or artifacts. Compiler and offline dispatch correctness do not guarantee image quality.
