"""Carry render controls into a shoot without replacing per-frame selections."""

SHOOT_RENDER_FIELDS = {
    "width", "height", "steps", "cfg", "sampler_name", "scheduler", "quality_tier",
    "selected_lora_name", "selected_lora_strength", "selected_lora_triggers", "selected_loras",
    "krea_style", "krea_lora_strength", "prompt_language", "locks", "refine_denoise",
    "face_strength", "faceid_v2_strength",
}


def shoot_render_settings(recipe):
    return {key: value for key, value in (recipe or {}).items()
            if key in SHOOT_RENDER_FIELDS and value is not None}


def shoot_base_dna(dna, set_overrides):
    base = dict(dna or {})
    for section in ("scene", "lighting", "camera"):
        base[section] = {**base.get(section, {}), **(set_overrides or {}).get(section, {})}
    return base
