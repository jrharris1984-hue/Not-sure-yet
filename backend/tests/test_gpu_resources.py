import unittest

from gpu_resources import should_defer_dispatch, summarize_comfy_resources


class GpuResourceSummaryTests(unittest.TestCase):
    def test_normalizes_memory_and_reports_pressure_bands(self):
        result = summarize_comfy_resources({"devices": [
            {"name": "GPU A", "type": "cuda", "index": 0,
             "vram_total": 10_000, "vram_free": 5_000},
            {"name": "GPU B", "type": "cuda", "index": 1,
             "vram_total": 10_000, "vram_free": 2_000},
            {"name": "GPU C", "type": "cuda", "index": 2,
             "vram_total": 10_000, "vram_free": 1_000},
        ]})
        self.assertEqual([d["pressure"] for d in result["devices"]], ["normal", "elevated", "high"])
        self.assertEqual(result["devices"][0]["vram_used"], 5_000)
        self.assertEqual(result["devices"][0]["vram_used_percent"], 50.0)

    def test_unknown_memory_is_not_reported_as_zero_free(self):
        result = summarize_comfy_resources({"devices": [{"name": "CPU"}]})
        self.assertIsNone(result["devices"][0]["vram_free"])
        self.assertEqual(result["devices"][0]["pressure"], "unknown")

    def test_safely_ignores_malformed_device_entries_and_caps_free_memory(self):
        result = summarize_comfy_resources({"devices": [None, "bad", {
            "type": "cuda", "vram_total": 100, "vram_free": 200,
        }]})
        self.assertEqual(len(result["devices"]), 1)
        self.assertEqual(result["devices"][0]["vram_free"], 100)
        self.assertEqual(result["devices"][0]["vram_used_percent"], 0.0)

    def test_dispatch_wait_is_opt_in_conservative_and_user_overrideable(self):
        resources = {"devices": [
            {"type": "cuda", "pressure": "high"},
            {"type": "cuda", "pressure": "high"},
        ]}
        self.assertFalse(should_defer_dispatch(resources, False))
        self.assertTrue(should_defer_dispatch(resources, True))
        self.assertFalse(should_defer_dispatch(resources, True, override=True))
        self.assertFalse(should_defer_dispatch({"devices": [*resources["devices"], {"type": "cuda", "pressure": "normal"}]}, True))
        self.assertFalse(should_defer_dispatch({"devices": [*resources["devices"], {"type": "cuda", "pressure": "unknown"}]}, True))
        self.assertFalse(should_defer_dispatch({"devices": [{"type": "cpu", "pressure": "high"}]}, True))


if __name__ == "__main__":
    unittest.main()
