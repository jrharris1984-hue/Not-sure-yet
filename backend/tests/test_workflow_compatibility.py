import unittest

from workflow_compatibility import validate_workflow_graph


SCHEMA = {
    "CheckpointLoaderSimple": {
        "input": {"required": {"ckpt_name": [["model.safetensors"]]}},
        "output": ["MODEL", "CLIP", "VAE"],
    },
    "KSampler": {
        "input": {"required": {
            "model": ["MODEL"], "seed": ["INT"],
            "steps": ["INT"], "cfg": ["FLOAT"],
        }},
        "output": ["LATENT"],
    },
    "VAEDecode": {
        "input": {"required": {"samples": ["LATENT"], "vae": ["VAE"]}},
        "output": ["IMAGE"],
    },
}


class WorkflowCompatibilityTests(unittest.TestCase):
    def test_valid_graph_passes_with_known_links(self):
        graph = {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "model.safetensors"}},
            "2": {"class_type": "KSampler", "inputs": {
                "model": ["1", 0], "seed": 1, "steps": 20, "cfg": 7,
            }},
            "3": {"class_type": "VAEDecode", "inputs": {"samples": ["2", 0], "vae": ["1", 2]}},
        }
        result = validate_workflow_graph(graph, SCHEMA)
        self.assertTrue(result["compatible"])
        self.assertEqual(result["checked_nodes"], 3)
        self.assertEqual(result["issues"], [])

    def test_reports_missing_custom_node_and_schema_inputs(self):
        graph = {
            "8": {"class_type": "MissingCustomNode", "inputs": {}},
            "9": {"class_type": "KSampler", "inputs": {"model": ["8", 0], "seed": 3, "surprise": True}},
        }
        result = validate_workflow_graph(graph, SCHEMA)
        codes = {issue["code"] for issue in result["issues"]}
        self.assertFalse(result["compatible"])
        self.assertTrue({"missing_node_type", "unknown_input", "missing_required_input"}.issubset(codes))

    def test_reports_missing_sources_outputs_and_incompatible_socket_types(self):
        graph = {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "model.safetensors"}},
            "2": {"class_type": "VAEDecode", "inputs": {"samples": ["1", 1], "vae": ["404", 0]}},
        }
        result = validate_workflow_graph(graph, SCHEMA)
        codes = {issue["code"] for issue in result["issues"]}
        self.assertIn("link_type_mismatch", codes)
        self.assertIn("missing_link_source", codes)

    def test_rejects_empty_graph_or_unavailable_schema(self):
        self.assertEqual(validate_workflow_graph({}, SCHEMA)["issues"][0]["code"], "invalid_graph")
        self.assertEqual(validate_workflow_graph({"1": {}}, {})["issues"][0]["code"], "schema_unavailable")


if __name__ == "__main__":
    unittest.main()
