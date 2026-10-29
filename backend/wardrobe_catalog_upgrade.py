"""Versioned, additive wardrobe updates that preserve saved prompt wording."""
import copy
import json
from pathlib import Path


def upgrade_wardrobe_catalog(catalog, from_version=0):
    upgraded = copy.deepcopy(catalog or {'sections': []})
    wardrobe = next((s for s in upgraded.get('sections', []) if s.get('key') == 'wardrobe'), None)
    if not wardrobe:
        return upgraded
    fields = {field.get('key'): field for field in wardrobe.get('fields', [])}
    if from_version < 1 and 'outfit_set' in fields:
        field = fields['outfit_set']
        existing = {option['value'] for option in field.get('options', [])}
        added = json.loads(Path(__file__).with_name('wardrobe_set_catalog.json').read_text())
        field.setdefault('options', []).extend(option for option in added if option['value'] not in existing)
    if from_version < 2:
        additions = json.loads(Path(__file__).with_name('everyday_wardrobe_catalog.json').read_text())
        for key, groups in additions.items():
            if key not in fields:
                continue  # Respect intentionally removed fields.
            field = fields[key]
            existing = {option['value'] for option in field.get('options', [])}
            for group, values in groups.items():
                for value in values:
                    if value not in existing:
                        field.setdefault('options', []).append({'value': value, 'label': value, 'group': group, 'keywords': ''})
                        existing.add(value)
    return upgraded
