import unittest
import ast
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from typing import List
from shoot_continuity import shoot_render_settings, shoot_base_dna


class ShootContinuityTests(unittest.IsolatedAsyncioTestCase):
    def test_settings_keep_sampling_and_selected_lora_without_overriding_frames(self):
        recipe = {"width": 768, "cfg": 1, "steps": 4, "selected_loras": [{"name": "identity", "triggers": ["person"]}],
                  "seed": 42, "dna": {"identity": {"age": 72}}, "subjects": [], "reference_image": "old.png", "shoot_id": "old"}
        result = shoot_render_settings(recipe)
        self.assertEqual(set(result), {"width", "cfg", "steps", "selected_loras"})
        self.assertEqual(result["selected_loras"], recipe["selected_loras"])

    def test_shared_set_keeps_identity_and_does_not_mutate_saved_character(self):
        dna = {"identity": {"age": 72}, "face": {"eyes": "brown"}, "scene": {"environment": "studio"}, "lighting": {"source": "window"}}
        result = shoot_base_dna(dna, {"scene": {"environment": "beach"}, "lighting": {"source": "softbox"}, "camera": {"lens": "85mm"}})
        self.assertEqual(result["identity"], {"age": 72})
        self.assertEqual(result["face"], dna["face"])
        self.assertEqual(result["scene"]["environment"], "beach")
        self.assertEqual(dna["scene"]["environment"], "studio")
        self.assertEqual(result["camera"]["lens"], "85mm")

    def function(self, name, namespace):
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == name)
        node.decorator_list = []
        exec(compile(ast.Module(body=[node], type_ignores=[]), name, "exec"), namespace)
        return namespace[name]

    async def test_context_prefers_selected_photo_and_its_recipe(self):
        db = SimpleNamespace(characters=SimpleNamespace(find_one=AsyncMock(return_value={"default_image_render_id": "chosen"})),
                             renders=SimpleNamespace(find_one=AsyncMock(return_value={"id": "chosen", "output_files": ["photo.png"]})))
        recipe = {"workflow_id": "qwen", "seed": 42, "selected_loras": [{"name": "identity"}]}
        read_recipe = AsyncMock(return_value=({}, recipe))
        context = self.function("character_shoot_context", {"db": db, "_render_recipe": read_recipe})
        result = await context("c")
        self.assertEqual(result["render_id"], "chosen")
        self.assertEqual(result["recipe"], recipe)
        self.assertEqual(db.renders.find_one.call_args.args[0]["character_id"], "c")
        self.assertEqual(db.renders.find_one.call_args.args[0]["id"], "chosen")

    async def test_create_uploads_reference_once_and_persists_instructions_for_queue(self):
        class Model:
            def __init__(self, **kwargs): self.__dict__.update(kwargs); self.id = "shoot"
            def model_dump(self): return self.__dict__
        db = SimpleNamespace(characters=SimpleNamespace(find_one=AsyncMock(return_value={"name": "Character"})),
                             renders=SimpleNamespace(find_one=AsyncMock(return_value={"output_files": ["photo.png"]})),
                             shoots=SimpleNamespace(insert_one=AsyncMock()))
        prepare = AsyncMock(return_value={"name": "input-photo.png"})
        body = SimpleNamespace(count=2, frames=[{"edit_instruction": "Keep same face; stand"}, {"edit_instruction": "Keep same face; sit"}],
            character_id="c", source_render_id="photo", workflow_id="edit", dispatch_settings={"steps":4,"selected_lora_name":"old"},
            set_overrides={"scene":{"environment":"studio"}}, base_seed=42, seed_mode="same", name="Shoot", lora_overrides={},
            pose_mode="pack", pose_pack="editorial", lock_scenario=True)
        create = self.function("create_shoot", {"ShootCreateBody": object, "BackgroundTasks": object, "db": db,
            "get_settings": AsyncMock(return_value=SimpleNamespace(workflows=[SimpleNamespace(id="edit",kind="edit",edit_variant=None)])),
            "prepare_render_reference":prepare,"shoot_render_settings":shoot_render_settings,"DispatchBody":lambda **kw:kw,
            "List":List,"ShootFrame":Model,"Shoot":Model,"_run_shoot_background":AsyncMock(),"get_shoot":AsyncMock(return_value={"id":"shoot"})})
        await create(body, None)
        prepare.assert_awaited_once_with("photo", None)
        saved = db.shoots.insert_one.call_args.args[0]
        self.assertEqual(saved["reference_image"], "input-photo.png")
        self.assertEqual(saved["dispatch_settings"], {})
        self.assertEqual([frame.seed for frame in saved["frames"]], [42, 42])
        self.assertEqual(saved["frames"][1].edit_instruction, "Keep same face; sit")
