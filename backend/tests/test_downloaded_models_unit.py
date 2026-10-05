import ast
import copy
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from downloaded_models import resolve_downloaded_models, patch_ltx_video
from generation_settings import normalize_generation_settings, apply_generation_settings

class DownloadedModelTests(unittest.TestCase):
    def graph(self, file):
        return json.loads((ROOT / 'backend/seed_workflows' / file).read_text())

    def info(self, graph):
        info = {n['class_type']: {'input': {'required': {}}} for n in graph.values()}
        for node in graph.values():
            for field in ('ckpt_name', 'text_encoder', 'vae_name'):
                if field in node['inputs']:
                    info[node['class_type']]['input']['required'][field] = [['shared/' + node['inputs'][field]]]
        return info

    def test_graphs_and_registration(self):
        tree = ast.parse((ROOT / 'backend/server.py').read_text())
        specs = ast.literal_eval(next(n.value for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'SEED_WORKFLOWS' for t in n.targets)))
        for file, style, kind in [('krea2_aio.json','krea2_aio','image'),('qwen_remix_edit.json','qwen_remix','edit'),('sulphur2_t2v.json','ltx_t2v','text_video')]:
            graph = self.graph(file)
            self.assertTrue(any(s['file'] == file and s['prompt_style'] == style and s['kind'] == kind for s in specs))
            for node in graph.values():
                for value in node['inputs'].values():
                    if isinstance(value, list): self.assertIn(value[0], graph)
            self.assertFalse(any('Lora' in n['class_type'] for n in graph.values()))
            self.assertEqual(resolve_downloaded_models(graph,self.info(graph),style), [])
            self.assertTrue(graph['1']['inputs']['ckpt_name'].startswith('shared/'))

    def test_missing_models_are_not_substituted_or_partially_patched(self):
        graph=self.graph('krea2_aio.json'); original=copy.deepcopy(graph); info=self.info(graph)
        info['CheckpointLoaderSimple']['input']['required']['ckpt_name']=[['another-krea.safetensors']]
        self.assertTrue(resolve_downloaded_models(graph,info,'krea2_aio'))
        self.assertEqual(graph,original)
        graph=self.graph('sulphur2_t2v.json'); info=self.info(graph); del info['LTXAVTextEncoderLoader']
        self.assertIn('ComfyUI node: LTXAVTextEncoderLoader',resolve_downloaded_models(graph,info,'ltx_t2v'))

    def test_aio_outputs_and_edit_source(self):
        graph=self.graph('krea2_aio.json')
        self.assertEqual(graph['4']['inputs']['clip'],['1',1])
        self.assertEqual(graph['8']['inputs']['vae'],['1',2])
        self.assertEqual(graph['6']['class_type'],'EmptyLatentImage')
        graph=self.graph('qwen_remix_edit.json')
        for id in ['5','6']:
            self.assertEqual(graph[id]['inputs']['image1'],['12',0])
        self.assertEqual(graph['7']['inputs']['pixels'],['12',0])

    def test_ltx_audio_video_duration_and_dimensions(self):
        graph=self.graph('sulphur2_t2v.json')
        self.assertEqual(patch_ltx_video(graph,78,24,833,481),(73,24))
        self.assertEqual(graph['6']['inputs']['length'],73)
        self.assertEqual(graph['6']['inputs']['width'],832)
        self.assertEqual(graph['18']['inputs']['frames_number'],73)
        self.assertEqual(graph['18']['inputs']['frame_rate'],24)
        self.assertEqual(graph['5']['inputs']['frame_rate'],24)
        self.assertEqual(graph['14']['inputs']['fps'],24)
        self.assertEqual(graph['13']['inputs']['vae'],['22',0])
        self.assertEqual(graph['14']['inputs']['audio'],['21',0])

    def test_sampling_not_overwritten_by_other_model_recipes(self):
        for file,style,steps,sampler in [('krea2_aio.json','krea2_aio',12,'euler_ancestral'),('sulphur2_t2v.json','ltx_t2v',8,'euler')]:
            graph=self.graph(file)
            values=normalize_generation_settings({'steps':35,'cfg':4,'sampler_name':'dpmpp_2m','scheduler':'karras'},style)
            apply_generation_settings(graph,values)
            self.assertEqual(values['steps'],steps);self.assertEqual(values['cfg'],1)
            self.assertEqual(values['sampler_name'],sampler)
        self.assertEqual(graph['7']['inputs']['steps'],8)
        self.assertEqual(graph['7']['inputs']['terminal'],0.1)

if __name__ == '__main__': unittest.main()
