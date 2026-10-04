"""Validate AI shot suggestions and apply only supported per-frame controls."""
import json

SHOT_FIELDS = {
    "pose_action": ("pose", "action"),
    "framing": ("pose", "distance"),
    "view": ("pose", "angle"),
    "expression": ("face", "expression"),
    "outfit_preset": ("wardrobe", "outfit_preset"),
    "outfit_color": ("wardrobe", "garment_color"),
    "lighting_source": ("lighting", "source"),
    "lighting_temperature": ("lighting", "color_temp"),
    "environment": ("scene", "environment"),
    "background": ("scene", "background"),
}


def validate_shot_plan(result, count, catalog, lock_scenario):
    frames = result.get("frames") if isinstance(result, dict) else None
    if not isinstance(frames, list) or len(frames) != count:
        raise ValueError(f"AI must return exactly {count} shot cards. Try again with a shorter brief.")
    clean, warnings = [], []
    for frame in frames:
        if not isinstance(frame, dict):
            raise ValueError("AI returned an invalid shot card. Try again.")
        shot = {}
        for key in SHOT_FIELDS:
            value = frame.get(key, "")
            if not isinstance(value, str) or len(value) > 500:
                raise ValueError(f"AI returned an invalid {key}. Try again.")
            value = value.strip()
            if lock_scenario and key in ("environment", "background"):
                if value:
                    warnings.append("Location suggestions were omitted because the location is locked.")
                value = ""
            if value and key != "background" and value not in catalog.get(key, []):
                raise ValueError(f"AI suggested an unsupported {key}: {value}. Try again.")
            shot[key] = value
        clean.append(shot)
    if len({json.dumps(frame, sort_keys=True) for frame in clean}) < len(clean):
        warnings.append("Some shot cards are identical. Change a pose, expression, or framing for more variety.")
    return {"frames": clean, "warnings": list(dict.fromkeys(warnings))}


def apply_shot_controls(dna, frame, lock_scenario):
    out = json.loads(json.dumps(dna or {}))
    for section in ("pose", "lighting", "scene"):
        if section == "scene" and lock_scenario:
            continue
        allowed = {field for sec, field in SHOT_FIELDS.values() if sec == section}
        for key, value in (frame.get(f"{section}_overrides") or {}).items():
            if key in allowed and isinstance(value, str):
                out.setdefault(section, {})[key] = value
    return out
