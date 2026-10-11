import { validateCatalogDraft } from './promptCatalog';

export const CATEGORY_CHOICE_TYPES = ['chips', 'chips_multi', 'pose_chips'];
export const CATEGORY_TEXT_FIELDS = ['label', 'keywords', 'short', 'short_tags', 'group'];

export function exportCategoryBatch(section, getKeywords) {
  return {
    format: 'ultra-studio-category-prompts', version: 1,
    category: {key: section.key, title: section.title, fields: section.fields.map(field => ({
      key: field.key, label: field.label,
      choices: CATEGORY_CHOICE_TYPES.includes(field.type) ? field.options.map(option => ({
        value: option.value,
        ...Object.fromEntries(CATEGORY_TEXT_FIELDS.map(key => [key, option[key] || ''])),
        default_keywords: getKeywords(field, option),
      })) : [],
    }))},
  };
}

// Apply wording by stable identifiers, retaining selection modes, coverage behavior,
// slider ranges and any metadata that is not part of the editable batch.
export function importCategoryBatch(text, section, getKeywords) {
  if (text.length > 1000000) throw new Error('Use a category JSON file smaller than 1 MB.');
  const batch = JSON.parse(text);
  if (batch?.format !== 'ultra-studio-category-prompts' || batch.version !== 1 || batch.category?.key !== section.key)
    throw new Error('Import a category download for this same category.');
  const category = batch.category;
  const matchList = (incoming, original, key) => {
    if (!Array.isArray(incoming) || incoming.length !== original.length || new Set(incoming.map(item => item?.[key])).size !== incoming.length || original.some(item => !incoming.some(next => next?.[key] === item[key])))
      throw new Error('Keep every subcategory and choice identifier in the category download. Use the regular editor to add or remove choices.');
  };
  matchList(category.fields, section.fields, 'key');
  const next = {...section, title: category.title, fields: section.fields.map(field => {
    const incoming = category.fields.find(item => item.key === field.key);
    const choices = CATEGORY_CHOICE_TYPES.includes(field.type) ? field.options : [];
    matchList(incoming.choices, choices, 'value');
    return {...field, label: incoming.label, options: field.options.map(option => {
      if (!CATEGORY_CHOICE_TYPES.includes(field.type)) return option;
      const edited = incoming.choices.find(item => item.value === option.value);
      if (getKeywords && edited.default_keywords !== getKeywords(field,option))
        throw new Error('default_keywords is reference wording. Put prompt edits in keywords instead.');
      const result = {...option};
      CATEGORY_TEXT_FIELDS.forEach(key => {
        if (typeof edited[key] !== 'string') throw new Error('Keep all editable choice fields as text.');
        if (edited[key] !== (option[key] || '')) result[key] = edited[key];
      });
      return result;
    })};
  })};
  validateCatalogDraft({sections: [next]});
  return next;
}
