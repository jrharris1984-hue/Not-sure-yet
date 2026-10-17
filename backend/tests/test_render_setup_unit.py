import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from render_setup import graph_setup, correct_qwen_lightning, workflow_comparison_recipe

class RenderSetupTests(unittest.TestCase):
    def test_actual_graph_and_linked_values(self):
        graph = {'1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'actual'}},
                 '2': {'class_type': 'PrimitiveInt', 'inputs': {'value': 8}},
                 '3': {'class_type': 'KSampler', 'inputs': {'steps': ['2',0], 'cfg': 1}},
                 '4': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'lora_name': 'off', 'strength_model': 0}}}
        result = graph_setup(graph)
        self.assertEqual(result['models'], ['actual'])
        self.assertEqual(result['sampling'][0]['steps'], 8)
        self.assertEqual(result['loras'], [])
    def test_qwen_fix_is_version_specific(self):
        graph = {'1': {'inputs': {'unet_name': 'qwen_image_edit_2511_fp8mixed.safetensors'}},
                 '2': {'inputs': {'lora_name': 'Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors'}}}
        correct_qwen_lightning(graph)
        self.assertIn('2511-Lightning', graph['2']['inputs']['lora_name'])
    def test_comparison_clears_source_controls(self):
        source = dict(prompt_positive='portrait', seed=42, width=1024, height=1024,
                      selected_lora_name='source', steps=40, reference_image='image')
        result = workflow_comparison_recipe(source, 'target')
        self.assertEqual(result['seed'], 42)
        self.assertEqual(result['workflow_id'], 'target')
        self.assertNotIn('steps', result)
        self.assertNotIn('selected_lora_name', result)
        self.assertNotIn('reference_image', result)

class ComparisonEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_queue_keeps_seed_and_rejects_reference_work(self):
        import ast
        from types import SimpleNamespace
        from unittest.mock import AsyncMock
        class HTTPException(Exception):
            def __init__(self, status_code, detail):
                self.status_code, self.detail = status_code, detail
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
        fn = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'compare_render_workflow')
        fn.decorator_list = []
        fn.returns = None
        for arg in fn.args.args:
            arg.annotation = None
        original = SimpleNamespace(id='source-wf', prompt_style='krea2', kind='image')
        target = SimpleNamespace(id='target', prompt_style='sdxl', kind='image')
        recipe = dict(workflow_id='source-wf', seed=42, width=1024, height=1024, prompt_positive='portrait')
        enqueue = AsyncMock(return_value={'id':'queued'})
        from render_setup import COMPARABLE_STYLES
        namespace = dict(_render_recipe=AsyncMock(return_value=({'status':'done'}, recipe)),
                         get_settings=AsyncMock(return_value=SimpleNamespace(workflows=[original,target])),
                         COMPARABLE_STYLES=COMPARABLE_STYLES, HTTPException=HTTPException,
                         workflow_comparison_recipe=workflow_comparison_recipe,
                         DispatchBody=lambda **values: values, _enqueue_render=enqueue)
        exec(compile(ast.Module(body=[fn], type_ignores=[]), '<comparison>', 'exec'), namespace)
        await namespace['compare_render_workflow']('render-source', SimpleNamespace(workflow_id='target'))
        queued = enqueue.call_args.args[0]
        self.assertEqual(queued['seed'], 42)
        self.assertEqual(queued['parent_render_id'], 'render-source')
        self.assertEqual(queued['workflow_id'], 'target')
        recipe['reference_image'] = 'reference.png'
        with self.assertRaises(HTTPException) as error:
            await namespace['compare_render_workflow']('render-source', SimpleNamespace(workflow_id='target'))
        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(enqueue.await_count, 1)
