"""Add new wardrobe choices once while preserving edited prompt-library choices."""
import copy
import json
from pathlib import Path

def upgrade_wardrobe_catalog(catalog):
    upgraded = copy.deepcopy(catalog or {'sections': []})
    wardrobe = next((section for section in upgraded.get('sections', []) if section.get('key') == 'wardrobe'), None)
    if not wardrobe:
        return upgraded
    field = next((field for field in wardrobe.get('fields', []) if field.get('key') == 'outfit_set'), None)
    if not field:
        return upgraded
    existing = {option['value'] for option in field.get('options', [])}
    added = json.loads(Path(__file__).with_name('wardrobe_set_catalog.json').read_text())
    field.setdefault('options', []).extend(option for option in added if option['value'] not in existing)
    return upgraded
