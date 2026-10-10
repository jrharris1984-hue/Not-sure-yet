"""A core-node-only starter workflow and a real first-run GPU render check."""
import copy
import json
import time
from urllib.request import Request, build_opener, ProxyHandler
from services import URL, check_cancel

NAME = 'Desktop starter · SDXL Base 1.0'
WORKFLOW = {
    '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'sd_xl_base_1.0.safetensors'}},
    '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': 'A photograph of a red ceramic mug on a wooden table, natural window light', 'clip': ['1', 1]}},
    '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': '', 'clip': ['1', 1]}},
    '4': {'class_type': 'EmptyLatentImage', 'inputs': {'width': 1024, 'height': 1024, 'batch_size': 1}},
    '5': {'class_type': 'KSampler', 'inputs': {'seed': 42, 'steps': 25, 'cfg': 7, 'sampler_name': 'euler', 'scheduler': 'normal', 'denoise': 1,
                                            'model': ['1', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': ['4', 0]}},
    '6': {'class_type': 'VAEDecode', 'inputs': {'samples': ['5', 0], 'vae': ['1', 2]}},
    '7': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': 'UltraStudio_Starter', 'images': ['6', 0]}},
}


def request_json(url, body=None, method=None):
    encoded = json.dumps(body).encode() if body is not None else None
    request = Request(url, data=encoded, headers={'Content-Type': 'application/json'}, method=method)
    with build_opener(ProxyHandler({})).open(request, timeout=15) as response:
        return json.load(response)


def test_render(progress, cancel, timeout=240):
    progress('Checking the starter model and running a small GPU test render…')
    info = request_json(URL + '/object_info')
    for node in WORKFLOW.values():
        if node['class_type'] not in info:
            raise RuntimeError(f'ComfyUI is missing starter node {node["class_type"]}.')
    models = info['CheckpointLoaderSimple']['input']['required']['ckpt_name'][0]
    if 'sd_xl_base_1.0.safetensors' not in models:
        raise RuntimeError('ComfyUI did not detect the starter model. Retry setup.')
    workflow = copy.deepcopy(WORKFLOW)
    workflow['4']['inputs'].update(width=512, height=512)
    workflow['5']['inputs']['steps'] = 8
    check_cancel(cancel)
    submitted = request_json(URL + '/prompt', {'prompt': workflow, 'client_id': 'ultra-studio-setup'})
    prompt_id = submitted.get('prompt_id')
    if not prompt_id or submitted.get('node_errors'):
        raise RuntimeError('ComfyUI rejected the starter test render.')
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        check_cancel(cancel)
        item = request_json(URL + '/history/' + prompt_id).get(prompt_id)
        if item:
            if item.get('status', {}).get('status_str') == 'error':
                raise RuntimeError('The starter GPU render failed. See logs/comfyui.log.')
            if item.get('outputs', {}).get('7', {}).get('images'):
                progress('GPU test render passed. Opening Ultra Studio…')
                return
        time.sleep(0.5)
    raise RuntimeError('The starter test render timed out. See logs/comfyui.log.')


def connect_studio(url, config):
    """Change only the managed endpoint and add one named starter, preserving user workflows."""
    if config['mode'] != 'managed':
        return
    request_json(url + '/api/settings', {'comfyui_url': URL}, 'PUT')
    if not config.get('starter'):
        return
    settings = request_json(url + '/api/settings')
    existing = next((item for item in settings['workflows'] if item['name'] == NAME), None)
    if existing is None:
        existing = request_json(url + '/api/workflows', {'name': NAME, 'kind': 'image', 'prompt_style': 'sdxl',
                                'json_str': json.dumps(WORKFLOW), 'positive_node_id': '2', 'negative_node_id': '3',
                                'notes': 'Installed desktop starter. Uses SDXL Base 1.0 and built-in ComfyUI nodes.'}, 'POST')
        # Make the installed, usable model the initial default once. Later user
        # choices remain intact on subsequent launches.
        request_json(url + '/api/settings', {'default_workflow_id': existing['id']}, 'PUT')


def verify_setup_runtime():
    """Frozen-build probe for the first-run UI and native archive dependencies."""
    from pathlib import Path
    import tempfile
    import tkinter as tk
    import py7zr
    root = tk.Tk()
    root.withdraw()
    root.update()
    root.destroy()
    with tempfile.TemporaryDirectory() as directory:
        folder = Path(directory)
        source = folder / 'probe.txt'
        source.write_text('Ultra Studio setup', encoding='utf-8')
        archive = folder / 'probe.7z'
        with py7zr.SevenZipFile(archive, 'w') as package:
            package.write(source, 'probe.txt')
        with py7zr.SevenZipFile(archive, 'r') as package:
            package.extractall(folder / 'output')
        if (folder / 'output' / 'probe.txt').read_text(encoding='utf-8') != 'Ultra Studio setup':
            raise RuntimeError('The bundled archive runtime failed its check.')
