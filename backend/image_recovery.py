"""Source-based recovery recipes; never inherit another model's LoRAs/settings."""
import copy

REPAIR_TARGETS = {"face", "hands", "feet", "limbs"}
PRESERVE = (
    "Apply the requested change to the source photograph. Preserve every unrequested "
    "detail, including identity, age, body proportions, pose, clothing, background, "
    "lighting, camera perspective, and framing unless that detail is explicitly requested to change. "
    "Leave unrequested details unchanged."
)


def apply_recovery_strength(workflow, strength):
    """Keep linked controls intact and report whether strength can take effect."""
    patched = False
    for node in workflow.values():
        if not isinstance(node, dict) or node.get("class_type") not in {
            "KSampler", "KSamplerAdvanced", "SplitSigmasDenoise", "BasicScheduler",
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
    requested = instruction.strip()
    if mode == "small_variation":
        prompt = (f"Requested change: {requested}. Make this change visible while staying close to the source photograph. "
                  if requested else "Make only a subtle variation in expression and small photographic details. ") + PRESERVE
    else:
        prompt = (f"Correct technical anatomy defects only in these areas: {', '.join(dict.fromkeys(targets))}. "
                  "Restore coherent joints and connected anatomy without changing the intended appearance. "
                  + requested + " " + PRESERVE)
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


def upgrade_chroma_variation_schedule(workflow):
    """Repair only the old bundled variation topology; retain custom schedules.

    A Beta tail split spent only a handful of steps near zero noise. A denoise-
    aware simple schedule keeps the requested number of steps and makes the
    strength describe the source-image noise range instead of a Beta tail count.
    """
    beta = workflow.get("10", {})
    split = workflow.get("11", {})
    sampler = workflow.get("16", {})
    save = workflow.get("18", {})
    b = beta.get("inputs", {})
    d = split.get("inputs", {})
    if not (beta.get("class_type") == "BetaSamplingScheduler"
            and split.get("class_type") == "SplitSigmasDenoise"
            and sampler.get("class_type") == "SamplerCustomAdvanced"
            and sampler.get("inputs", {}).get("sigmas") == ["11", 1]
            and d.get("sigmas") == ["10", 0]
            and b.get("model") == ["3", 0]
            and b.get("alpha") == 0.45 and b.get("beta") == 0.45
            and isinstance(b.get("steps"), int)
            and isinstance(d.get("denoise"), (int, float))
            and save.get("inputs", {}).get("filename_prefix") == "Chroma_Image_Variation"):
        return False
    # Extra consumers indicate an authored multi-stage graph, not the bundle.
    for key, node in workflow.items():
        if not isinstance(node, dict):
            continue
        for field, value in node.get("inputs", {}).items():
            if isinstance(value, list) and value and isinstance(value[0], str) and value[0] in {"10", "11"}:
                if (str(key), field) not in {("11", "sigmas"), ("16", "sigmas")}:
                    return False
    workflow["10"] = {"class_type": "BasicScheduler", "inputs": {
        "model": b["model"], "steps": b["steps"], "scheduler": "simple", "denoise": d["denoise"],
    }, "_meta": {"title": "Image Variation Schedule"}}
    del workflow["11"]
    sampler["inputs"]["sigmas"] = ["10", 0]
    return True
