import ast
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock

class CoverageReviewTests(unittest.IsolatedAsyncioTestCase):
    async def test_named_coverage_replaces_legacy_zero_for_review_without_mutating_recipe(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
        fn = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'review_render_alignment')
        fn.decorator_list = []
        fn.args.args[0].annotation = None
        wardrobe = {'exposure_mode': 'partially nude', 'nudity_level': 0, 'nudity_outfit': ''}
        renders = SimpleNamespace(find_one=AsyncMock(return_value={'id': 'r', 'dna_snapshot': {'wardrobe': wardrobe}}), update_one=AsyncMock())
        vision = AsyncMock(return_value={'summary': 'review'})
        namespace = {'db': SimpleNamespace(renders=renders), 'get_settings': AsyncMock(return_value=SimpleNamespace(ai_provider='ollama')),
                     '_render_image_bytes': AsyncMock(return_value=b'image'), '_ollama_vision_json': vision,
                     'json': json, 'now_iso': lambda: 'now'}
        exec(compile(ast.Module(body=[fn], type_ignores=[]), 'server.py', 'exec'), namespace)
        await namespace[fn.name]('r')
        _, system, user, *_ = vision.call_args.args
        self.assertIn('partially nude', user)
        self.assertNotIn('nudity_level', user)
        self.assertIn('fully undressed subject does not match', system)
        self.assertEqual(wardrobe['nudity_level'], 0)
        wardrobe.pop('exposure_mode')
        await namespace[fn.name]('r')
        self.assertIn('nudity_level', vision.call_args.args[2])
