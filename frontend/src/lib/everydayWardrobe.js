import catalog from './everydayWardrobeCatalog.json';

// Keep every legacy choice; group new everyday garments for quick browsing.
export function expandEverydayWardrobe(section) {
  if (section.key !== 'wardrobe') return section;
  return { ...section, fields: section.fields.map(field => {
    if (!catalog[field.key]) return field;
    const original = field.groups || [{ name: 'Original styles', options: field.options || [] }];
    const existing = new Set(original.flatMap(group => group.options));
    const additions = Object.entries(catalog[field.key]).map(([name, options]) => ({
      name, options: options.filter(option => !existing.has(option)),
    })).filter(group => group.options.length);
    // Original styles stay first so saved browsing habits and defaults remain intact.
    const groups = [...original, ...additions];
    return { ...field, groups, options: groups.flatMap(group => group.options) };
  }) };
}
