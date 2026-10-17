"""Bounded payload validation for user-owned photo randomizer presets."""
import re

ALLOWED_SECTIONS = {'face', 'hair', 'skin', 'wardrobe', 'pose', 'scene', 'lighting', 'camera', 'style'}


def validate_randomizer(name, rules):
    name = str(name).strip()
    if not name or len(name) > 100:
        raise ValueError('Choose a name between 1 and 100 characters.')
    if not isinstance(rules, list) or not 1 <= len(rules) <= 40:
        raise ValueError('Choose between 1 and 40 details.')
    cleaned, seen = [], set()
    for rule in rules:
        section, field = rule.get('section'), rule.get('field')
        if section not in ALLOWED_SECTIONS or not isinstance(field, str) or not re.fullmatch(r'[a-zA-Z0-9_]{1,80}', field):
            raise ValueError('Choose a supported photo detail.')
        key = (section, field)
        if key in seen:
            raise ValueError('Each detail can appear only once.')
        seen.add(key)
        values = rule.get('values')
        if not isinstance(values, list) or not 1 <= len(values) <= 200 or any(not isinstance(v, str) or not v.strip() or len(v) > 1000 for v in values):
            raise ValueError('Each detail needs 1–200 nonempty options.')
        cleaned.append({'section':section, 'field':field, 'values':list(dict.fromkeys(values))})
    return name, cleaned
