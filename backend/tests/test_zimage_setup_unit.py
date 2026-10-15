from pathlib import Path
import copy
import json
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from zimage_setup import prepare_zimage

def graph(base=False):return json.loads((ROOT/'seed_workflows'/('zimage_base.json' if base else 'zimage.json')).read_text())
def info_for(g):
    info={n['class_type']:{'input':{'required':{}}} for n in g.values()}
    for node in g.values():
        fields=info[node['class_type']]['input']['required']
        for key in ('unet_name','clip_name','vae_name','lora_name','model_name'):
            if key in node['inputs']:fields[key]=[['local/'+node['inputs'][key]]]
        if node['class_type']=='CLIPLoader':fields['type']=[['lumina2']]
    return info
class ZImageSetupTests(unittest.TestCase):
    def test_all_files_resolve_subfolders_and_inactive_placeholders_are_removed(self):
        g=graph();missing,notes=prepare_zimage(g,info_for(g))
        self.assertEqual((missing,notes),([],[]))
        self.assertEqual(g['57:62']['inputs']['lora_name'],'local/ZITnsfwLoRA.safetensors')
        self.assertEqual(g['57:11']['inputs']['model'],['57:62',0])
        self.assertNotIn('106',g);self.assertIn('105',g)
        self.assertEqual(g['100']['inputs']['model_name'],'local/bbox/face_yolov8m.pt')
    def test_detector_missing_keeps_original_output_and_reports_no_enhancement(self):
        g=graph();info=info_for(g);info['UltralyticsDetectorProvider']['input']['required']['model_name']=[[]]
        missing,notes=prepare_zimage(g,info)
        self.assertEqual(missing,[]);self.assertIn('face enhancement',notes[0])
        self.assertIn('9',g);self.assertNotIn('105',g);self.assertNotIn('101',g);self.assertNotIn('102',g)
        for node in g.values():
            for value in node['inputs'].values():
                if isinstance(value,list):self.assertIn(value[0],g)
    def test_missing_upscaler_or_detailer_node_also_allows_original_only(self):
        for kind in ['FaceDetailer','ImageUpscaleWithModel','UpscaleModelLoader']:
            g=graph();info=info_for(g);del info[kind]
            self.assertEqual(prepare_zimage(g,info)[0],[]);self.assertNotIn('105',g)
    def test_missing_or_ambiguous_active_lora_fails_atomically(self):
        for choices in [[],['A/ZITnsfwLoRA.safetensors','B/ZITnsfwLoRA.safetensors']]:
            g=graph();original=copy.deepcopy(g);info=info_for(g);info['LoraLoaderModelOnly']['input']['required']['lora_name']=[choices]
            missing,notes=prepare_zimage(g,info)
            self.assertTrue(any('ZITnsfwLoRA' in m for m in missing));self.assertEqual(g,original);self.assertEqual(notes,[])
    def test_active_user_override_is_not_removed_as_an_inactive_placeholder(self):
        g=graph();g['106']['inputs'].update(lora_name='portrait.safetensors',strength_model=0.5)
        info=info_for(g);info['LoraLoaderModelOnly']['input']['required']['lora_name'][0].append('local/portrait.safetensors')
        self.assertEqual(prepare_zimage(g,info)[0],[]);self.assertIn('106',g)
        self.assertEqual(g['106']['inputs']['lora_name'],'local/portrait.safetensors')
    def test_base_requires_no_lora_detector_or_upscaler(self):
        g=graph(True);self.assertEqual(prepare_zimage(g,info_for(g)),([],[]))
        self.assertFalse(any('Lora' in n['class_type'] or 'Detailer' in n['class_type'] for n in g.values()))

    def test_custom_consumer_of_enhancement_is_never_silently_removed(self):
        g=graph();g['custom']={'class_type':'SaveImage','inputs':{'images':['101',0],'filename_prefix':'custom'}}
        original=copy.deepcopy(g);info=info_for(g);info['UltralyticsDetectorProvider']['input']['required']['model_name']=[[]]
        missing,notes=prepare_zimage(g,info)
        self.assertTrue(missing);self.assertEqual(notes,[]);self.assertEqual(g,original)
