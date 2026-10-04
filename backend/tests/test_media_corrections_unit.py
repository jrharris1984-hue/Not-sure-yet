import ast
import json
import sys
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from media_corrections import normalize_values, clean_tags, overlay_item

class CorrectionTests(unittest.TestCase):
    def test_known_count_replaces_stale_people_and_conflicting_tags_without_mutation(self):
        item = {'id': 1, 'people_count': 2, 'people': [{'description': 'first'}, {'description': 'reflection'}],
                'general_tags': ['solo', 'couple']}
        overlay = {'values': {'person_count': 1, 'mirror_reflection': 'yes'}, 'confirmed_fields': ['person_count'],
                   'descriptive_tags': ['solo', 'couple', 'mirror reflection', 'favorites'], 'organization_tags': ['favorites']}
        result = overlay_item(item, overlay)
        self.assertEqual(result['person_count'], 1)
        self.assertEqual(result['people_count'], 1)
        self.assertEqual(result['people'], [])
        self.assertNotIn('couple', result['general_tags'])
        self.assertNotIn('favorites', result['general_tags'])
        self.assertEqual(len(item['people']), 2)

    def test_empty_corrections_are_authoritative_and_values_are_validated(self):
        self.assertEqual(overlay_item({'pose': 'wrong'}, {'values': {'pose': ''}})['pose'], '')
        self.assertEqual(clean_tags(['Mirror_Reflection', 'mirror reflection', ' favorites ']), ['mirror reflection', 'favorites'])
        self.assertEqual(normalize_values({'person_count': None, 'unknown': 'ignored'}), {'person_count': None})
        for values in ({'person_count': True}, {'person_count': -1}, {'people': ['invalid']}, {'mirror_reflection': 'maybe'}):
            with self.assertRaises(ValueError): normalize_values(values)

class ReanalysisTests(unittest.IsolatedAsyncioTestCase):
    async def test_two_checks_update_only_unconfirmed_fields_with_concurrency_guard(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
        fn = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'reanalyze_media_unconfirmed')
        fn.decorator_list = []; fn.args.args[0].annotation = None
        correction = {'updated_at': 'saved-version', 'values': {'person_count': 1, 'mirror_reflection': 'yes', 'pose': 'old'}, 'confirmed_fields': ['person_count', 'mirror_reflection']}
        collection = SimpleNamespace(find_one=AsyncMock(return_value=correction), update_one=AsyncMock(return_value=SimpleNamespace(matched_count=1)))
        vision = AsyncMock(return_value={'person_count': 2, 'mirror_reflection': 'no', 'pose': 'seated'})
        namespace = {'media_library_url': AsyncMock(return_value='http://source'), 'media_json_get': AsyncMock(return_value={'id': 1, 'media_type': 'image'}),
                     'media_binary_get': AsyncMock(return_value=SimpleNamespace(body=b'image')), 'get_settings': AsyncMock(return_value={}),
                     'db': SimpleNamespace(media_corrections=collection), '_ollama_vision_json': vision,
                     'normalize_values': normalize_values, 'clean_tags': clean_tags, 'now_iso': lambda: 'new-version', 'json': json}
        exec(compile(ast.Module(body=[fn], type_ignores=[]), 'server.py', 'exec'), namespace)
        await namespace[fn.name](1)
        self.assertEqual(vision.await_count, 2)
        query, update = collection.update_one.call_args.args
        self.assertEqual(query['updated_at'], 'saved-version')
        self.assertNotIn('values.person_count', update['$set'])
        self.assertNotIn('values.mirror_reflection', update['$set'])
        self.assertNotIn('descriptive_tags', update['$set'])
        self.assertEqual(update['$set']['values.pose'], 'seated')

        namespace['HTTPException'] = RuntimeError
        collection.update_one.return_value = SimpleNamespace(matched_count=0)
        with self.assertRaisesRegex(RuntimeError, 'Corrections changed'):
            await namespace[fn.name](1)
