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
        for name in ['kroma_opd', 'krea2_glamour_bf16', 'krea2_aksiom', 'krea2_lustify', 'krea2_stkreal', 'chroma_gonzalomo', 'chroma_danrisimix_ultra', 'chroma_unlocked_v50', 'chroma_clyb_uncanny_flash_v19']:
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
                style = {'kroma_opd': 'kroma', 'chroma_danrisimix_ultra': 'chroma_turbo', 'chroma_clyb_uncanny_flash_v19': 'chroma_flash'}.get(name, 'chroma_test' if name.startswith('chroma') else 'krea2_test')
                self.assertEqual(spec['prompt_style'], style)
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

    def test_glamour_bf16_uses_exact_diffusion_model_and_real_negative_conditioning(self):
        graph = dict(self.graphs())['krea2_glamour_bf16']
        model = 'fucktoyEthotsAnd_v10_bf16.safetensors'
        self.assertEqual(graph['1']['inputs']['unet_name'], model)
        self.assertEqual(graph['2']['inputs']['type'], 'krea2')
        self.assertEqual(graph['3']['inputs']['vae_name'], 'qwen_image_vae.safetensors')
        self.assertEqual(graph['5']['class_type'], 'CLIPTextEncode')
        self.assertEqual(graph['7']['inputs']['negative'], ['5', 0])
        original = copy.deepcopy(graph)
        info = self.info(graph)
        info['UNETLoader']['input']['required']['unet_name'][0].append('krea2_turbo_fp8.safetensors')
        self.assertEqual(resolve_separate_image_models(graph, info), [])
        self.assertEqual(graph['1']['inputs']['unet_name'], 'local/' + model)
        values = normalize_generation_settings({'steps': 20, 'cfg': 3.5, 'sampler_name': 'heun'}, 'krea2_test')
        apply_generation_settings(graph, values)
        self.assertEqual(graph['7']['inputs']['steps'], 20)
        self.assertEqual(graph['7']['inputs']['cfg'], 3.5)
        self.assertEqual(graph['7']['inputs']['sampler_name'], 'heun')
        self.assertEqual(original['1']['inputs']['unet_name'], model)

    def test_custom_sampling_is_not_reset_to_original_turbo_defaults(self):
        graph = next(self.graphs())[1]
        values = normalize_generation_settings({'steps': 9, 'scheduler': 'beta', 'cfg': 1.2}, 'krea2_test')
        apply_generation_settings(graph, values)
        self.assertEqual(graph['7']['inputs']['steps'], 9)
        self.assertEqual(graph['7']['inputs']['scheduler'], 'beta')
        self.assertEqual(graph['7']['inputs']['cfg'], 1.2)

    def test_danrisimix_has_its_own_turbo_recipe_and_adjustable_steps(self):
        graph = dict(self.graphs())['chroma_danrisimix_ultra']
        self.assertEqual(graph['731']['inputs']['unet_name'], 'Chroma1-HD-DanrisiMix-Hyper-Flash-Turbo-Ultra-int8-convrot.safetensors')
        self.assertEqual(graph['700']['inputs']['sampler_name'], 'heun')
        self.assertEqual(graph['694']['inputs']['cfg'], 1)
        self.assertEqual(graph['751']['class_type'], 'SigmoidOffsetScheduler')
        self.assertEqual(graph['751']['inputs']['steps'], 12)
        shape = {key: graph['751']['inputs'][key] for key in ('square_k', 'base_c', 'start_sigma')}
        values = normalize_generation_settings({'steps': 16, 'cfg': 1.5, 'sampler_name': 'heun', 'width': 768, 'height': 1024}, 'chroma_turbo')
        effective = apply_generation_settings(graph, values)
        self.assertEqual(effective['751'], {'steps': 16})
        self.assertEqual(graph['694']['inputs']['cfg'], 1.5)
        self.assertEqual(graph['737']['inputs']['width'], 768)
        self.assertEqual(graph['737']['inputs']['height'], 1024)
        self.assertEqual({key: graph['751']['inputs'][key] for key in shape}, shape)
        self.assertEqual(graph['694']['inputs']['negative'], ['749', 0])
        # The existing non-Turbo Chroma comparison remains unchanged.
        other = dict(self.graphs())['chroma_gonzalomo']
        self.assertEqual(other['751']['class_type'], 'BetaSamplingScheduler')
        self.assertEqual(other['751']['inputs']['steps'], 26)

    def test_danrisimix_reports_missing_custom_scheduler_without_partial_patching(self):
        graph = dict(self.graphs())['chroma_danrisimix_ultra']
        original = copy.deepcopy(graph)
        info = self.info(graph)
        del info['SigmoidOffsetScheduler']
        self.assertEqual(resolve_separate_image_models(graph, info), ['ComfyUI node: SigmoidOffsetScheduler'])
        self.assertEqual(graph, original)

    def test_unlocked_and_clyb_use_exact_models_with_distinct_sampling(self):
        graphs = dict(self.graphs())
        for stem, model, style, steps, cfg, sampler in [
            ('chroma_unlocked_v50', 'chroma-unlocked-v50.safetensors', 'chroma_test', 26, 3.8, 'euler'),
            ('chroma_clyb_uncanny_flash_v19', 'ClybUncannyChroma1-2K-Flash-v19.safetensors', 'chroma_flash', 8, 1, 'heun'),
        ]:
            with self.subTest(model=model):
                graph = graphs[stem]
                self.assertEqual(graph['731']['inputs'], {'unet_name': model, 'weight_dtype': 'default'})
                self.assertEqual(graph['751']['class_type'], 'BetaSamplingScheduler')
                self.assertEqual(graph['751']['inputs']['steps'], steps)
                self.assertEqual(graph['694']['inputs']['cfg'], cfg)
                self.assertEqual(graph['700']['inputs']['sampler_name'], sampler)
                self.assertNotIn('SigmoidOffsetScheduler', {n['class_type'] for n in graph.values()})
                values = normalize_generation_settings({'steps': 10, 'cfg': 2, 'sampler_name': 'heun'}, style)
                effective = apply_generation_settings(graph, values)
                self.assertEqual(effective['751'], {'steps': 10})
                self.assertEqual(graph['694']['inputs']['cfg'], 2)

    def test_kroma_fixed_mu_survives_canvas_and_sampling_changes(self):
        graph = dict(self.graphs())['kroma_opd']
        self.assertEqual(graph['1']['inputs']['unet_name'], 'kroma-v0.3.1-turbo-opd.safetensors')
        self.assertEqual(graph['2']['inputs'], {'clip_name':'qwen3vl_4b_fp8_scaled.safetensors', 'type':'krea2'})
        self.assertEqual(graph['3']['inputs']['vae_name'], 'qwen_image_vae.safetensors')
        self.assertEqual(graph['7']['inputs']['model'], ['10', 0])
        self.assertEqual(graph['10']['class_type'], 'ModelSamplingFlux')
        values = normalize_generation_settings({'steps':12,'cfg':1.5,'width':768,'height':1152}, 'kroma')
        apply_generation_settings(graph, values)
        self.assertEqual(graph['7']['inputs']['steps'], 12)
        self.assertEqual(graph['7']['inputs']['cfg'], 1.5)
        self.assertEqual(graph['6']['inputs']['width'], 768)
        self.assertEqual(graph['10']['inputs']['max_shift'], 1.15)
        self.assertEqual(graph['10']['inputs']['base_shift'], 1.15)
        # Equal endpoints give mu=1.15 at every canvas size in ModelSamplingFlux.
        original = copy.deepcopy(graph)
        info = self.info(graph)
        del info['ModelSamplingFlux']
        self.assertEqual(resolve_separate_image_models(graph, info), ['ComfyUI node: ModelSamplingFlux'])
        self.assertEqual(graph, original)
