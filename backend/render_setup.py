"""Audit the dispatched graph without guessing components from workflow labels."""
from copy import deepcopy


def graph_setup(graph):
    def literal(value):
        if not isinstance(value, list):
            return value
        if len(value) == 2 and str(value[0]) in graph:
            upstream = graph[str(value[0])].get('inputs', {})
            return next((upstream[k] for k in ('value', 'int', 'float', 'string')
                         if k in upstream and not isinstance(upstream[k], list)), None)
        return None

    result = {'models': [], 'encoders': [], 'vaes': [], 'loras': [], 'sampling': []}
    for node_id, node in graph.items():
        if not isinstance(node, dict):
            continue
        inputs, kind = node.get('inputs', {}), node.get('class_type', '')
        for field, group in [('unet_name', 'models'), ('ckpt_name', 'models'),
                             ('clip_name', 'encoders'), ('clip_name1', 'encoders'),
                             ('clip_name2', 'encoders'), ('vae_name', 'vaes')]:
            name = literal(inputs.get(field))
            if isinstance(name, str) and name not in result[group]:
                result[group].append(name)
        if 'lora' in kind.lower() and inputs.get('lora_name'):
            weights = {key: literal(inputs[key]) for key in ('strength_model', 'strength_clip', 'strength') if key in inputs}
            if not weights or any(value is None or value != 0 for value in weights.values()):
                result['loras'].append({'node_id': str(node_id), 'name': literal(inputs['lora_name']), **weights})
        if ('sampler' in kind.lower() or 'scheduler' in kind.lower() or 'guider' in kind.lower()):
            values = {key: literal(inputs[key]) for key in ('steps', 'cfg', 'sampler_name', 'scheduler', 'denoise') if key in inputs}
            if values:
                result['sampling'].append({'node_id': str(node_id), 'type': kind, **values})
    return result


def correct_qwen_lightning(graph):
    """Correct the known bundled 2511/2509 mismatch, including saved templates."""
    if not any('qwen_image_edit_2511' in str(n.get('inputs', {}).get('unet_name', '')).lower()
               for n in graph.values() if isinstance(n, dict)):
        return
    old = 'Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors'
    for node in graph.values():
        if isinstance(node, dict) and node.get('inputs', {}).get('lora_name') == old:
            node['inputs']['lora_name'] = old.replace('2509', '2511')


COMPARABLE_STYLES = {'krea2', 'krea2_test', 'krea2_aio', 'kroma', 'zimage', 'flux1_dev',
                     'flux2_klein', 'chroma', 'chroma_test', 'chroma_turbo', 'chroma_flash',
                     'sdxl', 'sdxl_dmd2', 'pony'}


def workflow_comparison_recipe(source, target_id):
    # Copy only controls that make sense across model families. Optional adapters,
    # pose controls and scene-learning state must not leak into another model.
    recipe = {key: deepcopy(source[key]) for key in ('character_id', 'dna', 'subjects',
              'prompt_positive', 'prompt_negative', 'seed', 'width', 'height') if key in source}
    recipe.update(workflow_id=target_id, workflow_type='image', batch_size=1,
                  operation='workflow_comparison')
    return recipe
