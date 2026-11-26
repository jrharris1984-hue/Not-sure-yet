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
        }, "optional": {"sampler_name": [["euler", "heun"], {}]}},
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
                "model": ["1", 0], "seed": 1, "steps": 20, "cfg": 7, "sampler_name": "euler",
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

    def test_reports_model_and_sampler_choices_missing_from_live_comfyui(self):
        graph = {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "old-model.safetensors"}},
            "2": {"class_type": "KSampler", "inputs": {
                "model": ["1", 0], "seed": 1, "steps": 20, "cfg": 7, "sampler_name": "old-sampler",
            }},
        }
        result = validate_workflow_graph(graph, SCHEMA)
        unavailable = [issue for issue in result["issues"] if issue["code"] == "unsupported_option"]
        self.assertEqual(len(unavailable), 2)
        self.assertTrue(any("old-model.safetensors" in issue["message"] for issue in unavailable))
        self.assertTrue(any("old-sampler" in issue["message"] for issue in unavailable))

    def test_runtime_image_placeholders_are_warnings_not_schema_failures(self):
        schema = {
            "LoadImage": {"input": {"required": {"image": [["installed.png"]]}}, "output": ["IMAGE"]},
            "ImageSink": {"input": {"required": {"image": ["IMAGE"]}}, "output": []},
        }
        graph = {
            "source": {"class_type": "LoadImage", "inputs": {"image": "uploaded-at-render-time.png"}},
            "sink": {"class_type": "ImageSink", "inputs": {"image": ["source", 0]}},
        }
        result = validate_workflow_graph(graph, schema)
        self.assertTrue(result["compatible"])
        self.assertEqual([issue["severity"] for issue in result["issues"]], ["warning"])
        self.assertEqual(result["issues"][0]["code"], "runtime_image_input")

    def test_match_type_v3_is_a_dynamic_socket_wildcard(self):
        schema = {
            "DynamicSwitch": {"input": {"required": {"value": ["COMFY_MATCHTYPE_V3"]}}, "output": ["COMFY_MATCHTYPE_V3"]},
            "KSampler": {"input": {"required": {"model": ["MODEL"]}}, "output": ["LATENT"]},
        }
        graph = {
            "switch": {"class_type": "DynamicSwitch", "inputs": {"value": ["sampler", 0]}},
            "sampler": {"class_type": "KSampler", "inputs": {"model": ["switch", 0]}},
        }
        result = validate_workflow_graph(graph, schema)
        self.assertTrue(result["compatible"])
        self.assertEqual(result["issues"], [])

    def test_accepts_comfy_path_case_and_separator_normalization(self):
        schema = {"LoraLoader": {"input": {"required": {"lora_name": [["MOSS/Portrait.safetensors"]]}}, "output": []}}
        graph = {"1": {"class_type": "LoraLoader", "inputs": {"lora_name": "moss\\portrait.safetensors"}}}
        result = validate_workflow_graph(graph, schema)
        self.assertTrue(result["compatible"])
        self.assertEqual(result["issues"], [])


if __name__ == "__main__":
    unittest.main()
