import ast
from pathlib import Path
import sys
import unittest
from typing import Any, Dict
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from shoot_planner import apply_shot_controls

def load_frame_function():
    tree = ast.parse((ROOT / 'backend/server.py').read_text())
    node = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == '_apply_frame_to_dna')
    scope = {'Dict': Dict, 'Any': Any, 'apply_shot_controls': apply_shot_controls}
    exec(compile(ast.Module(body=[node], type_ignores=[]), 'server.py', 'exec'), scope)
    return scope['_apply_frame_to_dna']

class ShootWardrobeTests(unittest.TestCase):
    def test_coverage_keeps_the_saved_set_and_lingerie(self):
        base = {'wardrobe': {'outfit_set': 'pantsuit with pumps', 'set_lingerie': 'matching satin lingerie'}}
        result = load_frame_function()(base, {'outfit_overrides': {'exposure_mode': 'lingerie only'}}, True)
        self.assertEqual(result['wardrobe']['outfit_mode'], 'full')
        self.assertEqual(result['wardrobe']['set_lingerie'], 'matching satin lingerie')
        self.assertEqual(result['wardrobe']['exposure_mode'], 'lingerie only')
        self.assertNotIn('exposure_mode', base['wardrobe'])

    def test_rotation_switches_a_full_set_to_custom(self):
        base = {'wardrobe': {'outfit_mode': 'full', 'outfit_set': 'pantsuit with pumps', 'set_lingerie': 'matching satin lingerie'}}
        result = load_frame_function()(base, {'outfit_overrides': {'outfit_preset': 'streetwear'}}, True)
        self.assertEqual(result['wardrobe']['outfit_mode'], 'custom')
        self.assertEqual(result['wardrobe']['outfit_set'], '')
        self.assertEqual(result['wardrobe']['set_lingerie'], '')
        self.assertEqual(base['wardrobe']['outfit_mode'], 'full')

if __name__ == '__main__':
    unittest.main()
