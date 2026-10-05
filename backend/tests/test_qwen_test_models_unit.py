import ast
import base64
import io
import re
import zipfile
import copy
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from qwen_test_models import resolve_qwen_test_models
from generation_settings import apply_generation_settings, normalize_generation_settings
ROOT = Path(__file__).resolve().parents[2]

class QwenTestModelTests(unittest.TestCase):
    def graph(self, rapid=False):
        return json.loads((ROOT / 'backend/seed_workflows' / ('qwen_rapid_t2i.json' if rapid else 'qwen_agqi_t2i.json')).read_text())

    def info(self, graph):
        result = {n['class_type']: {'input': {'required': {}}} for n in graph.values()}
        for node in graph.values():
            for field in ['ckpt_name', 'unet_name', 'clip_name', 'vae_name']:
                if field in node['inputs']:
                    result[node['class_type']]['input']['required'][field] = [['test-folder/' + node['inputs'][field]]]
        return result

    def test_no_source_images_or_extra_lightning_loras(self):
        for rapid in [False, True]:
            graph = self.graph(rapid)
            self.assertFalse(any(n['class_type'] in ['LoadImage', 'VAEEncode', 'LoraLoader', 'LoraLoaderModelOnly'] for n in graph.values()))
            for node in graph.values():
                for value in node['inputs'].values():
                    if isinstance(value, list):
                        self.assertIn(value[0], graph)
            self.assertEqual(graph['8']['inputs']['positive'], ['5', 0])
            self.assertEqual(graph['8']['inputs']['negative'], ['6', 0])
            self.assertEqual(graph['8']['inputs']['latent_image'], ['7', 0])
        rapid = self.graph(True)
        self.assertEqual(rapid['5']['inputs']['clip'], ['1', 1])
        self.assertEqual(rapid['5']['inputs']['vae'], ['1', 2])
        self.assertNotIn('image1', rapid['5']['inputs'])

    def test_model_files_resolve_in_subfolders(self):
        for rapid, style in [(False, 'qwen_image'), (True, 'qwen_rapid')]:
            graph = self.graph(rapid)
            self.assertEqual(resolve_qwen_test_models(graph, self.info(graph), style), [])
            field = 'ckpt_name' if rapid else 'unet_name'
            self.assertTrue(graph['1']['inputs'][field].startswith('test-folder/'))

    def test_civitai_filename_alias_matches_exact_fp8_version(self):
        graph = self.graph()
        info = self.info(graph)
        info['UNETLoader']['input']['required']['unet_name'] = [['agqi2512NSFW_agqi2512V2_2456477.safetensors']]
        self.assertEqual(resolve_qwen_test_models(graph, info, 'qwen_image'), [])
        self.assertIn('2456477', graph['1']['inputs']['unet_name'])

    def test_completed_civitai_download_names_resolve_without_renaming(self):
        for rapid, style, filename in [
            (False, 'qwen_image', 'agqi2512NSFW_agqi2512V2_full_fp8.safetensors'),
            (True, 'qwen_rapid', 'phr00tQwenImageEditRapid_v230.safetensors'),
        ]:
            graph = self.graph(rapid); info = self.info(graph)
            kind, field = ('CheckpointLoaderSimple', 'ckpt_name') if rapid else ('UNETLoader', 'unet_name')
            info[kind]['input']['required'][field] = [['civitai/' + filename]]
            self.assertEqual(resolve_qwen_test_models(graph, info, style), [])
            self.assertEqual(graph['1']['inputs'][field], 'civitai/' + filename)
            manifest = json.loads((ROOT / 'scripts/qwen-t2i-test-downloads.json').read_text())
            self.assertIn(filename, next(e for e in manifest if e['mode'] == ('rapid' if rapid else 'agqi'))['aliases'])

    def test_other_qwen_models_are_not_silently_substituted(self):
        graph = self.graph(True); original = copy.deepcopy(graph)
        info = self.info(graph)
        info['CheckpointLoaderSimple']['input']['required']['ckpt_name'] = [['Qwen-Rapid-AIO-SFW-v23.safetensors', 'Qwen-Rapid-AIO-NSFW-v19.safetensors']]
        self.assertIn('Rapid AIO NSFW v23 checkpoint', resolve_qwen_test_models(graph, info, 'qwen_rapid'))
        self.assertEqual(graph, original)

    def test_missing_nodes_and_companions_have_setup_errors(self):
        graph = self.graph(); info = self.info(graph)
        del info['CLIPLoader']; del info['KSampler']
        missing = resolve_qwen_test_models(graph, info, 'qwen_image')
        self.assertIn('Qwen 2.5 VL 7B FP8 text encoder', missing)
        self.assertIn('ComfyUI node: KSampler', missing)
        self.assertEqual(resolve_qwen_test_models(graph, {}, 'qwen_image'), ['ComfyUI connection'])

    def test_sampling_controls_patch_latents_and_keep_rapid_cfg_one(self):
        for rapid, style in [(False, 'qwen_image'), (True, 'qwen_rapid')]:
            graph = self.graph(rapid)
            values = normalize_generation_settings({'width': 1025, 'height': 1025, 'steps': 8 if rapid else 50, 'cfg': 4}, style)
            apply_generation_settings(graph, values)
            self.assertEqual(graph['7']['inputs']['width'], 1024)
            self.assertEqual(graph['8']['inputs']['cfg'], 1 if rapid else 4)
            self.assertEqual(graph['8']['inputs']['scheduler'], 'beta' if rapid else 'simple')

    def test_seed_registration_uses_image_mode(self):
        tree = ast.parse((ROOT / 'backend/server.py').read_text())
        specs = ast.literal_eval(next(n.value for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'SEED_WORKFLOWS' for t in n.targets)))
        for style in ['qwen_image', 'qwen_rapid']:
            spec = next(s for s in specs if s.get('prompt_style') == style)
            self.assertEqual(spec['kind'], 'image')
            self.assertTrue((ROOT / 'backend/seed_workflows' / spec['file']).is_file())

    def test_standalone_batch_contains_all_current_dependencies(self):
        scripts = ROOT / 'scripts'
        launcher = (scripts / 'install-qwen-t2i-test-models.bat').read_text()
        payload = re.search(r'^::ULTRA_STUDIO_PAYLOAD::([A-Za-z0-9+/=]+)$', launcher, re.M)
        self.assertIsNotNone(payload)
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(payload.group(1)))) as bundle:
            self.assertIsNone(bundle.testzip())
            expected = ['install-qwen-t2i-test-models.ps1', 'verified-model-download.ps1', 'qwen-t2i-test-downloads.json']
            self.assertEqual(sorted(bundle.namelist()), sorted(expected))
            for name in expected:
                self.assertEqual(bundle.read(name), (scripts / name).read_bytes())

    def test_download_manifest_pins_version_hashes_and_matching_loaders(self):
        entries = json.loads((ROOT / 'scripts/qwen-t2i-test-downloads.json').read_text())
        for mode, rapid in [('agqi', False), ('rapid', True)]:
            entry = next(e for e in entries if e['mode'] == mode)
            self.assertEqual(entry['name'], self.graph(rapid)['1']['inputs']['ckpt_name' if rapid else 'unet_name'])
            self.assertEqual(len(entry['sha256']), 64)
            self.assertGreater(entry['bytes'], 19_000_000_000)
            self.assertTrue(entry['url'].startswith('https://'))
        self.assertEqual({e['folder'] for e in entries if e['mode'] == 'companions'}, {'text_encoders', 'vae'})

if __name__ == '__main__': unittest.main()
