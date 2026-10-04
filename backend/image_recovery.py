"""Source-based recovery recipes; never inherit another model's LoRAs/settings."""
import copy

REPAIR_TARGETS = {"face", "hands", "feet", "limbs"}
PRESERVE = (
    "Preserve the source subject identity, age, body proportions, pose, clothing, "
    "background, lighting, camera perspective, and framing. Leave unrequested details unchanged."
)


def apply_recovery_strength(workflow, strength):
    """Keep linked controls intact and report whether strength can take effect."""
    patched = False
    for node in workflow.values():
        if not isinstance(node, dict) or node.get("class_type") not in {
            "KSampler", "KSamplerAdvanced", "SplitSigmasDenoise",
        }:
            continue
        inputs = node.get("inputs", {})
        if isinstance(inputs.get("denoise"), (int, float)):
            inputs["denoise"] = strength
            patched = True
    return patched


def recovery_recipe(source, reference, workflow_id, mode, strength, targets, instruction, seed=None):
    if mode not in {"small_variation", "anatomy_repair"}:
        raise ValueError("Unknown recovery mode")
    if mode == "anatomy_repair" and (not targets or set(targets) - REPAIR_TARGETS):
        raise ValueError("Choose face, hands, feet, or limbs to repair")
    name = reference.get("name", "")
    if not name:
        raise ValueError("The source image was not prepared")
    subfolder = reference.get("subfolder", "").strip("/")
    prompt = (
        "Make only a subtle variation in expression and small photographic details. "
        if mode == "small_variation" else
        f"Correct technical anatomy defects only in these areas: {', '.join(dict.fromkeys(targets))}. "
        "Restore coherent joints and connected anatomy without changing the intended appearance. "
    ) + instruction.strip() + " " + PRESERVE
    result = {key: copy.deepcopy(source[key]) for key in
              ("character_id", "dna", "subjects", "locks", "prompt_language") if key in source}
    result.update(
        workflow_id=workflow_id, workflow_type="image", operation=mode,
        reference_image=f"{subfolder}/{name}" if subfolder else name,
        reference_source_render_id=reference["source_render_id"],
        parent_render_id=reference["source_render_id"],
        prompt_positive=prompt, prompt_negative="", seed=seed,
        preserve_unmentioned=True, hidden_from_gallery=False,
    )
    if mode == "small_variation":
        result["refine_denoise"] = max(0.05, min(0.35, strength))
    else:
        result.update(edit_instruction=prompt, repair_targets=list(dict.fromkeys(targets)),
                      repair_strength=max(0.2, min(0.85, strength)))
    return result
