import sys
import unittest
from copy import deepcopy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from learning_comparisons import comparison_recipe, pair_error, comparison_summary, supported_canvas


def pair():
    expected={'version':1,'workflow_revision':'revision','profile':'profile','graph_signature':'graph'}
    a={'id':'a','status':'done','output_files':['a.png'],'workflow_type':'image','seed_used':42,
       'prompt_positive':'A clothed studio portrait','prompt_negative':'blur','learning_context':expected,
       'generation_settings':{'width':1024,'height':1024},'render_recipe':{'batch_size':1,'seed':42,
       'width':1024,'height':1024,'prompt_positive':'A clothed studio portrait','steps':26,'cfg':4,'scene_review':{}}}
    b={**deepcopy(a),'id':'b','output_files':['b.png'],'parent_render_id':'a','learning_comparison_id':'pair',
       'generation_settings':{'width':896,'height':1344}}
    comparison={'id':'pair','source_render_id':'a','result_render_id':'b','expected':expected,
       'seed':42,'prompt_positive':a['prompt_positive'],'prompt_negative':'blur',
       'baseline':a['generation_settings'],'target':b['generation_settings'], 'recommendation_id':'recommendation',
       'assessment':{'preference':'B','updated_at':'2026-10-16T04:00:00Z'}}
    return comparison,a,b


class LearningComparisonTests(unittest.TestCase):
    def test_recipe_changes_dimensions_and_provenance_only(self):
        comparison,a,b=pair();before=deepcopy(a)
        recipe=comparison_recipe(a,896,1344,'pair')
        self.assertEqual(recipe['seed'],42)
        self.assertEqual(recipe['steps'],26)
        self.assertEqual(recipe['prompt_positive'],a['render_recipe']['prompt_positive'])
        self.assertEqual((recipe['width'],recipe['height']),(896,1344))
        self.assertEqual(recipe['learning_comparison_id'],'pair')
        self.assertEqual(a,before)
    def test_rejects_identical_size_unknown_seed_and_multi_output_sources(self):
        comparison,a,b=pair()
        with self.assertRaises(ValueError):comparison_recipe(a,1024,1024,'pair')
        for changes in ({'seed_used':None},{'status':'running'},{'output_files':['a.png','another.png']},{'learning_context':{}},
                        {'render_recipe':{**a['render_recipe'],'reference_image':'input.png'}}):
            with self.subTest(changes=changes),self.assertRaises(ValueError):comparison_recipe({**a,**changes},896,1344,'pair')
    def test_selected_camera_aspect_ratio_is_preserved(self):
        comparison,a,b=pair();a['render_recipe']['scene_review']={'aspect_ratio':'1:1'}
        with self.assertRaises(ValueError):comparison_recipe(a,896,1344,'pair')
        self.assertEqual(comparison_recipe(a,896,896,'pair')['height'],896)
    def test_only_completed_pairs_with_matching_actual_metadata_can_be_assessed(self):
        comparison,a,b=pair();self.assertIsNone(pair_error(comparison,a,b))
        for changes in ({'seed_used':99},{'prompt_positive':'Different prompt'},{'prompt_negative':'changed'},
                        {'parent_render_id':'other'},{'status':'running'}, {'learning_context':{**b['learning_context'],'graph_signature':'other'}},
                        {'generation_settings':{'width':1024,'height':1024}}):
            with self.subTest(changes=changes):self.assertIsNotNone(pair_error(comparison,a,{**b,**changes}))
        self.assertIsNotNone(pair_error(comparison,None,b))
    def test_repeated_pairs_count_once_and_preferences_are_not_absolute_ratings(self):
        comparison,a,b=pair();second={**comparison,'id':'pair2','assessment':{'preference':'tie','updated_at':'2026-10-16T04:01:00Z'},'result_render_id':'b2'}
        b2={**b,'id':'b2','learning_comparison_id':'pair2'}
        counts=comparison_summary([comparison,second],{'a':a,'b':b,'b2':b2})
        self.assertEqual(counts['recommendation'],{'A':0,'B':0,'tie':1,'neither':0,'total':1})
        self.assertNotIn('scene_feedback',a);self.assertNotIn('scene_feedback',b)
        self.assertEqual(comparison_summary([comparison],{'a':a}),{})

    def test_original_and_enhanced_variants_are_one_logical_image(self):
        comparison,a,b=pair()
        for record,label in ((a,'a'),(b,'b')):
            record['output_files']=[f'{label}-enhanced.png',f'{label}-original.png']
            record['output_variants']={'original':[f'{label}-original.png'],'enhanced':[f'{label}-enhanced.png']}
        comparison['output_kind']='original'
        self.assertEqual(comparison_recipe(a,896,1344,'pair')['width'],896)
        self.assertIsNone(pair_error(comparison,a,b))
        b['output_variants'].pop('original')
        self.assertIsNotNone(pair_error(comparison,a,b))

    def test_canvas_size_must_have_been_applied_to_a_supported_latent_node(self):
        graph={'1':{'class_type':'EmptySD3LatentImage'},'2':{'class_type':'UnknownResize'}}
        size={'width':896,'height':1344}
        self.assertTrue(supported_canvas(graph,{'1':size},size))
        self.assertFalse(supported_canvas(graph,{'2':size},size))
        self.assertFalse(supported_canvas(graph,{'1':{'width':1024,'height':1024}},size))
