"""One-time additive character-vibe update; preserve authored prompt catalogs."""
import copy
import json
from pathlib import Path


def upgrade_character_vibes(catalog):
    result = copy.deepcopy(catalog or {'sections': []})
    identity = next((item for item in result.get('sections', []) if item.get('key') == 'identity'), None)
    if not identity:
        return result
    field = next((item for item in identity.get('fields', []) if item.get('key') == 'archetype'), None)
    if not field:
        return result
    if field.get('label') in ('Archetype', 'Archetype (character theme)'):
        field['label'] = 'Character vibe (optional)'
    existing = {item['value'] for item in field.get('options', [])}
    additions = json.loads(Path(__file__).with_name('character_vibe_options.json').read_text())
    field.setdefault('options', []).extend(item for item in additions if item['value'] not in existing)
    return result
