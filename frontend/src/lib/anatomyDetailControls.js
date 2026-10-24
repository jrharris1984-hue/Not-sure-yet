import { expandPrompt } from "./promptMap";
// Older combined choices are fallbacks for missing dimensions, never overrides.
// Work on a copy so existing characters and field locks keep their saved data.
const legacyNippleDetails = {
  soft: { nipple_shape: 'subtly raised nipples' },
  erect: { nipple_shape: 'protruding nipples' },
  inverted: { nipple_shape: 'inverted nipples' },
  small: { nipple_size: 'small nipple tips' },
  large: { nipple_size: 'large nipple tips' },
  puffy: { areola_shape: 'puffy raised areolas' },
  pierced: { piercings: 'nipple' },
};
const legacyAreolaDetails = {
  'small pale': { areola_size: 'small areolas', areola_color: 'pale pink areolas' },
  'medium pink': { areola_size: 'medium areolas', areola_color: 'rose pink areolas' },
  'large brown': { areola_size: 'wide areolas', areola_color: 'warm brown areolas' },
  'very large dark': { areola_size: 'very wide areolas', areola_color: 'dark brown areolas' },
  'puffy dome': { areola_shape: 'puffy raised areolas' },
};
export const LEGACY_ANATOMY_FIELDS = ['nipples', 'areolas'];
export function anatomyPresetDetails(field, selected, catalog = { sections: [] }) {
  const mapping = field === 'nipples' ? legacyNippleDetails : field === 'areolas' ? legacyAreolaDetails : null;
  const details = mapping?.[selected];
  if (!details) return null;
  const option = catalog.sections?.find(section => section.key === 'intimate')?.fields?.find(item => item.key === field)?.options?.find(item => item.value === selected);
  const authored = option?.keywords?.trim();
  if (authored && authored !== expandPrompt('intimate', field, selected)) return null;
  return details;
}
export function anatomySelectionReview(value = {}, catalog, locks = {}) {
  return LEGACY_ANATOMY_FIELDS.flatMap(field => {
    const details = anatomyPresetDetails(field, value[field], catalog);
    if (!details) return [];
    return [{ field, selected: value[field], details,
      conflicts: Object.entries(details).filter(([key, proposed]) => value[key] && value[key] !== proposed).map(([key]) => key),
      blocked: !!locks[field] || Object.keys(details).some(key => !!locks[key]),
    }];
  });
}
// Apply an explicitly chosen preset to unlocked individual controls, without
// leaving a second saved instruction behind. Custom authored presets stay intact.
export function selectAnatomyPreset(value, field, selected, catalog, locks = {}) {
  if (locks[field]) return value;
  const details = anatomyPresetDetails(field, selected, catalog);
  if (!details) return {...value, [field]: selected};
  const next = {...value, [field]: ''};
  for (const [key, choice] of Object.entries(details)) {
    if (!locks[key]) next[key] = choice;
  }
  return next;
}
export function normalizeAnatomyDetails(source = {}, catalog = { sections: [] }) {
  if (!source.intimate) return source;
  const intimate = { ...source.intimate };
  for (const field of LEGACY_ANATOMY_FIELDS) {
    const legacy = anatomyPresetDetails(field, intimate[field], catalog);
    if (!legacy) continue;
    for (const [target, value] of Object.entries(legacy)) {
      if (!intimate[target]) intimate[target] = value;
    }
    intimate[field] = '';
  }
  return { ...source, intimate };
}
export function cleanUpAnatomySelections(value, catalog, locks = {}) {
  const next = {...value};
  for (const item of anatomySelectionReview(value, catalog, locks)) {
    if (item.blocked) continue;
    for (const [key, choice] of Object.entries(item.details)) {
      if (!next[key]) next[key] = choice;
    }
    next[item.field] = '';
  }
  return next;
}
