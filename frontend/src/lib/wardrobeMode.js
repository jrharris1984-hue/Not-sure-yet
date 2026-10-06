import { matchingSetLingerie } from "./completeOutfitSets";
export const FULL_SET_ALLOWED_FIELDS = new Set(['outfit_mode', 'outfit_set', 'outfit_set_color', 'set_lingerie', 'exposure_mode', 'nail_color', 'nail_shape']);
export const wardrobeMode = (value = {}) => ['full', 'custom'].includes(value.outfit_mode)
  ? value.outfit_mode : value.outfit_set ? 'full' : 'custom';
export const wardrobeFieldDisabled = (field, value = {}) => wardrobeMode(value) === 'full'
  ? !FULL_SET_ALLOWED_FIELDS.has(field) : ['outfit_set', 'outfit_set_color', 'set_lingerie'].includes(field);
export function selectWardrobeMode(value, mode) {
  return { ...value, outfit_mode: mode, ...(mode === 'full' ? { exposure_mode: 'use selected outfit', nudity_level: 0, nudity_outfit: '' } : {}) };
}
export function editWardrobeField(value, field, selected) {
  if (field === 'outfit_mode') return selectWardrobeMode(value, selected || 'custom');
  if (field === 'outfit_set') return { ...selectWardrobeMode(value, 'full'), outfit_set: selected };
  if (wardrobeFieldDisabled(field, value)) return value;
  return { ...value, [field]: selected };
}
// Resolve explicit modes on a copy: retain old recipes' legacy priorities until
// the user chooses a mode, and retain inactive custom selections for later edits.
export function resolveWardrobeMode(value = {}) {
  if (!value.outfit_mode) return { ...value };
  if (value.outfit_mode === 'custom') return { ...value, outfit_set: '', outfit_set_color: '' };
  if (value.outfit_mode !== 'full') return { ...value };
  const resolved = Object.fromEntries(Object.entries(value).map(([key, selected]) => [key,
    FULL_SET_ALLOWED_FIELDS.has(key) ? selected : key === 'exposure_mode' ? 'use selected outfit' : key === 'nudity_level' ? 0 : Array.isArray(selected) ? [] : '',
  ]));
  resolved.set_lingerie = value.set_lingerie || matchingSetLingerie(value.outfit_set);
  if (value.exposure_mode === 'lingerie showing') resolved.underwear = resolved.set_lingerie;
  if (value.exposure_mode === 'lingerie only') { resolved.outfit_set = resolved.set_lingerie; resolved.underwear = ''; }
  return resolved;
}
