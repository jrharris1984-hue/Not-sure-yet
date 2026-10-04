import copy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from image_recovery import recovery_recipe, apply_recovery_strength


class ImageRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.source = {
            "character_id": "person", "dna": {"pose": {"distance": "full body"}},
            "subjects": [{"label": "A", "dna": {"hair": {"color": "brown"}}}],
            "workflow_id": "krea", "steps": 8, "cfg": 1, "sampler_name": "euler",
            "selected_loras": [{"name": "krea-only.safetensors"}], "lora_overrides": {"99": {}},
            "shoot_id": "old-shoot", "reference_image": "stale.png", "seed": 123,
        }
        self.reference = {"name": "selected.png", "subfolder": "gallery", "source_render_id": "source-render"}

    def recipe(self, mode="small_variation", strength=0.22, targets=None, instruction="", seed=None):
        return recovery_recipe(self.source, self.reference, "recovery-workflow", mode,
                               strength, targets or [], instruction, seed)

    def test_variation_uses_selected_source_pixels_and_new_workflow(self):
        result = self.recipe(instruction="Slight smile")
        self.assertEqual(result["reference_image"], "gallery/selected.png")
        self.assertEqual(result["parent_render_id"], "source-render")
        self.assertEqual(result["reference_source_render_id"], "source-render")
        self.assertEqual(result["workflow_id"], "recovery-workflow")
        self.assertEqual(result["refine_denoise"], 0.22)
        self.assertIn("Slight smile", result["prompt_positive"])
        self.assertIsNone(result["seed"])

    def test_repair_uses_chosen_regions_and_preserves_unrequested_details(self):
        result = self.recipe("anatomy_repair", 0.35, ["hands", "hands", "feet"], "Fused fingers")
        self.assertEqual(result["repair_targets"], ["hands", "feet"])
        self.assertEqual(result["repair_strength"], 0.35)
        self.assertEqual(result["edit_instruction"], result["prompt_positive"])
        self.assertIn("Fused fingers", result["edit_instruction"])
        self.assertIn("Leave unrequested details unchanged", result["edit_instruction"])
        self.assertNotIn("refine_denoise", result)

    def test_cross_model_sampling_and_loras_do_not_leak_into_recovery(self):
        result = self.recipe()
        for key in ("steps", "cfg", "sampler_name", "selected_loras", "lora_overrides", "shoot_id"):
            self.assertNotIn(key, result)
        self.assertFalse(result["hidden_from_gallery"])

    def test_original_recipe_is_not_mutated(self):
        before = copy.deepcopy(self.source)
        result = self.recipe(seed=0)
        result["dna"]["pose"]["distance"] = "portrait"
        self.assertEqual(self.source, before)
        self.assertEqual(result["seed"], 0)

    def test_strength_reaches_the_actual_bundled_recovery_samplers(self):
        seeds = Path(__file__).resolve().parents[1] / "seed_workflows"
        for filename in ("chroma_variation.json", "qwen.json"):
            with self.subTest(workflow=filename):
                graph = json.loads((seeds / filename).read_text())
                self.assertTrue(apply_recovery_strength(graph, 0.3))
                self.assertTrue(any(n.get("inputs", {}).get("denoise") == 0.3 for n in graph.values()))

    def test_linked_or_missing_strength_control_is_not_silently_overwritten(self):
        graph = {"1": {"class_type": "KSampler", "inputs": {"denoise": ["2", 0]}}}
        self.assertFalse(apply_recovery_strength(graph, 0.3))
        self.assertEqual(graph["1"]["inputs"]["denoise"], ["2", 0])
        self.assertFalse(apply_recovery_strength({}, 0.3))

    def test_missing_source_or_invalid_repair_targets_are_rejected(self):
        with self.assertRaises(ValueError):
            self.recipe("anatomy_repair", targets=[])
        with self.assertRaises(ValueError):
            self.recipe("anatomy_repair", targets=["background"])
        self.reference["name"] = ""
        with self.assertRaises(ValueError):
            self.recipe()


if __name__ == "__main__":
    unittest.main()
