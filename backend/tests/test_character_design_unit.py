"""Offline tests for structured clothed studies and the actual queue normalizer."""
import ast
import asyncio
import json
import random
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, patch
from pydantic import BaseModel, Field, ValidationError

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from character_design import CharacterDesignRequest, design_prompts, design_workflow, SHAPE_REFERENCES, FABRIC_REFERENCES, WORKFLOW_ID, WORKFLOW_NAME


def queue_namespace():
    # Exercise server definitions without starting MongoDB or the HTTP server.
    tree = ast.parse((BACKEND / "server.py").read_text())
    names = {"DispatchBody", "_design_dispatch_body", "_enqueue_render"}
    selected = ast.Module(body=[node for node in tree.body if getattr(node, "name", "") in names], type_ignores=[])
    ns = dict(BaseModel=BaseModel, Field=Field, Optional=Optional, Any=Any, Dict=Dict, List=List,
              CharacterDesignRequest=CharacterDesignRequest, design_prompts=design_prompts,
              DESIGN_WORKFLOW_ID=WORKFLOW_ID, DESIGN_WORKFLOW_NAME=WORKFLOW_NAME, random=random,
              get_settings=AsyncMock(return_value=SimpleNamespace(workflows=[])),
              now_iso=lambda: "2026-10-04T01:00:00Z", new_id=lambda: "queue-1",
              db=SimpleNamespace(render_queue=SimpleNamespace(insert_one=AsyncMock())),
              _queue_view=AsyncMock(side_effect=lambda job: job), HTTPException=ValueError)
    exec(compile(selected, str(BACKEND / "server.py"), "exec"), ns)
    return ns


class CharacterDesignTests(unittest.TestCase):
    def test_size_shape_and_texture_affect_the_clothed_prompt(self):
        base = design_prompts(CharacterDesignRequest())["positive"]
        for size in [25, 75, 125, 175, 225, 275]:
            self.assertNotEqual(base, design_prompts(CharacterDesignRequest(size=size))["positive"])
        self.assertEqual(len({design_prompts(CharacterDesignRequest(size=size))["positive"] for size in [25, 75, 125, 175, 225, 275]}), 6)
        for shape in SHAPE_REFERENCES:
            self.assertIn(SHAPE_REFERENCES[shape], design_prompts(CharacterDesignRequest(shape=shape))["positive"])
        for texture in FABRIC_REFERENCES:
            self.assertIn(FABRIC_REFERENCES[texture], design_prompts(CharacterDesignRequest(texture=texture))["positive"])

    def test_all_catalog_choices_keep_the_opaque_outfit_and_neutral_pose(self):
        for shape in SHAPE_REFERENCES:
            prompts = design_prompts(CharacterDesignRequest(size=300, shape=shape))
            self.assertIn("opaque denim jeans", prompts["positive"])
            self.assertIn("standing upright", prompts["positive"])
            self.assertIn("Photorealistic", prompts["positive"])
            self.assertIn("nudity", prompts["negative"])

    def test_rejects_unknown_tags_free_prompts_and_invalid_ranges(self):
        for payload in [{"shape": "arbitrary instructions"}, {"texture": "arbitrary instructions"},
                        {"prompt_positive": "arbitrary instructions"}, {"size": 301}, {"age": 17}, {"seed": -1}]:
            with self.assertRaises(ValidationError):
                CharacterDesignRequest(**payload)

    def test_frontend_and_backend_catalogs_match(self):
        # The source file exposes the catalogs through Object.keys; parse object keys only.
        source = (BACKEND.parent / "frontend/src/lib/gluteControls.js").read_text()
        import re
        shapes = source.split("const SHAPES = {", 1)[1].split("};", 1)[0]
        textures = source.split("const TEXTURE_MODIFIERS = {", 1)[1].split("};", 1)[0]
        self.assertEqual(set(re.findall(r'^\s*"([^"]+)":', shapes, re.M)), set(SHAPE_REFERENCES))
        self.assertEqual(set(re.findall(r'^\s*"([^"]+)":', textures, re.M)), set(FABRIC_REFERENCES))

    def test_plain_graph_has_no_loras_or_image_inputs(self):
        graph = design_workflow(BACKEND / "seed_workflows")
        self.assertFalse(any("lora" in node["class_type"].lower() or node["class_type"] == "LoadImage" for node in graph.values()))
        self.assertEqual(graph["7"]["inputs"]["filename_prefix"], "UltraStudio_ClothedCharacterDesign")
        with patch.dict("os.environ", {"CHARACTER_DESIGN_CHECKPOINT": "my-sdxl.safetensors"}):
            self.assertEqual(design_workflow(BACKEND / "seed_workflows")["1"]["inputs"]["ckpt_name"], "my-sdxl.safetensors")

    def test_queue_discards_other_prompt_and_reference_settings(self):
        ns = queue_namespace()
        body = ns["DispatchBody"](character_design=CharacterDesignRequest(size=125, seed=123),
                                  workflow_id="custom", prompt_positive="unrelated instructions", reference_image="other.png",
                                  selected_loras=[{"name": "other.safetensors"}], lora_overrides={"1": {"name": "other"}})
        job = asyncio.run(ns["_enqueue_render"](body))
        payload = job["payload"]
        self.assertEqual(payload["workflow_id"], WORKFLOW_ID)
        self.assertEqual(payload["operation"], "character_design")
        self.assertNotIn("unrelated", payload["prompt_positive"])
        self.assertIsNone(payload["reference_image"])
        self.assertEqual(payload["selected_loras"], [])
        self.assertEqual(payload["lora_overrides"], {})
        self.assertEqual(job["workflow_name"], WORKFLOW_NAME)
        ns["db"].render_queue.insert_one.assert_awaited_once()

    def test_seed_is_saved_and_explicit_seed_override_is_preserved(self):
        ns = queue_namespace()
        first = ns["_design_dispatch_body"](CharacterDesignRequest())
        self.assertEqual(first.seed, first.character_design.seed)
        second = ns["_design_dispatch_body"](first.character_design)
        self.assertEqual(first.seed, second.seed)
        changed = ns["_design_dispatch_body"](first.character_design, 4321)
        self.assertEqual(changed.seed, 4321)
        self.assertEqual(changed.character_design.seed, 4321)


if __name__ == "__main__":
    unittest.main()
