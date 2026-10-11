"""Validate downloaded checkpoint recipes against the connected ComfyUI instance."""
from qwen_test_models import _options, _select

CHECKPOINTS = {
    'krea2_aio': ['krea2TurboNSFWAIO_v10.safetensors'],
    'qwen_remix': ['qwenImageEditRemix_aioV20.safetensors', 'Qwen-Image-Edit-Remix-AIO-v2.0.safetensors'],
    'ltx_t2v': ['sulphur2DistilledNVFP4_nvfp4.safetensors', 'sulphur_distil_nvfp4.safetensors'],
}

SEPARATE_IMAGE_STYLES = {'krea2_test', 'chroma_test'}


def resolve_separate_image_models(workflow, info):
    """Resolve the selected graph's files exactly, including local subfolders."""
    if not info:
        return ['ComfyUI connection']
    missing, patches = [], []
    folders = {'unet_name': 'diffusion_models', 'clip_name': 'text_encoders', 'vae_name': 'vae'}
    for node in workflow.values():
        kind, inputs = node.get('class_type'), node.get('inputs', {})
        if kind not in info:
            missing.append('ComfyUI node: ' + str(kind))
            continue
        for field, folder in folders.items():
            if field not in inputs:
                continue
            name = str(inputs[field]).replace('\\', '/').split('/')[-1]
            selected = _select(_options(info, kind, field), [name])
            if selected is None:
                missing.append('models/' + folder + ': ' + name)
            else:
                patches.append((node, field, selected))
        if kind == 'CLIPLoader':
            types = _options(info, kind, 'type')
            if inputs.get('type') not in types:
                missing.append('CLIPLoader type: ' + str(inputs.get('type')) + ' (update ComfyUI)')
    if missing:
        return list(dict.fromkeys(missing))
    for node, field, selected in patches:
        node['inputs'][field] = selected
    return []


def resolve_downloaded_models(workflow, info, style):
    if not info:
        return ['ComfyUI connection']
    missing, patches = [], []
    for node in workflow.values():
        kind = node.get('class_type')
        if kind not in info:
            missing.append('ComfyUI node: ' + str(kind))
            continue
        for field in ('ckpt_name', 'text_encoder', 'vae_name'):
            if field not in node.get('inputs', {}):
                continue
            names = CHECKPOINTS[style] if field == 'ckpt_name' else [
                str(node['inputs'][field]).replace('\\', '/').split('/')[-1]
            ]
            selected = _select(_options(info, kind, field), names)
            if selected is None:
                missing.append(('models/checkpoints: ' if field == 'ckpt_name' else
                                'models/text_encoders: ' if field == 'text_encoder' else
                                'models/vae: ') + names[0])
            else:
                patches.append((node, field, selected))
    if missing:
        return list(dict.fromkeys(missing))
    for node, field, selected in patches:
        node['inputs'][field] = selected
    return []


def patch_ltx_video(workflow, frames, fps, width, height):
    """Keep video, conditioning, and audio duration consistent for native LTX nodes."""
    frames = ((max(41, min(241, int(frames))) - 1) // 8) * 8 + 1
    fps = max(8, min(30, int(fps)))
    for node in workflow.values():
        kind, inputs = node.get('class_type'), node.get('inputs', {})
        if kind == 'EmptyLTXVLatentVideo':
            inputs.update(length=frames, width=max(256, min(1280, int(width))) // 32 * 32,
                          height=max(256, min(1280, int(height))) // 32 * 32)
        elif kind == 'LTXVEmptyLatentAudio':
            # frames_number is video frames, not the number of audio latent tokens.
            inputs.update(frames_number=frames, frame_rate=fps)
        elif kind == 'LTXVConditioning':
            inputs['frame_rate'] = fps
        elif kind == 'CreateVideo':
            inputs['fps'] = fps
    return frames, fps
