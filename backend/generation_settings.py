"""Apply creation controls to generation nodes without changing repair stages."""
import math


SAMPLING_FIELDS = {
    "KSampler": {"steps", "cfg", "sampler_name", "scheduler"},
    "KSamplerAdvanced": {"steps", "cfg", "sampler_name", "scheduler"},
    "CFGGuider": {"cfg"},
    "KSamplerSelect": {"sampler_name"},
    "BasicScheduler": {"steps", "scheduler"},
    "BetaSamplingScheduler": {"steps"},
    "Flux2Scheduler": {"steps", "width", "height"},
}
LATENT_TYPES = {"EmptyLatentImage", "EmptySD3LatentImage", "EmptyFlux2LatentImage"}


def normalize_generation_settings(requested, prompt_style=""):
    """Return the values actually dispatched, including distilled model settings."""
    values = {key: value for key, value in requested.items() if value is not None}
    for key, low, high in (
        ("width", 256, 2048), ("height", 256, 2048),
        ("batch_size", 1, 8), ("steps", 1, 100), ("cfg", 0, 30),
    ):
        if key not in values:
            continue
        number = float(values[key])
        if not math.isfinite(number):
            raise ValueError(f"{key} must be a finite number")
        number = max(low, min(high, number))
        # Latent canvas dimensions must be divisible by eight.
        values[key] = int(number) // 8 * 8 if key in {"width", "height"} else (
            float(number) if key == "cfg" else int(number)
        )
    if prompt_style in {"krea2", "flux2_klein"}:
        values.update(steps=8 if prompt_style == "krea2" else 4,
                      cfg=1.0, sampler_name="euler")
        if prompt_style == "krea2":
            values["scheduler"] = "simple"
        else:
            # FLUX.2 uses Flux2Scheduler rather than a named scheduler.
            values.pop("scheduler", None)
    return values


def apply_generation_settings(workflow, values):
    """Patch literal inputs only; linked inputs and detailer settings stay intact.

    The returned node map records effective values, including template defaults.
    Unknown custom nodes retain their own settings rather than receiving every
    control merely because they happen to have a field named width or steps.
    """
    effective = {}
    for node_id, node in workflow.items():
        if not isinstance(node, dict) or not isinstance(node.get("inputs"), dict):
            continue
        inputs = node["inputs"]
        kind = node.get("class_type")
        fields = SAMPLING_FIELDS.get(kind, set())
        if kind in LATENT_TYPES:
            fields = {"width", "height", "batch_size"}
        for key in fields:
            if key in values and key in inputs and not isinstance(inputs[key], list):
                inputs[key] = values[key]
        if fields:
            effective[str(node_id)] = {key: inputs[key] for key in sorted(fields)
                                        if key in inputs and not isinstance(inputs[key], list)}
    return effective
