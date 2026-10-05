"""Reference roles and camera instructions for dedicated Qwen edit workflows."""
from pathlib import PurePosixPath

AZIMUTHS = ('front view', 'front-right quarter view', 'right side view', 'back-right quarter view',
            'back view', 'back-left quarter view', 'left side view', 'front-left quarter view')
ELEVATIONS = ('low-angle shot', 'eye-level shot', 'elevated shot', 'high-angle shot')
DISTANCES = ('close-up', 'medium shot', 'wide shot')
PRESERVE = ('Preserve the same person from image 1: facial identity, age, hairstyle, body proportions, '
            'exact clothing, clothing coverage and accessories. Keep the original photographic appearance, '
            'lighting and environment. Do not borrow identity, clothing or background from another reference.')


def reference_edit_prompt(variant, notes='', azimuth='front view', elevation='eye-level shot', distance='medium shot'):
    if variant == 'pose':
        instruction = ('Make the person in image 1 do the pose of the person in image 2. '
                       'Use image 2 only for body positioning, head tilt, gaze and framing. '
                       'Keep the background of image 1; reconstruct only areas revealed by the new pose. ')
    elif variant == 'camera':
        if azimuth not in AZIMUTHS or elevation not in ELEVATIONS or distance not in DISTANCES:
            raise ValueError('Select a supported camera view, height and distance.')
        instruction = f'<sks> {azimuth} {elevation} {distance}. Change only the camera viewpoint. Keep the original body pose. '
    else:
        raise ValueError('Unknown Qwen reference edit workflow.')
    return instruction + PRESERVE + (f' Additional direction: {notes.strip()}' if notes.strip() else '')


def configure_reference_edit(workflow, variant, source_image, pose_image=None, **prompt_options):
    if not source_image:
        raise ValueError('Upload the original person photograph first.')
    if variant == 'pose' and not pose_image:
        raise ValueError('Upload a separate target-pose photograph or mannequin image.')
    if variant == 'pose' and source_image == pose_image:
        raise ValueError('Choose a different target pose image; the original photo is already the identity reference.')
    roles = {'source_image': source_image}
    if variant == 'pose':
        roles['pose_image'] = pose_image
    for key, image in roles.items():
        node = workflow.get(key, {})
        if node.get('class_type') != 'LoadImage':
            raise ValueError('The reference workflow has lost its image roles. Refresh bundled workflows in Settings.')
        node['inputs']['image'] = image
    return reference_edit_prompt(variant, **prompt_options)


def resolve_reference_models(workflow, object_info):
    """Use ComfyUI's actual relative model paths, including subfolders; report missing dependencies."""
    missing = []
    loaders = {'UNETLoader': 'unet_name', 'CLIPLoader': 'clip_name', 'VAELoader': 'vae_name',
               'LoraLoaderModelOnly': 'lora_name'}
    for node in workflow.values():
        node_type = node.get('class_type', '')
        if node_type not in object_info:
            missing.append(f'node {node_type}')
            continue
        key = loaders.get(node_type)
        if not key:
            continue
        requested = node['inputs'][key]
        spec = object_info[node_type].get('input', {}).get('required', {}).get(key, [])
        options = spec[0] if spec and isinstance(spec[0], list) else []
        # Preserve exact paths; otherwise reuse the same filename in a model subfolder.
        name = PurePosixPath(requested.replace('\\', '/')).name
        matches = [value for value in options if PurePosixPath(str(value).replace('\\', '/')).name == name]
        if requested in options:
            continue
        if len(matches) == 1:
            node['inputs'][key] = matches[0]
        else:
            missing.append(requested if not matches else f'ambiguous model path for {name}')
    return sorted(set(missing))


def configure_camera_strength(workflow, denoise=1.0, lora_strength=0.9):
    """Change only the camera task controls; preserve model-specific sampling defaults."""
    if not 0.5 <= denoise <= 1.0 or not 0.8 <= lora_strength <= 1.0:
        raise ValueError('Camera denoise must be 0.5–1.0 and LoRA strength 0.8–1.0.')
    sampler = workflow.get('sampler', {})
    lora = workflow.get('task_lora', {})
    if sampler.get('class_type') != 'KSampler' or lora.get('class_type') != 'LoraLoaderModelOnly':
        raise ValueError('Camera workflow is missing its sampler or camera LoRA. Refresh bundled workflows in Settings.')
    sampler['inputs']['denoise'] = denoise
    lora['inputs']['strength_model'] = lora_strength
