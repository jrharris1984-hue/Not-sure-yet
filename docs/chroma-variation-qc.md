# Chroma source-image variations

The bundled variation graph used BetaSamplingScheduler (26 steps, alpha/beta 0.45) followed by SplitSigmasDenoise. ComfyUI splits by a fraction of the schedule's step count, not by the requested starting noise level. At strength 0.22 this selects only about six tail steps, concentrated at low noise for this Beta curve. That provides a likely explanation for visually unchanged images, although no GPU reproduction was available.

The variation bundle now uses BasicScheduler with the simple schedule and a denoise input, connected directly to SamplerCustomAdvanced. ComfyUI constructs the denoise-aware schedule while retaining the requested sampling step count. The strength is patched on BasicScheduler and recorded in effective node settings. Source-image loading/VAE encoding, model, encoder, prompt mapping, CFG, sampler and seed controls remain intact.

Existing saved copies of the old bundled Chroma variation topology are repaired on the dispatch copy. The stored workflow is unchanged. The migration recognizes the original node connections, Beta parameters and output prefix, rejects extra schedule consumers or edited schedules, and is idempotent. It is scoped to Chroma variation workflows, so text-to-image and Pose Assist schedules retain their current behavior.

Validation: 195 offline backend tests and 49 subtests passed, along with git diff --check. Added coverage verifies old/new graph wiring, strength values, custom schedule preservation and real dispatch payloads with source pixels, prompt text and two requested seeds. No live GPU render was performed; small variations remain source-constrained image-to-image generation rather than instruction-model editing.

ComfyUI implementation references:
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_custom_sampler.py (BasicScheduler and SplitSigmasDenoise)
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy/samplers.py (simple and Beta schedules)
