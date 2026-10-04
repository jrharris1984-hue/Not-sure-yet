"""User-confirmed metadata overlays for externally indexed media."""
import copy

TEXT_FIELDS = ('search_description', 'interaction', 'physical_appearance', 'wardrobe_details',
               'pose', 'framing', 'lighting', 'environment', 'hair_color', 'hair_length', 'hair_style')
FIELDS = (*TEXT_FIELDS, 'person_count', 'mirror_reflection', 'people')


def normalize_values(values):
    out = {}
    for key, value in values.items():
        if key not in FIELDS:
            continue
        if key in TEXT_FIELDS:
            if not isinstance(value, str) or len(value) > 3000:
                raise ValueError(f'{key} must be text under 3000 characters')
            out[key] = value.strip()
        elif key == 'person_count':
            if value is None:
                out[key] = None
            elif type(value) is int and 0 <= value <= 20:
                out[key] = value
            else:
                raise ValueError('People count must be unknown or between 0 and 20')
        elif key == 'mirror_reflection':
            if value not in ('yes', 'no', 'uncertain'):
                raise ValueError('Mirror reflection must be yes, no, or uncertain')
            out[key] = value
        elif key == 'people':
            if not isinstance(value, list) or len(value) > 20:
                raise ValueError('People must be a list of at most 20 records')
            out[key] = []
            for person in value:
                if not isinstance(person, dict):
                    raise ValueError('Each person must be a record')
                out[key].append({k: v.strip() for k, v in person.items()
                                 if k in (*TEXT_FIELDS, 'gender', 'description') and isinstance(v, str) and len(v) <= 3000})
    return out


def clean_tags(tags):
    if not isinstance(tags, list) or len(tags) > 100:
        raise ValueError('Use at most 100 tags')
    out = []
    for tag in tags:
        if not isinstance(tag, str) or len(tag) > 80:
            raise ValueError('Tags must be text under 80 characters')
        tag = tag.strip().lower().replace('_', ' ')
        if tag and tag not in out:
            out.append(tag)
    return out


def overlay_item(item, overlay):
    out = copy.deepcopy(item)
    if not overlay:
        return out
    out.update(overlay.get('values') or {})
    # Explicitly replace count aliases and stale structured people records.
    if 'person_count' in (overlay.get('values') or {}):
        count = out['person_count']
        for key in ('people_count', 'subject_count', 'num_people', 'number_of_people'):
            out[key] = count
        if 'people' not in overlay['values']:
            out['people'] = []
    if 'people' in out:
        out['persons'] = out['subjects'] = out['people']
    organization = overlay.get('organization_tags', [])
    tags = [tag for tag in overlay.get('descriptive_tags', []) if tag not in organization]
    count = out.get('person_count')
    if count == 1:
        tags = [tag for tag in tags if tag not in ('couple', 'duo', 'group', 'multiple people', 'two people')]
    elif isinstance(count, int) and count > 1:
        tags = [tag for tag in tags if tag not in ('solo', 'one person')]
    out['general_tags'] = tags
    out['adult_content_tags'] = []
    out['organization_tags'] = overlay.get('organization_tags', [])
    out['correction_review'] = {k: overlay.get(k, [] if k != 'values' else {}) for k in
                                ('values', 'confirmed_fields', 'descriptive_tags', 'organization_tags')}
    return out
