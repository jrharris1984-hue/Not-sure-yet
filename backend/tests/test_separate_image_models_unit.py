import ast
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from downloaded_models import resolve_separate_image_models
from generation_settings import normalize_generation_settings, apply_generation_settings


class SeparateImageModelsTests(unittest.TestCase):
    def graphs(self):
        for name in ['krea2_aksiom', 'krea2_lustify', 'krea2_stkreal', 'chroma_gonzalomo']:
            yield name, json.loads((ROOT / 'seed_workflows' / (name + '.json')).read_text())

    def info(self, graph):
        result = {node['class_type']: {'input': {'required': {}}} for node in graph.values()}
        for node in graph.values():
            fields = result[node['class_type']]['input']['required']
            for key in ['unet_name', 'clip_name', 'vae_name']:
                if key in node['inputs']:
                    fields[key] = [['local/' + node['inputs'][key]]]
            if node['class_type'] == 'CLIPLoader':
                fields['type'] = [[node['inputs']['type']]]
        return result

    def test_graphs_are_connected_registered_and_have_no_baked_loras(self):
        tree = ast.parse((ROOT / 'server.py').read_text())
        specs = ast.literal_eval(next(node.value for node in tree.body if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'SEED_WORKFLOWS' for t in node.targets)))
        for name, graph in self.graphs():
            with self.subTest(name=name):
                spec = next(s for s in specs if s['file'] == name + '.json')
                self.assertEqual(spec['kind'], 'image')
                self.assertEqual(spec['prompt_style'], 'chroma_test' if name.startswith('chroma') else 'krea2_test')
                self.assertFalse(any('Lora' in n['class_type'] for n in graph.values()))
                self.assertTrue(any(n['class_type'] == 'SaveImage' for n in graph.values()))
                for node in graph.values():
                    for value in node['inputs'].values():
                        if isinstance(value, list):
                            self.assertIn(value[0], graph)
                self.assertEqual(resolve_separate_image_models(graph, self.info(graph)), [])
                loader = next(n for n in graph.values() if n['class_type'] == 'UNETLoader')
                self.assertTrue(loader['inputs']['unet_name'].startswith('local/'))

    def test_missing_selected_model_never_substitutes_turbo_or_partially_patches(self):
        for name, graph in self.graphs():
            with self.subTest(name=name):
                original = copy.deepcopy(graph)
                info = self.info(graph)
                info['UNETLoader']['input']['required']['unet_name'] = [['krea2_turbo_fp8_scaled.safetensors']]
                self.assertTrue(any('models/diffusion_models' in error for error in resolve_separate_image_models(graph, info)))
                self.assertEqual(graph, original)

    def test_reports_missing_encoder_vae_and_unsupported_clip_type(self):
        _, graph = next(self.graphs())
        info = self.info(graph)
        info['CLIPLoader']['input']['required']['clip_name'] = [[]]
        info['CLIPLoader']['input']['required']['type'] = [['stable_diffusion']]
        info['VAELoader']['input']['required']['vae_name'] = [[]]
        missing = resolve_separate_image_models(graph, info)
        self.assertTrue(any('models/text_encoders' in m for m in missing))
        self.assertTrue(any('models/vae' in m for m in missing))
        self.assertTrue(any('update ComfyUI' in m for m in missing))

    def test_custom_sampling_is_not_reset_to_original_turbo_defaults(self):
        graph = next(self.graphs())[1]
        values = normalize_generation_settings({'steps': 9, 'scheduler': 'beta', 'cfg': 1.2}, 'krea2_test')
        apply_generation_settings(graph, values)
        self.assertEqual(graph['7']['inputs']['steps'], 9)
        self.assertEqual(graph['7']['inputs']['scheduler'], 'beta')
        self.assertEqual(graph['7']['inputs']['cfg'], 1.2)
