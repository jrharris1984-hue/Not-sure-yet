import unittest

from workflow_capabilities import analyze_workflow_capabilities, rated_recipe_examples


class WorkflowCapabilityTests(unittest.TestCase):
    def test_detect_reference_text_video_and_lora_inputs(self):
        graph = {
            "1": {"class_type": "LoadImage", "inputs": {"image": "reference.png"}},
            "2": {"class_type": "CLIPTextEncode", "inputs": {"text": "portrait"}},
            "3": {"class_type": "LoraLoader", "inputs": {"strength_model": 0.7}},
            "4": {"class_type": "VHS_VideoCombine", "inputs": {"frame_rate": 24}},
        }
        caps = analyze_workflow_capabilities(graph)
        self.assertTrue(caps["supports_reference_image"])
        self.assertTrue(caps["supports_reference_shoot"])
        self.assertTrue(caps["supports_text_to_image"])
        self.assertTrue(caps["supports_video"])
        self.assertTrue(caps["supports_loras"])

    def test_reject_unparseable_or_inputless_graphs(self):
        self.assertFalse(analyze_workflow_capabilities("not json")["graph_parseable"])
        caps = analyze_workflow_capabilities({"1": {"class_type": "KSampler", "inputs": {}}})
        self.assertFalse(caps["supports_reference_shoot"])
        self.assertFalse(caps["supports_text_to_image"])

    def test_rated_examples_are_bounded_and_only_use_explicit_ratings(self):
        examples = rated_recipe_examples([
            {"user_quality_rating": 5, "prompt_positive": "preferred" * 80, "workflow_name": "Test"},
            {"user_quality_rating": 1, "prompt_positive": "avoid", "user_quality_note": "too flat"},
            {"prompt_positive": "unrated"},
            {"user_quality_rating": 99, "prompt_positive": "invalid"},
        ])
        self.assertEqual(len(examples["preferred_examples"]), 1)
        self.assertEqual(len(examples["preferred_examples"][0]["prompt_excerpt"]), 320)
        self.assertEqual(examples["avoid_examples"][0]["note"], "too flat")
