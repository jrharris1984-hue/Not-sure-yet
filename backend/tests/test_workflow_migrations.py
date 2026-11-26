import json
import ast
import copy
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock

from workflow_migrations import DIRTY_MOSS_V2_NAME, migrate_legacy_dirty_moss_sampling_graph


class DirtyMossMigrationTests(unittest.TestCase):
    def legacy_workflow(self):
        return {"name": DIRTY_MOSS_V2_NAME, "id": "dirty-moss", "json_str": json.dumps({
            "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Dirty-MossV2.safetensors"}},
            "4": {"class_type": "CLIPTextEncode", "inputs": {"text": "portrait"}},
            "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "steps": 25}},
            "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0]}},
        })}

    def test_adds_creator_shift_node_and_preserves_other_graph_fields(self):
        old = self.legacy_workflow()
        migrated = json.loads(migrate_legacy_dirty_moss_sampling_graph(old))
        self.assertEqual(migrated["9"]["class_type"], "ModelSamplingSD3")
        self.assertEqual(migrated["9"]["inputs"], {"shift": 5, "model": ["1", 0]})
        self.assertEqual(migrated["7"]["inputs"], {"model": ["9", 0], "steps": 25})
        self.assertEqual(migrated["4"], json.loads(old["json_str"])["4"])
        self.assertEqual(migrated["8"], json.loads(old["json_str"])["8"])

    def test_does_not_modify_other_workflows_or_custom_graphs(self):
        other = self.legacy_workflow()
        other["name"] = "My custom graph"
        self.assertIsNone(migrate_legacy_dirty_moss_sampling_graph(other))
        custom = self.legacy_workflow()
        graph = json.loads(custom["json_str"])
        graph["10"] = {"class_type": "OtherNode", "inputs": {"model": ["1", 0]}}
        custom["json_str"] = json.dumps(graph)
        self.assertIsNone(migrate_legacy_dirty_moss_sampling_graph(custom))

    def test_migration_is_idempotent_and_only_matches_exact_checkpoint(self):
        old = self.legacy_workflow()
        old["json_str"] = migrate_legacy_dirty_moss_sampling_graph(old)
        self.assertIsNone(migrate_legacy_dirty_moss_sampling_graph(old))
        wrong_checkpoint = self.legacy_workflow()
        graph = json.loads(wrong_checkpoint["json_str"])
        graph["1"]["inputs"]["unet_name"] = "another-model.safetensors"
        wrong_checkpoint["json_str"] = json.dumps(graph)
        self.assertIsNone(migrate_legacy_dirty_moss_sampling_graph(wrong_checkpoint))


class DirtyMossSettingsUpgradeTests(unittest.IsolatedAsyncioTestCase):
    async def test_settings_persists_shift_upgrade_once(self):
        root = Path(__file__).resolve().parents[1]
        tree = ast.parse((root / "server.py").read_text(encoding="utf-8"))
        function = next(node for node in tree.body
                        if isinstance(node, ast.AsyncFunctionDef) and node.name == "get_settings")
        workflow = DirtyMossMigrationTests().legacy_workflow()
        document = {
            "id": "singleton", "workflows": [workflow], "wardrobe_catalog_version": 2,
            "character_vibe_version": 1, "ollama_text_model": "",
        }
        updates = []

        async def update_one(query, patch):
            updates.append((copy.deepcopy(query), copy.deepcopy(patch)))
            if "workflows.$.json_str" in patch.get("$set", {}):
                selector = query["workflows"]["$elemMatch"]
                for saved in document["workflows"]:
                    if saved.get("id") == selector.get("id") and saved.get("json_str") == selector.get("json_str"):
                        saved["json_str"] = patch["$set"]["workflows.$.json_str"]

        settings = SimpleNamespace(
            find_one=AsyncMock(side_effect=lambda *args: copy.deepcopy(document)),
            update_one=AsyncMock(side_effect=update_one),
        )
        namespace = {
            "db": SimpleNamespace(settings=settings), "Settings": lambda **values: values,
            "_load_seed_workflows": lambda: [],
            "migrate_legacy_dirty_moss_sampling_graph": migrate_legacy_dirty_moss_sampling_graph,
            "now_iso": lambda: "2026-11-26T00:00:00Z",
        }
        exec(compile(ast.Module(body=[function], type_ignores=[]), "settings_handler", "exec"), namespace)

        await namespace["get_settings"]()
        migrated_graph = json.loads(document["workflows"][0]["json_str"])
        self.assertEqual(migrated_graph["7"]["inputs"]["model"], ["9", 0])
        self.assertEqual(migrated_graph["9"]["inputs"]["shift"], 5)
        self.assertEqual(len(updates), 1)
        await namespace["get_settings"]()
        self.assertEqual(len(updates), 1)


if __name__ == "__main__":
    unittest.main()
