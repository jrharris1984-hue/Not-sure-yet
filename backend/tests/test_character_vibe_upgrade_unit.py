import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from character_vibe_upgrade import upgrade_character_vibes

class CharacterVibeTests(unittest.TestCase):
    def test_additive_rename_preserves_authored_words(self):
        custom = {'value':'romantic muse','label':'My muse','keywords':'my exact text','group':'Mine'}
        source = {'sections':[{'key':'identity','fields':[{'key':'archetype','label':'Archetype (character theme)','options':[custom]}]}]}
        result = upgrade_character_vibes(source)
        field = result['sections'][0]['fields'][0]
        self.assertEqual(field['label'], 'Character vibe (optional)')
        self.assertEqual(field['options'][0], custom)
        self.assertEqual(len(field['options']), 8)
        self.assertEqual(len(source['sections'][0]['fields'][0]['options']), 1)
        self.assertEqual(upgrade_character_vibes(result), result)
    def test_custom_labels_and_removed_fields_survive(self):
        source = {'sections':[{'key':'identity','fields':[{'key':'archetype','label':'My theme','options':[]}]}]}
        self.assertEqual(upgrade_character_vibes(source)['sections'][0]['fields'][0]['label'],'My theme')
        empty = {'sections':[{'key':'identity','fields':[]}]}
        self.assertEqual(upgrade_character_vibes(empty), empty)
    def test_frontend_backend_options_match(self):
        root = Path(__file__).resolve().parents[2]
        self.assertEqual(json.loads((root/'backend/character_vibe_options.json').read_text()),json.loads((root/'frontend/src/lib/characterVibeOptions.json').read_text()))

class CharacterVibeSettingsTests(unittest.IsolatedAsyncioTestCase):
    async def test_settings_upgrade_runs_once_and_retains_later_deletions(self):
        import ast
        from types import SimpleNamespace
        from unittest.mock import AsyncMock
        tree = ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        node = next(item for item in tree.body if isinstance(item, ast.AsyncFunctionDef) and item.name == 'get_settings')
        doc = {'id':'singleton','wardrobe_catalog_version':2,'prompt_catalog':{'sections':[{'key':'identity','fields':[{'key':'archetype','label':'Archetype','options':[]}]}]}}
        async def update(query, patch):
            doc.update(patch['$set'])
        settings = SimpleNamespace(find_one=AsyncMock(side_effect=lambda *args: dict(doc)), update_one=AsyncMock(side_effect=update))
        namespace = {'db':SimpleNamespace(settings=settings),'Settings':lambda **kwargs:kwargs,'upgrade_character_vibes':upgrade_character_vibes}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'settings_handler','exec'), namespace)
        result = await namespace['get_settings']()
        self.assertEqual(result['character_vibe_version'],1)
        self.assertEqual(len(result['prompt_catalog']['sections'][0]['fields'][0]['options']),8)
        doc['prompt_catalog']['sections'][0]['fields'][0]['options'] = []
        result = await namespace['get_settings']()
        self.assertEqual(result['prompt_catalog']['sections'][0]['fields'][0]['options'],[])
        self.assertEqual(settings.update_one.await_count,1)
