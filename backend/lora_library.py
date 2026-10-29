"""Read LoRA metadata as data; never load tensors or infer triggers from captions."""
import hashlib
import math
import re

FAMILIES = {'sd15', 'sdxl', 'pony', 'flux', 'flux2_klein', 'krea2', 'chroma',
            'moss_image', 'qwen_image', 'qwen_edit', 'zimage', 'wan22'}


def file_key(name):
    if not isinstance(name, str) or not name.strip() or len(name) > 600:
        raise ValueError('Invalid LoRA filename.')
    name = name.replace('\\', '/')
    if name.startswith('/') or ':' in name or any(p in {'', '.', '..'} for p in name.split('/')):
        raise ValueError('Use a filename relative to the ComfyUI LoRA folder.')
    return name.lower()


def record_id(name):
    return hashlib.sha256(file_key(name).encode()).hexdigest()


def family_from_metadata(value):
    """Only recognized architecture names, not loose filename guesses."""
    value = str(value or '').lower().strip()
    if 'pony' in value: return 'pony'
    if 'moss' in value: return 'moss_image'
    if 'krea' in value and '2' in value: return 'krea2'
    if 'chroma' in value: return 'chroma'
    if 'qwen' in value: return 'qwen_edit' if 'edit' in value else 'qwen_image'
    if 'klein' in value: return 'flux2_klein'
    if 'flux' in value and not re.search(r'flux[ ._-]*2', value): return 'flux'
    if 'z-image' in value or 'z_image' in value: return 'zimage'
    if 'wan' in value and '2.2' in value: return 'wan22'
    if 'sdxl' in value or 'sdxl_base' in value or value.startswith('sdxl_') or 'sdxl' in value.replace(' ', ''): return 'sdxl'
    if value in {'sd 1.5', 'sd_v1', 'sd1.5', 'stable-diffusion-v1-5'}: return 'sd15'
    return ''


def words(value):
    if isinstance(value, str): value = re.split(r'[,;\n]', value)
    if not isinstance(value, list): return []
    return list(dict.fromkeys(w.strip() for w in value if isinstance(w, str) and 0 < len(w.strip()) <= 200))[:40]


def metadata_profile(metadata):
    if not isinstance(metadata, dict): return {}
    architecture = next((metadata[k] for k in ('modelspec.architecture', 'ss_base_model_version', 'ss_sd_model_name')
                         if isinstance(metadata.get(k), str) and family_from_metadata(metadata[k])), '')
    # Tag frequencies are training captions, NOT a reliable list of triggers.
    triggers = next((metadata[k] for k in ('modelspec.trigger_phrase', 'trigger_words', 'trainedWords') if metadata.get(k)), [])
    return {'family': family_from_metadata(architecture), 'triggerWords': words(triggers),
            'baseModel': str(architecture)[:200], 'source': 'embedded metadata'}


def hash_profile(data, sha256):
    """Require a matching full-file SHA256 in the returned file list."""
    if not isinstance(data, dict): raise ValueError('Invalid model record.')
    files = data.get('files')
    if not isinstance(files, list): raise ValueError('Missing file hashes.')
    matched = any(isinstance(f, dict) and isinstance(f.get('hashes'), dict)
                  and str(f['hashes'].get('SHA256', '')).lower() == sha256.lower()
                  for f in files)
    if not matched: raise ValueError('The model record did not confirm the imported file hash.')
    model = data.get('model') or {}
    if not isinstance(model, dict): raise ValueError('Invalid model record.')
    if model.get('type') not in {'LORA', 'LoCon'}: raise ValueError('Matched file is not a LoRA.')
    mid, vid = data.get('modelId'), data.get('id')
    if not isinstance(mid, int) or not isinstance(vid, int): raise ValueError('Model identifiers are missing.')
    return {'family': family_from_metadata(data.get('baseModel')), 'baseModel': str(data.get('baseModel', ''))[:200],
            'triggerWords': words(data.get('trainedWords')), 'source': 'Civitai SHA256 match',
            'sourceUrl': f'https://civitai.com/models/{mid}?modelVersionId={vid}',
            'label': str(model.get('name', ''))[:200]}


def validate_profile(value):
    if not isinstance(value, dict): raise ValueError('Invalid profile.')
    family = value.get('family', '')
    if family not in FAMILIES | {''}: raise ValueError('Unknown model family.')
    result = {'family': family, 'triggerWords': words(value.get('triggerWords', []))}
    bounds = []
    for key in ('minStrength', 'defaultStrength', 'maxStrength'):
        number = value.get(key)
        if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number):
            raise ValueError('Enter finite minimum, default and maximum strengths.')
        bounds.append(number)
        result[key] = number
    cap = 3.5 if family == 'krea2' else 2.0
    low, default, high = bounds
    if not -cap <= low <= default <= high <= cap or low == high:
        raise ValueError(f'Use minimum < maximum within {-cap} to {cap}, with the default inside that range.')
    return result


def signed_strength(value, maximum=2.0):
    try: number = float(value)
    except (TypeError, ValueError): raise ValueError('LoRA strength must be a finite number.')
    if not math.isfinite(number): raise ValueError('LoRA strength must be a finite number.')
    return max(-maximum, min(maximum, number))


def validate_hash_import(body):
    entries = body.get('files') if isinstance(body, dict) else None
    if not isinstance(entries, list) or len(entries) > 5000:
        raise ValueError('Import a hash inventory with at most 5000 files.')
    result = []
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict): raise ValueError('Invalid inventory entry.')
        key = file_key(entry.get('name'))
        digest = entry.get('sha256', '')
        if not isinstance(digest, str) or not re.fullmatch('[a-fA-F0-9]{64}', digest):
            raise ValueError('Each file needs a full SHA256 hash.')
        if key in seen: raise ValueError('Duplicate inventory filename.')
        seen.add(key)
        result.append({'name': entry['name'].replace('\\', '/'), 'sha256': digest.lower()})
    return result
