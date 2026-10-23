import ast
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from reference_composition import configure_composition
from downloaded_models import resolve_separate_image_models
from generation_settings import normalize_generation_settings, apply_generation_settings

STEMS = ['moss_finalcut_universal','flux1_dev_t2i','flux2_klein_edit','qwen_reference_composer','wan5b_t2v']
def graph(stem):
    return json.loads((ROOT/'seed_workflows'/(stem+'.json')).read_text())
def info_for(g):
    info = {node['class_type']:{'input':{'required':{}}} for node in g.values()}
    for node in g.values():
        fields=info[node['class_type']]['input']['required']
        for key in ['unet_name','clip_name','clip_name1','clip_name2','vae_name']:
            if key in node['inputs']: fields[key]=[['local/'+node['inputs'][key]]]
        if node['class_type'] in {'CLIPLoader','DualCLIPLoader'}:fields['type']=[[node['inputs']['type']]]
    return info

class LocalModelWorkflowTests(unittest.TestCase):
    def assert_connected(self,g):
        for node in g.values():
            for value in node['inputs'].values():
                if isinstance(value,list): self.assertIn(value[0],g)

    def test_all_four_registered_graphs_resolve_exact_files_and_are_connected(self):
        tree=ast.parse((ROOT/'server.py').read_text())
        specs=ast.literal_eval(next(n.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SEED_WORKFLOWS' for t in n.targets)))
        for stem in STEMS:
            with self.subTest(stem=stem):
                self.assertTrue(any(s['file']==stem+'.json' for s in specs))
                g=graph(stem);self.assert_connected(g)
                self.assertEqual(resolve_separate_image_models(g,info_for(g)),[])
                self.assertTrue(any(n['class_type'].startswith('Save') for n in g.values()))

    def test_dual_encoder_validation_reports_missing_t5_without_partial_patch(self):
        g=graph('flux1_dev_t2i');original=copy.deepcopy(g);info=info_for(g)
        info['DualCLIPLoader']['input']['required']['clip_name2']=[[]]
        self.assertIn('models/text_encoders: t5xxl_fp8_e4m3fn_scaled.safetensors',resolve_separate_image_models(g,info))
        self.assertEqual(g,original)
        self.assertFalse(any('Control' in n['class_type'] or n['class_type']=='LoadImage' for n in g.values()))

    def test_klein_reference_chains_include_each_image_in_both_conditionings(self):
        for count in (1,2,3):
            g=graph('flux2_klein_edit');images=[f'refs/{i}.png' for i in range(count)]
            self.assertEqual(configure_composition(g,'flux2_klein_edit',images),images)
            self.assert_connected(g)
            for i in range(1,count+1):
                self.assertEqual(g[f'reference_image_{i}']['inputs']['image'],images[i-1])
                for polarity in ('positive','negative'):
                    self.assertEqual(g[f'reference_{polarity}_{i}']['inputs']['latent'],[f'reference_encode_{i}',0])
                    self.assertEqual(g['guider']['inputs'][polarity],[f'reference_{polarity}_{count}',0])
            values=normalize_generation_settings({'steps':30,'cfg':5,'width':512,'height':768},'flux2_klein_edit')
            apply_generation_settings(g,values)
            self.assertEqual(g['schedule']['inputs']['steps'],4)
            self.assertEqual(g['guider']['inputs']['cfg'],1)
            self.assertEqual(g['schedule']['inputs']['width'],512)
            self.assertEqual(g['latent']['inputs']['width'],512)

    def test_qwen_composition_preserves_order_and_prunes_optional_third_image(self):
        g=graph('qwen_reference_composer')
        configure_composition(g,'qwen_reference',['a.png','b.png','c.png'])
        for key in ('positive','negative'):self.assertEqual(g[key]['inputs']['image3'],['reference_scale_3',0])
        configure_composition(g,'qwen_reference',['b.png','a.png'])
        self.assertEqual(g['reference_image_1']['inputs']['image'],'b.png')
        self.assertNotIn('reference_image_3',g)
        self.assertNotIn('image3',g['positive']['inputs']);self.assert_connected(g)

    def test_invalid_reference_counts_duplicates_and_paths_leave_graph_unchanged(self):
        for style,stem,images in [('qwen_reference','qwen_reference_composer',['a.png']),('flux2_klein_edit','flux2_klein_edit',[]),('qwen_reference','qwen_reference_composer',['a.png','a.png']),('flux2_klein_edit','flux2_klein_edit',['../a.png']),('flux2_klein_edit','flux2_klein_edit',['C:/a.png']),('flux2_klein_edit','flux2_klein_edit',['a.png']*4)]:
            with self.subTest(style=style,images=images):
                g=graph(stem);original=copy.deepcopy(g)
                with self.assertRaises(ValueError):configure_composition(g,style,images)
                self.assertEqual(g,original)

    def test_wan5b_uses_correct_vae_and_text_only_48_channel_latent_node(self):
        g=graph('wan5b_t2v')
        self.assertEqual(g['39']['inputs']['vae_name'],'wan2.2_vae.safetensors')
        self.assertEqual(g['55']['class_type'],'Wan22ImageToVideoLatent')
        self.assertNotIn('start_image',g['55']['inputs'])
        self.assertFalse(any(n['class_type']=='LoadImage' for n in g.values()))
        self.assertEqual(g['3']['inputs']['latent_image'],['55',0])
        self.assertEqual(g['3']['inputs']['steps'],30)

    def test_moss_uses_correct_architecture_and_universal_sampling(self):
        from downloaded_models import SEPARATE_IMAGE_STYLES
        self.assertIn('moss_image', SEPARATE_IMAGE_STYLES)
        g=graph('moss_finalcut_universal')
        self.assertEqual(g['1']['inputs']['unet_name'],'mossImageFinalcut5GB_universal.safetensors')
        self.assertEqual(g['2']['inputs']['type'],'moss_image')
        self.assertEqual(g['2']['inputs']['clip_name'],'qwen3.5_9b_w4a8_gptq.safetensors')
        self.assertEqual(g['3']['inputs']['vae_name'],'flux2-vae_small.safetensors')
        self.assertEqual(g['6']['class_type'],'EmptyFlux2LatentImage')
        self.assertEqual(g['7']['inputs']['steps'],6)
        self.assertEqual(g['7']['inputs']['cfg'],2.5)
        self.assertEqual(g['7']['inputs']['sampler_name'],'euler')
        original=copy.deepcopy(g);info=info_for(g)
        info['CLIPLoader']['input']['required']['clip_name']=[['qwen3vl_4b_fp8_scaled.safetensors']]
        self.assertTrue(resolve_separate_image_models(g,info));self.assertEqual(g,original)
        values=normalize_generation_settings({'width':776,'height':1032,'steps':6,'cfg':3},'moss_image')
        apply_generation_settings(g,values)
        self.assertEqual(g['6']['inputs']['width'],768)
        self.assertEqual(g['6']['inputs']['height'],1024)
        self.assertEqual(g['7']['inputs']['cfg'],3)
