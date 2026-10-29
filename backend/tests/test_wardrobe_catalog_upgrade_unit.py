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

class EverydayWardrobeUpgradeTests(unittest.TestCase):
    def test_preserves_custom_options_and_does_not_repeat_old_migration(self):
        option = {'value': 't-shirt', 'label': 'Favorite', 'keywords': 'my exact shirt', 'group': 'Mine'}
        catalog = {'sections': [{'key': 'wardrobe', 'fields': [
            {'key': 'top', 'options': [option]}, {'key': 'outfit_set', 'options': []}]}]}
        result = upgrade_wardrobe_catalog(catalog, 1)
        fields = result['sections'][0]['fields']
        self.assertEqual(fields[0]['options'][0], option)
        self.assertEqual(fields[1]['options'], [])
        self.assertEqual(len(catalog['sections'][0]['fields'][0]['options']), 1)
        self.assertEqual(upgrade_wardrobe_catalog(result, 1), result)
        fields[0]['options'] = []
        self.assertEqual(upgrade_wardrobe_catalog(result, 2), result)

    def test_frontend_and_backend_catalogs_match(self):
        import json
        from pathlib import Path
        root = Path(__file__).resolve().parents[2]
        self.assertEqual(json.loads((root / 'backend/everyday_wardrobe_catalog.json').read_text()),
                         json.loads((root / 'frontend/src/lib/everydayWardrobeCatalog.json').read_text()))
