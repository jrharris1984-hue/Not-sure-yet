"""Offline regression checks against the bundled ComfyUI graphs."""
import copy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from generation_settings import apply_generation_settings, normalize_generation_settings

SEEDS = Path(__file__).resolve().parents[1] / "seed_workflows"


class GenerationSettingsTests(unittest.TestCase):
    def workflow(self, name):
        return json.loads((SEEDS / name).read_text())

    def test_zimage_creation_does_not_overwrite_face_repair(self):
        graph = self.workflow("zimage.json")
        detailer = copy.deepcopy(graph["101"])
        settings = normalize_generation_settings(dict(steps=12, cfg=1, width=1025,
                                                      height=1537, batch_size=1))
        effective = apply_generation_settings(graph, settings)
        self.assertEqual(graph["57:3"]["inputs"]["steps"], 12)
        self.assertEqual(graph["57:13"]["inputs"]["height"], 1536)
        self.assertEqual(graph["101"], detailer)
        self.assertNotIn("101", effective)

    def test_chroma_split_sampler_updates_beta_steps_and_cfg(self):
        graph = self.workflow("chroma.json")
        apply_generation_settings(graph, dict(steps=34, cfg=4.0, sampler_name="euler"))
        self.assertEqual(graph["751"]["inputs"]["steps"], 34)
        self.assertEqual(graph["751"]["inputs"]["alpha"], 0.45)
        self.assertEqual(graph["694"]["inputs"]["cfg"], 4.0)

    def test_sdxl_scheduler_follows_recipe(self):
        graph = self.workflow("sdxl.json")
        # Reproduce a saved graph that carried a different scheduler.
        sampler = next(n for n in graph.values() if n.get("class_type") == "KSampler")
        sampler["inputs"]["scheduler"] = "simple"
        apply_generation_settings(graph, dict(scheduler="karras", steps=35))
        self.assertEqual(sampler["inputs"]["scheduler"], "karras")

    def test_distilled_settings_replace_stale_recipe_values(self):
        for style, name, steps in (("krea2", "krea2_turbo.json", 8),
                                   ("flux2_klein", "flux2_klein_4b.json", 4)):
            with self.subTest(style=style):
                values = normalize_generation_settings(dict(steps=40, cfg=7,
                    sampler_name="dpmpp_2m", scheduler="karras"), style)
                graph = self.workflow(name)
                effective = apply_generation_settings(graph, values)
                self.assertEqual(values["steps"], steps)
                self.assertEqual(values["cfg"], 1)
                self.assertEqual(values.get("scheduler"), "simple" if style == "krea2" else None)
                self.assertTrue(any(n.get("steps") == steps for n in effective.values()))

    def test_linked_inputs_and_unrelated_nodes_are_preserved(self):
        graph = {
            "sampler": {"class_type": "KSampler", "inputs": {"steps": ["steps", 0], "cfg": 4}},
            "resize": {"class_type": "ImageScale", "inputs": {"width": 640, "height": 480}},
            "custom": {"class_type": "CustomRepair", "inputs": {"steps": 6}},
        }
        apply_generation_settings(graph, dict(steps=30, cfg=5, width=1024, height=1536))
        self.assertEqual(graph["sampler"]["inputs"]["steps"], ["steps", 0])
        self.assertEqual(graph["sampler"]["inputs"]["cfg"], 5)
        self.assertEqual(graph["resize"]["inputs"]["width"], 640)
        self.assertEqual(graph["custom"]["inputs"]["steps"], 6)

    def test_saved_settings_use_clamped_values(self):
        values = normalize_generation_settings(dict(width=4096, height=257, cfg=100,
                                                    steps=200, batch_size=10))
        self.assertEqual(values, dict(width=2048, height=256, cfg=30.0, steps=100, batch_size=8))
        with self.assertRaises(ValueError):
            normalize_generation_settings({"cfg": float("nan")})


if __name__ == "__main__":
    unittest.main()
