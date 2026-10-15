"""Resolve Z-Image's local dependencies without mutating stored templates."""
from copy import deepcopy


def options(info, kind, field):
    spec = info.get(kind, {}).get('input', {}).get('required', {}).get(field, [])
    return [str(value) for value in spec[0]] if spec and isinstance(spec[0], list) else []


def select(requested, available):
    normalized = lambda value: str(value).replace('\\', '/').lower()
    exact = [value for value in available if normalized(value) == normalized(requested)]
    if len(exact) == 1:
        return exact[0]
    matches = [value for value in available if normalized(value).split('/')[-1] == normalized(requested).split('/')[-1]]
    return matches[0] if len(matches) == 1 else None


def prepare_zimage(workflow, info):
    if not info:
        return ['ComfyUI connection'], []
    graph, notes = deepcopy(workflow), []
    # Zero-weight placeholders still require a valid filename in ComfyUI.
    for key, node in list(graph.items()):
        if node.get('class_type') != 'LoraLoaderModelOnly' or float(node['inputs'].get('strength_model', 1)) != 0:
            continue
        source = node['inputs'].get('model')
        if not isinstance(source, list):
            continue
        for other in graph.values():
            for field, value in list(other.get('inputs', {}).items()):
                if value == [key, 0]:
                    other['inputs'][field] = list(source)
        del graph[key]
    # Only the bundled enhancement branch is optional. Never prune arbitrary
    # custom outputs or pretend that a missing active LoRA is available.
    bundled = (graph.get('9', {}).get('inputs', {}).get('images') == ['57:8', 0]
               and graph.get('105', {}).get('inputs', {}).get('images') == ['104', 0]
               and graph.get('101', {}).get('class_type') == 'FaceDetailer')
    enhancement_keys = {'100','101','102','103','104','105'}
    external_consumers = any(isinstance(value,list) and len(value)==2 and str(value[0]) in enhancement_keys
        for key,node in graph.items() if key not in enhancement_keys for value in node.get('inputs',{}).values())
    if bundled and not external_consumers:
        missing_enhancement = []
        for key in ('100','101','102','103','104','105'):
            node = graph.get(key, {})
            kind = node.get('class_type')
            if kind not in info:
                missing_enhancement.append(str(kind))
            elif 'model_name' in node.get('inputs', {}):
                if select(node['inputs']['model_name'], options(info, kind, 'model_name')) is None:
                    missing_enhancement.append(node['inputs']['model_name'])
        if missing_enhancement:
            graph = {key:node for key,node in graph.items() if key not in enhancement_keys}
            notes.append('Original image only; optional face enhancement is unavailable: ' + ', '.join(missing_enhancement))
    fields = {'UNETLoader':('unet_name',), 'CLIPLoader':('clip_name',), 'VAELoader':('vae_name',),
              'LoraLoaderModelOnly':('lora_name',), 'UltralyticsDetectorProvider':('model_name',), 'UpscaleModelLoader':('model_name',)}
    missing = []
    for node in graph.values():
        kind = node.get('class_type')
        if kind not in info:
            missing.append('ComfyUI node: ' + str(kind)); continue
        for field in fields.get(kind, ()):
            requested = node['inputs'].get(field, '')
            selected = select(requested, options(info, kind, field))
            if selected is None:
                missing.append(f'{kind} {field}: {requested} (missing or ambiguous)')
            else:
                node['inputs'][field] = selected
        if kind == 'CLIPLoader' and node['inputs'].get('type') not in options(info, kind, 'type'):
            missing.append('CLIPLoader type: ' + str(node['inputs'].get('type')))
    if missing:
        return list(dict.fromkeys(missing)), []
    workflow.clear(); workflow.update(graph)
    return [], notes
