"""Wire ordered input references into the dedicated, native editing graphs."""
REFERENCE_STYLES = {'flux2_klein_edit', 'qwen_reference'}


def configure_composition(workflow, style, images):
    minimum = 2 if style == 'qwen_reference' else 1
    if style not in REFERENCE_STYLES:
        raise ValueError('Unsupported reference editor.')
    if not minimum <= len(images) <= 3:
        raise ValueError(f'Upload {minimum}–3 reference images for this workflow.')
    normalized = []
    for image in images:
        name = str(image).strip().replace('\\', '/')
        if not name or name.startswith('/') or ':' in name or any(part in {'', '.', '..'} for part in name.split('/')):
            raise ValueError('Use reference filenames returned by the image uploader.')
        normalized.append(name)
    if len(set(normalized)) != len(normalized):
        raise ValueError('Use different files for each reference image.')
    # Rebuild only named reference nodes; never repeat image 1 into every LoadImage.
    for key in list(workflow):
        if key.startswith('reference_'):
            del workflow[key]
    def node(kind, **inputs):
        return {'class_type':kind, 'inputs':inputs}
    for index, image in enumerate(normalized, 1):
        workflow[f'reference_image_{index}'] = node('LoadImage', image=image)
        workflow[f'reference_scale_{index}'] = node('ImageScaleToTotalPixels', image=[f'reference_image_{index}',0], upscale_method='area', megapixels=1.0, resolution_steps=1)
        if style == 'flux2_klein_edit':
            workflow[f'reference_encode_{index}'] = node('VAEEncode', pixels=[f'reference_scale_{index}',0], vae=['vae',0])
            for polarity in ('positive','negative'):
                previous = polarity if index == 1 else f'reference_{polarity}_{index-1}'
                workflow[f'reference_{polarity}_{index}'] = node('ReferenceLatent', conditioning=[previous,0], latent=[f'reference_encode_{index}',0])
    if style == 'flux2_klein_edit':
        for polarity in ('positive','negative'):
            workflow['guider']['inputs'][polarity] = [f'reference_{polarity}_{len(normalized)}',0]
    else:
        for polarity in ('positive','negative'):
            inputs = workflow[polarity]['inputs']
            for index in range(1,4):
                inputs.pop(f'image{index}', None)
            for index in range(1,len(normalized)+1):
                inputs[f'image{index}'] = [f'reference_scale_{index}',0]
    return normalized
