import { newCatalogKey } from './promptCatalog';
const normalized = value => String(value || '').trim().toLowerCase();

export function parseBulkChoices(text, defaultGroup = '') {
  if (text.length > 500000) throw new Error('Paste a batch smaller than 500 KB.');
  const entries = [], seen = new Set();
  let group = defaultGroup.trim() || undefined;
  if (group?.length > 200) throw new Error('Use a default group name up to 200 characters.');
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || /^```/.test(line) || /^[-*_]{3,}$/.test(line)) return;
    const heading = line.replace(/^#{1,6}\s+/, '').replace(/^\*\*(.*?)\*\*:?$/, '$1').trim();
    if (/^\[.*\]$/.test(heading) || /^[^:]+:$/.test(heading)) {
      group = /^\[.*\]$/.test(heading) ? heading.slice(1,-1).trim() : heading.slice(0,-1).trim();
      if (group.length > 200) throw new Error(`Line ${index+1}: use a group name up to 200 characters.`);
      return;
    }
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`Line ${index+1}: use choice name: prompt text.`);
    const label = line.slice(0, separator).trim(), keywords = line.slice(separator+1).trim();
    if (!label || label.length > 200 || !keywords || keywords.length > 1500) throw new Error(`Line ${index+1}: provide a name up to 200 characters and prompt text up to 1,500 characters.`);
    if (seen.has(normalized(label))) throw new Error(`Line ${index+1}: duplicate choice name "${label}".`);
    seen.add(normalized(label)); entries.push({label,keywords,...(group !== undefined ? {group} : {})});
  });
  if (!entries.length) throw new Error('Paste at least one choice name: prompt text line.');
  return entries;
}

export function mergeBulkChoices(options, entries, makeKey = newCatalogKey) {
  const next = options.map(option => ({...option})), changes = [], used = new Set();
  for (const entry of entries) {
    const valueMatches = options.filter(option => normalized(option.value) === normalized(entry.label));
    const matches = valueMatches.length ? valueMatches : options.filter(option => normalized(option.label) === normalized(entry.label));
    if (matches.length > 1) throw new Error(`"${entry.label}" matches multiple choices. Use its exact saved identifier instead.`);
    const existing = matches[0];
    if (existing && used.has(existing.value)) throw new Error(`Multiple lines update "${existing.label}". Keep one line per choice.`);
    if (existing) used.add(existing.value);
    const option = { ...(existing || {value:makeKey(),group:''}), ...entry,
      // An identifier match should not replace an intentionally renamed display label.
      label:existing && normalized(entry.label) === normalized(existing.value) ? existing.label : entry.label,
    };
    if (existing) next[next.findIndex(item => item.value === existing.value)] = option;
    else next.push(option);
    changes.push({type:existing ? 'update' : 'add',option});
  }
  if (next.length > 300) throw new Error('This choice list supports at most 300 entries.');
  return {options:next,changes};
}

export function bulkChoiceText(options, getKeywords) {
  return options.map(option => `[${option.group || ''}]\n${option.label}: ${option.keywords || getKeywords(option)}`).join('\n');
}
