import copy
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from learning_history import framing_recommendations, profile, LearningContext, workflow_revision, capture_learning_context


def example(index, *, rating='matched', prompt=None, **changes):
    record={'id':str(index),'status':'done','output_files':[f'{index}.png'],'seed_used':index,
        'prompt_positive':prompt or f'Clothed studio portrait {index%2}', 'prompt_negative':'blur',
        'generation_settings':{'width':896,'height':1344},
        'scene_feedback':{'ratings':{'framing':rating},'updated_at':f'2026-10-16T03:00:{index:02}Z'},
        'learning_context':{'version':1,'workflow_revision':'revision','profile':'profile','graph_signature':'graph','models':['portrait.safetensors']}}
    record.update(changes)
    return record


class LearningHistoryTests(unittest.TestCase):
    def recommend(self,records):return framing_recommendations(records,'revision','profile')
    def test_recommends_only_after_three_matches_and_multiple_prompts(self):
        for records in ([example(1),example(2)], [example(i,prompt='One prompt') for i in range(4)],
                        [example(i,rating='missed' if i<2 else 'matched') for i in range(5)]):
            self.assertEqual(self.recommend(records)['recommendations'],[])
        result=self.recommend([example(1),example(2),example(3),example(4,rating='missed')])
        self.assertEqual(result['reviewed_examples'],4)
        suggestion=result['recommendations'][0]
        self.assertEqual(suggestion['matched'],3)
        self.assertEqual(suggestion['reviewed'],4)
        self.assertEqual(suggestion['settings'],{'width':896,'height':1344})
        self.assertEqual(len(suggestion['evidence']),4)
    def test_cached_recreations_count_once_and_latest_feedback_wins(self):
        original=example(1)
        copy=example(2,prompt=original['prompt_positive'],seed_used=1,rating='missed')
        result=self.recommend([original,copy,example(3),example(4)])
        self.assertEqual(result['reviewed_examples'],3)
        self.assertEqual(result['recommendations'],[])
    def test_ignores_unsupported_and_unreviewed_results(self):
        for changes in ({'status':'running'},{'hidden_from_gallery':True},{'output_files':[]},
                        {'learning_context':{}},{'seed_used':None},{'generation_settings':{'width':895,'height':1344}},
                        {'scene_feedback':{'ratings':{'framing':'not_applicable'}}}):
            with self.subTest(changes=changes):
                self.assertEqual(self.recommend([example(1,**changes)])['reviewed_examples'],0)
    def test_models_revision_profiles_and_dimensions_do_not_pool_evidence(self):
        base=[example(1),example(2)]
        for field in ('workflow_revision','profile','graph_signature'):
            third=example(3);third['learning_context'][field]='different'
            with self.subTest(field=field):self.assertEqual(self.recommend(base+[third])['recommendations'],[])
        self.assertEqual(self.recommend(base+[example(3,generation_settings={'width':1024,'height':1024})])['recommendations'],[])
    def test_identity_stays_stable_as_new_feedback_arrives(self):
        records=[example(1),example(2),example(3)]
        first=self.recommend(records)['recommendations'][0]['id']
        self.assertEqual(self.recommend(records+[example(4)])['recommendations'][0]['id'],first)
        self.assertEqual(records[0]['generation_settings'],{'width':896,'height':1344})
    def test_sampling_lora_strength_and_framing_scope_are_separate(self):
        original=LearningContext(workflow_id='w',generation={'steps':8,'cfg':1},framing=['full body'])
        before=profile(original,'chroma')
        for values in ({'generation':{'steps':20,'cfg':1}},{'framing':['portrait']},
                       {'subject_count':2},{'selected_loras':[{'name':'portrait.safetensors','strength':.6}]},
                       {'lora_overrides':{'1':{'strength_model':.5}}}):
            with self.subTest(values=values):self.assertNotEqual(profile(original.model_copy(update=values),'chroma'),before)
        # Forced model settings use the actual normalized sampling recipe.
        self.assertEqual(profile(original,'krea2'),profile(original.model_copy(update={'generation':{'steps':40,'cfg':5}}),'krea2'))
    def test_workflow_revision_uses_graph_content_not_cosmetic_json_spacing(self):
        workflow=SimpleNamespace(id='w',json_str='{"1":{"inputs":{"unet_name":"one.safetensors"}}}',prompt_style='chroma',positive_node_id='4',negative_node_id='5')
        original=workflow_revision(workflow)
        workflow.json_str=' { "1": {"inputs": {"unet_name": "one.safetensors"}}} '
        self.assertEqual(workflow_revision(workflow),original)
        workflow.json_str=workflow.json_str.replace('one.safetensors','two.safetensors')
        self.assertNotEqual(workflow_revision(workflow),original)

    def test_actual_graph_signature_keeps_models_separate_and_ignores_seed_prompt_canvas(self):
        graph={'1':{'class_type':'UNETLoader','inputs':{'unet_name':'one.safetensors'}},
               '2':{'class_type':'KSampler','inputs':{'seed':42,'steps':8,'cfg':1}},
               '3':{'class_type':'CLIPTextEncode','inputs':{'text':'Navy suit'}},
               '4':{'class_type':'EmptyLatentImage','inputs':{'width':896,'height':1344}}}
        import json
        from scene_review import SceneReview
        template=SimpleNamespace(id='w',kind='image',json_str=json.dumps(graph),prompt_style='chroma',positive_node_id='3',negative_node_id='')
        class Body:
            scene_review=SceneReview(task='text-to-image',subject_count=1,sections=[],framing=['full body'])
            selected_loras=[]; selected_lora_name=''; lora_overrides={}
            def model_dump(self):return {'steps':8,'cfg':1}
        original=copy.deepcopy(graph)
        first=capture_learning_context(template,graph,Body())
        changed=copy.deepcopy(graph)
        changed['2']['inputs']['seed']=99;changed['3']['inputs']['text']='Gray coat';changed['4']['inputs']['width']=1024
        self.assertEqual(capture_learning_context(template,changed,Body()),first)
        changed['1']['inputs']['unet_name']='two.safetensors'
        second=capture_learning_context(template,changed,Body())
        self.assertNotEqual(second['graph_signature'],first['graph_signature'])
        self.assertEqual(second['models'],['two.safetensors'])
        self.assertEqual(graph,original)
        template.id='another-workflow'
        self.assertNotEqual(workflow_revision(template),first['workflow_revision'])

    def test_explicit_aspect_ratio_takes_priority_over_size_patterns(self):
        records=[example(1),example(2),example(3)]
        self.assertTrue(framing_recommendations(records,'revision','profile','2:3')['recommendations'])
        for ratio in ('1:1','16:9','custom ratio','0:0'):
            with self.subTest(ratio=ratio):
                self.assertEqual(framing_recommendations(records,'revision','profile',ratio)['recommendations'],[])
