import { SIZE_CONTROL_PAIRS } from './physiqueControlPriority';

export function fieldGroups(section) {
  const consumed = new Set();
  return section.fields.flatMap(field => {
    if (consumed.has(field.key)) return [];
    const pair = section.key === 'physique' && SIZE_CONTROL_PAIRS[field.key];
    const keys = pair ? [field.key, pair[0], ...(field.key === 'bust' ? ['implant_volume'] : [])] : [field.key];
    keys.forEach(key => consumed.add(key));
    return [{ key: field.key, label: field.label, fields: section.fields.filter(item => keys.includes(item.key)) }];
  });
}

export function selectedOptions(sections, dna) {
  return sections.flatMap(section => section.fields.flatMap(field => {
    const value = dna[section.key]?.[field.key];
    const values = Array.isArray(value) ? field.type === "chips_multi" ? value : [value.at(-1)] : [value];
    return values.filter(item => item !== undefined && item !== null && item !== '' && item !== false && item !== 0)
      .map(item => ({ section: section.key, field: field.key, value: item, label: `${field.label}: ${field.optionLabels?.[item] || item}` }));
  }));
}

export function clearOption(section, field, value, option) {
  const definition = section.fields.find(item => item.key === field);
  return { ...value, [field]: definition?.type === "chips_multi" && Array.isArray(value[field]) ? value[field].filter(item => item !== option)
    : definition?.type === 'slider' ? definition.defaultValue ?? definition.min ?? 0 : '' };
}


export function clearUnlockedChoices(sections, dna, locks = {}, fieldLocks = {}) {
  const result = { ...dna };
  selectedOptions(sections, dna).forEach(item => {
    if (locks[item.section] || fieldLocks[item.section]?.[item.field]) return;
    const section = sections.find(s => s.key === item.section);
    result[item.section] = clearOption(section, item.field, result[item.section] || {}, item.value);
  });
  return result;
}
