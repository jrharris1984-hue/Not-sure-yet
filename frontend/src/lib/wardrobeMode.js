import { matchingSetLingerie } from "./completeOutfitSets";
export const FULL_SET_ALLOWED_FIELDS = new Set(['outfit_mode', 'outfit_set', 'outfit_set_color', 'set_lingerie_mode', 'set_lingerie', 'exposure_mode', 'nail_color', 'nail_shape']);
export const wardrobeMode = (value = {}) => ['full', 'custom'].includes(value.outfit_mode)
  ? value.outfit_mode : value.outfit_set ? 'full' : 'custom';
export const wardrobeFieldDisabled = (field, value = {}) => wardrobeMode(value) === 'full'
  ? !FULL_SET_ALLOWED_FIELDS.has(field) || (field === 'set_lingerie' && value.set_lingerie_mode === 'none')
  : ['outfit_set', 'outfit_set_color', 'set_lingerie_mode', 'set_lingerie'].includes(field);
export function selectWardrobeMode(value, mode) {
  return { ...value, outfit_mode: mode, ...(mode === 'full' ? { exposure_mode: 'use selected outfit', nudity_level: 0, nudity_outfit: '' } : {}) };
}
export function editWardrobeField(value, field, selected) {
  if (field === 'outfit_mode') return selectWardrobeMode(value, selected || 'custom');
  if (field === 'outfit_set') return { ...selectWardrobeMode(value, 'full'), outfit_set: selected };
  if (wardrobeFieldDisabled(field, value)) return value;
  if (field === 'exposure_mode' && wardrobeMode(value) === 'full' && value.set_lingerie_mode === 'none' && ['lingerie showing', 'lingerie only'].includes(selected)) return value;
  if (field === 'set_lingerie_mode') return { ...value, outfit_mode:'full', set_lingerie_mode:selected,
    ...(selected === 'none' && ['lingerie showing', 'lingerie only'].includes(value.exposure_mode) ? {exposure_mode:'use selected outfit'} : {}) };
  return { ...value, [field]: selected };
}
// Resolve explicit modes on a copy: retain old recipes' legacy priorities until
// the user chooses a mode, and retain inactive custom selections for later edits.
export function resolveWardrobeMode(value = {}) {
  if (!value.outfit_mode && value.set_lingerie_mode !== 'none') return { ...value };
  if (value.outfit_mode === 'custom') return { ...value, outfit_set: '', outfit_set_color: '' };
  if (value.outfit_mode !== 'full' && wardrobeMode(value) !== 'full') return { ...value };
  const resolved = Object.fromEntries(Object.entries(value).map(([key, selected]) => [key,
    FULL_SET_ALLOWED_FIELDS.has(key) ? selected : key === 'exposure_mode' ? 'use selected outfit' : key === 'nudity_level' ? 0 : Array.isArray(selected) ? [] : '',
  ]));
  resolved.outfit_mode = 'full';
  if (value.set_lingerie_mode === 'none') {
    resolved.set_lingerie = '';
    resolved.underwear = '';
    // Keep the outer outfit when an imported recipe asks to reveal a layer
    // that the user explicitly disabled. Do not invent replacement garments.
    if (['lingerie showing', 'lingerie only'].includes(value.exposure_mode)) resolved.exposure_mode = 'use selected outfit';
    if (/dress|uniform|gown|pantsuit|suit|blazer/i.test(resolved.outfit_set || '')) {
      resolved.outfit_set = String(resolved.outfit_set).replace(/,?\s*(?:with\s+)?matching lingerie\s*,?/gi, ',').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
    }
    return resolved;
  }
  resolved.set_lingerie = value.set_lingerie || matchingSetLingerie(value.outfit_set);
  if (value.exposure_mode === 'lingerie showing') resolved.underwear = resolved.set_lingerie;
  if (value.exposure_mode === 'lingerie only') { resolved.outfit_set = resolved.set_lingerie; resolved.underwear = ''; }
  return resolved;
}
