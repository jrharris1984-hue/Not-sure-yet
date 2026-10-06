import copy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from wardrobe_catalog_upgrade import upgrade_wardrobe_catalog

class WardrobeUpgradeTests(unittest.TestCase):
    def test_extends_saved_choices_without_replacing_custom_edits(self):
        catalog = {'sections': [{'key': 'wardrobe', 'fields': [{'key': 'outfit_set', 'label': 'My outfits', 'options': [{'value': 'my suit', 'label': 'My tailored suit', 'keywords': 'custom satin', 'group': 'Saved'}]}]}]}
        original = copy.deepcopy(catalog)
        result = upgrade_wardrobe_catalog(catalog)
        field = result['sections'][0]['fields'][0]
        self.assertEqual(field['label'], 'My outfits')
        self.assertEqual(field['options'][0], original['sections'][0]['fields'][0]['options'][0])
        self.assertEqual(len(field['options']), 82)
        self.assertEqual(catalog, original)
        self.assertEqual(upgrade_wardrobe_catalog(result), result)

    def test_empty_catalog_keeps_builtin_fallback(self):
        self.assertEqual(upgrade_wardrobe_catalog({'sections': []}), {'sections': []})
