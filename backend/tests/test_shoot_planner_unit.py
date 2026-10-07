import ast
import json
import sys
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shoot_planner import apply_shot_controls, validate_shot_plan

CATALOG = {"pose_action": ["walking", "seated"], "framing": ["full body"],
           "environment": ["beach"], "lighting_temperature": ["warm"]}

class PlannerTests(unittest.TestCase):
    def test_shot_schema_serializes_reviewed_label_and_camera(self):
        from pydantic import BaseModel, ConfigDict, Field
        from typing import Any, Dict, Optional
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
        node = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == 'ShootFrame')
        namespace = {"BaseModel": BaseModel, "ConfigDict": ConfigDict, "Field": Field,
                     "Any": Any, "Dict": Dict, "Optional": Optional}
        exec(compile(ast.Module(body=[node], type_ignores=[]), 'ShootFrame', 'exec'), namespace)
        data = namespace['ShootFrame'](index=0, shot_label='Standing · Side',
                                      camera_overrides={"angle": "low"}).model_dump()
        self.assertEqual(data['shot_label'], 'Standing · Side')
        self.assertEqual(data['camera_overrides'], {"angle": "low"})

    def test_camera_and_pose_overrides_keep_reviewed_views_and_clear_saved_conflicts(self):
        dna = {"identity": {"age": 72}, "camera": {"angle": "high", "lens": "50mm"},
               "pose": {"angle": "front", "focus": "face", "hands": "on hips"},
               "scene": {"environment": "studio"}}
        frame = {"camera_overrides": {"angle": "low", "unexpected": "ignored"},
                 "pose_overrides": {"angle": "back", "focus": "full frame", "hands": "", "body_language": "relaxed"}}
        out = apply_shot_controls(dna, frame, True)
        self.assertEqual(out["camera"], {"angle": "low", "lens": "50mm"})
        self.assertEqual(out["pose"]["angle"], "back")
        self.assertEqual(out["pose"]["hands"], "")
        self.assertEqual(out["pose"]["focus"], "full frame")
        self.assertEqual(out["scene"], dna["scene"])
        self.assertEqual(out["identity"], dna["identity"])
        self.assertEqual(dna["pose"]["hands"], "on hips")

    def test_catalog_validation_and_locked_location(self):
        plan = validate_shot_plan({"frames": [{"pose_action": "walking", "environment": "beach",
                                               "identity": {"age": 20}}]}, 1, CATALOG, True)
        self.assertEqual(plan["frames"][0]["environment"], "")
        self.assertNotIn("identity", plan["frames"][0])
        self.assertTrue(plan["warnings"])
        with self.assertRaises(ValueError):
            validate_shot_plan({"frames": [{"pose_action": "invented"}]}, 1, CATALOG, True)
        with self.assertRaises(ValueError):
            validate_shot_plan({"frames": []}, 1, CATALOG, True)

    def test_repeated_shots_are_flagged(self):
        plan = validate_shot_plan({"frames": [{"pose_action": "walking"}] * 2}, 2, CATALOG, True)
        self.assertIn("identical", plan["warnings"][0])

    def test_applied_controls_copy_preserve_identity_and_location(self):
        dna = {"identity": {"age": 35}, "scene": {"environment": "studio"}, "pose": {"distance": "portrait"}}
        frame = {"pose_overrides": {"distance": "full body", "identity": "wrong"},
                 "scene_overrides": {"environment": "beach"}, "lighting_overrides": {"color_temp": "warm"}}
        out = apply_shot_controls(dna, frame, True)
        self.assertEqual(out["scene"]["environment"], "studio")
        self.assertEqual(out["pose"]["distance"], "full body")
        self.assertEqual(out["identity"], dna["identity"])
        self.assertNotIn("identity", out["pose"])
        self.assertEqual(dna["pose"]["distance"], "portrait")
        self.assertEqual(apply_shot_controls(dna, frame, False)["scene"]["environment"], "beach")

class PlannerRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_configured_assistant_batches_and_preserves_revision_fields(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
        function = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'ai_shoot_plan')
        function.decorator_list = []
        function.args.args[0].annotation = None
        chat = AsyncMock(side_effect=[json.dumps({"frames": [{"pose_action": "seated"}] * 4}),
                                    json.dumps({"frames": [{"pose_action": "walking"}]})])
        char = {"dna": {"identity": {"age": 35}}, "subjects": [{"dna": {"identity": {"age": 35}}}, {"dna": {"identity": {"age": 42}}}]}
        db = SimpleNamespace(characters=SimpleNamespace(find_one=AsyncMock(return_value=char)),
                             workflows=SimpleNamespace(find_one=AsyncMock(return_value={"name": "Chroma", "kind": "image"})))
        namespace = {"db": db, "openrouter_chat": chat, "extract_json": json.loads,
                     "validate_shot_plan": validate_shot_plan, "json": json}
        exec(compile(ast.Module(body=[function], type_ignores=[]), 'server.py', 'exec'), namespace)
        result = await namespace['ai_shoot_plan'](SimpleNamespace(character_id='c', workflow_id='w', instruction='seated shots',
            count=5, shot_numbers=[2, 4, 6, 8, 10], lock_scenario=True, catalog=CATALOG, current_frames=[{"framing": "full body"}] * 5))
        self.assertEqual(len(result['frames']), 5)
        self.assertEqual(result['frames'][0]['framing'], 'full body')
        self.assertEqual(chat.await_count, 2)
        self.assertEqual(json.loads(chat.call_args.args[1])['shot_numbers'], [10])
        self.assertEqual(len(json.loads(chat.call_args.args[1])['subjects']), 2)
        self.assertTrue(chat.call_args.kwargs['response_format_json'])
