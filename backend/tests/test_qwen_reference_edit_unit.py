import ast
import copy
import json
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
from unittest.mock import AsyncMock
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from qwen_reference_edit import configure_reference_edit, resolve_reference_models, reference_edit_prompt, AZIMUTHS, ELEVATIONS, DISTANCES

ROOT = Path(__file__).resolve().parents[1]
def graph(variant):
    return json.loads((ROOT / 'seed_workflows' / ('qwen_anypose.json' if variant == 'pose' else 'qwen_camera_angle.json')).read_text())
def object_info(workflow):
    fields = {'UNETLoader':'unet_name', 'CLIPLoader':'clip_name', 'VAELoader':'vae_name', 'LoraLoaderModelOnly':'lora_name'}
    result = {}
    for node in workflow.values():
        kind = node['class_type']
        info = result.setdefault(kind, {'input': {'required': {}}})
        if kind in fields:
            key = fields[kind]
            options = info['input']['required'].setdefault(key, [[]])[0]
            if node['inputs'][key] not in options: options.append(node['inputs'][key])
    return result

class ReferenceWorkflowTests(unittest.TestCase):
    def test_two_references_keep_separate_roles_and_latent_uses_original(self):
        workflow = graph('pose')
        prompt = configure_reference_edit(workflow, 'pose', 'original.png', 'target.png')
        self.assertEqual(workflow['source_image']['inputs']['image'], 'original.png')
        self.assertEqual(workflow['pose_image']['inputs']['image'], 'target.png')
        self.assertEqual(workflow['positive']['inputs']['image1'], ['source_scale',0])
        self.assertEqual(workflow['positive']['inputs']['image2'], ['pose_scale',0])
        self.assertEqual(workflow['latent']['inputs']['pixels'], ['source_scale',0])
        self.assertIn('exact clothing', prompt)
        self.assertIn('Keep the background of image 1', prompt)
        for pose in (None, 'original.png'):
            with self.assertRaises(ValueError): configure_reference_edit(graph('pose'), 'pose', 'original.png', pose)

    def test_camera_descriptors_are_validated_and_do_not_request_a_new_body_pose(self):
        for view in AZIMUTHS:
            for height in ELEVATIONS:
                for distance in DISTANCES:
                    result = reference_edit_prompt('camera', azimuth=view, elevation=height, distance=distance)
                    self.assertTrue(result.startswith(f'<sks> {view} {height} {distance}'))
                    self.assertIn('Keep the original body pose', result)
        with self.assertRaises(ValueError): reference_edit_prompt('camera', azimuth='invented')

    def test_installed_subfolders_are_reused_and_missing_dependencies_reported(self):
        workflow = graph('pose'); info = object_info(workflow)
        files = info['LoraLoaderModelOnly']['input']['required']['lora_name'][0]
        info['LoraLoaderModelOnly']['input']['required']['lora_name'][0] = ['installed/'+f for f in files]
        self.assertEqual(resolve_reference_models(workflow, info), [])
        self.assertTrue(workflow['task_lora']['inputs']['lora_name'].startswith('installed/'))
        info.pop('TextEncodeQwenImageEditPlus')
        info['LoraLoaderModelOnly']['input']['required']['lora_name'][0] = []
        errors = resolve_reference_models(workflow, info)
        self.assertIn('node TextEncodeQwenImageEditPlus', errors)
        self.assertTrue(any('AnyPose' in error for error in errors))

    def test_sampler_paths_and_download_manifest_cover_all_required_models(self):
        manifest = json.loads((ROOT.parent/'scripts/qwen-reference-downloads.json').read_text())
        downloads = {Path(item['path']).name for item in manifest}
        for variant in ('pose','camera'):
            workflow = graph(variant)
            for node in workflow.values():
                for key, value in node['inputs'].items():
                    if isinstance(value, list): self.assertIn(value[0], workflow)
                    if key in ('lora_name','unet_name','clip_name','vae_name'): self.assertIn(value, downloads)
            sampler = workflow['sampler']['inputs']
            self.assertEqual((sampler['steps'],sampler['cfg']), (4,1) if variant=='pose' else (40,4))
            self.assertEqual(sampler['positive'], ['positive',0])
            self.assertEqual(sampler['negative'], ['negative',0])
            self.assertEqual(workflow['save']['inputs']['images'], ['decode',0])

class EditDispatchTests(unittest.IsolatedAsyncioTestCase):
    async def test_actual_edit_dispatch_block_does_not_replace_pose_with_source(self):
        tree = ast.parse((ROOT/'server.py').read_text())
        # Run the real Qwen edit branch, including source validation and model lookup.
        block = next(n for n in ast.walk(tree) if isinstance(n, ast.If) and 'wf_template.kind in {\'edit\', \'enhance\'}' in ast.unparse(n.test))
        wrapper = ast.AsyncFunctionDef(name='run', args=ast.arguments(posonlyargs=[], args=[], kwonlyargs=[], kw_defaults=[], defaults=[]),
                                      body=[copy.deepcopy(block), ast.Return(value=ast.Name(id='positive_text',ctx=ast.Load()))], decorator_list=[])
        workflow=graph('pose')
        class Client:
            async def __aenter__(self): return self
            async def __aexit__(self,*args): pass
            async def get(self, url): return SimpleNamespace(raise_for_status=lambda:None,json=lambda:object_info(workflow))
        record=SimpleNamespace(status='queued',error='')
        record.model_dump=lambda: {'status':record.status,'error':record.error}
        ns={'wf_template':SimpleNamespace(kind='edit', edit_variant='pose'), 'workflow':workflow,
            'pos_id':'positive','neg_id':'negative','_detect_prompt_nodes':lambda w:{'positive_node_id':'positive','negative_node_id':'negative'},
            'body':SimpleNamespace(reference_image='person.png',pose_reference_image='pose.png',qwen_reference_notes='',
                                   qwen_camera_azimuth='front view',qwen_camera_elevation='eye-level shot',qwen_camera_distance='medium shot',
                                   edit_instruction='stale generic instruction',preserve_unmentioned=True),
            's':SimpleNamespace(comfyui_url='http://comfy'), 'httpx':SimpleNamespace(AsyncClient=lambda **kwargs:Client(),HTTPError=RuntimeError),
            'configure_reference_edit':configure_reference_edit, 'resolve_reference_models':resolve_reference_models,
            'r':record,'db':SimpleNamespace(renders=SimpleNamespace(insert_one=AsyncMock()))}
        module=ast.fix_missing_locations(ast.Module(body=[wrapper],type_ignores=[]))
        exec(compile(module,'server.py','exec'),ns)
        result=await ns['run']()
        self.assertIn('person in image 2',result)
        self.assertNotIn('stale generic instruction',result)
        self.assertEqual(workflow['pose_image']['inputs']['image'],'pose.png')
        ns['body'].pose_reference_image=None
        failed=await ns['run']()
        self.assertEqual(failed['status'],'failed')
        self.assertIn('target-pose',failed['error'])
