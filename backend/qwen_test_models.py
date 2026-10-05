"""Resolve the two opt-in Qwen test models without substituting another model."""

def _options(info, kind, field):
    value = info.get(kind, {}).get('input', {}).get('required', {}).get(field, [])
    return value[0] if value and isinstance(value[0], list) else []


def _select(options, names):
    for name in names:
        for option in options:
            if str(option).replace('\\', '/').split('/')[-1].lower() == name.lower():
                return option
    return None


def resolve_qwen_test_models(workflow, info, style):
    if not info:
        return ['ComfyUI connection']
    rapid = style == 'qwen_rapid'
    specs = [('CheckpointLoaderSimple', 'ckpt_name', ['Qwen-Rapid-AIO-NSFW-v23.safetensors', 'phr00tQwenImageEditRapid_v230.safetensors'], 'Rapid AIO NSFW v23 checkpoint')] if rapid else [
        ('UNETLoader', 'unet_name', ['AGQI_2512_V2_fp8_e5m2.safetensors', 'agqi2512NSFW_agqi2512V2_full_fp8.safetensors', 'agqi2512NSFW_agqi2512V2_2456477.safetensors', 'agqi2512NSFW_agqi2512V2.safetensors'], 'AGQI 2512 V2 FP8 diffusion model'),
        ('CLIPLoader', 'clip_name', ['qwen_2.5_vl_7b_fp8_scaled.safetensors'], 'Qwen 2.5 VL 7B FP8 text encoder'),
        ('VAELoader', 'vae_name', ['qwen_image_vae.safetensors'], 'Qwen image VAE'),
    ]
    selections = []
    missing = []
    for kind, field, names, label in specs:
        value = _select(_options(info, kind, field), names)
        if not value:
            missing.append(label)
        else:
            selections.append((kind, field, value))
    for kind in {node.get('class_type') for node in workflow.values()}:
        if kind not in info:
            missing.append('ComfyUI node: ' + kind)
    if missing:
        return missing
    for kind, field, value in selections:
        for node in workflow.values():
            if node.get('class_type') == kind:
                node['inputs'][field] = value
    return []
