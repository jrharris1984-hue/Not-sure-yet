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
export function normalizeAnatomyDetails(source = {}, catalog = { sections: [] }) {
  if (!source.intimate) return source;
  const intimate = { ...source.intimate };
  for (const [field, mapping] of [['nipples', legacyNippleDetails], ['areolas', legacyAreolaDetails]]) {
    const option = catalog.sections?.find(section => section.key === 'intimate')?.fields?.find(item => item.key === field)?.options?.find(item => item.value === intimate[field]);
    const authored = option?.keywords?.trim();
    if (authored && authored !== expandPrompt('intimate', field, intimate[field])) continue;
    const legacy = mapping[intimate[field]];
    if (!legacy) continue; // Unknown authored choices remain editable and intact.
    for (const [target, value] of Object.entries(legacy)) {
      if (!intimate[target]) intimate[target] = value;
    }
    intimate[field] = '';
  }
  return { ...source, intimate };
}
