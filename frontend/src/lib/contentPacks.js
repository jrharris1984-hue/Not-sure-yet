import { validateCatalogDraft } from './promptCatalog';

export const CONTENT_PACK_VERSION = 1;

// Packs are data-only JSON. Never execute imported scripts or replace existing
// choices: matching stable identifiers remain owned by the installed library.
export function createContentPack(section) {
  const pack = { format: 'ultrastudio-content-pack', version: CONTENT_PACK_VERSION,
    section: JSON.parse(JSON.stringify(section)) };
  validateCatalogDraft({ sections: [pack.section] });
  return pack;
}

export function mergeContentPack(catalog, pack) {
  if (!pack || pack.format !== 'ultrastudio-content-pack' ||
      pack.version !== CONTENT_PACK_VERSION || !pack.section) {
    throw new Error('Choose an Ultra Studio content pack JSON file.');
  }
  validateCatalogDraft({ sections: [pack.section] });
  const base = JSON.parse(JSON.stringify(catalog || { sections: [] }));
  validateCatalogDraft(base);
  const incoming = pack.section;
  const existing = base.sections.find(section => section.key === incoming.key);
  if (!existing) {
    base.sections.push(JSON.parse(JSON.stringify(incoming)));
    validateCatalogDraft(base);
    return { catalog: base, added: incoming.fields.reduce((n, field) => n + field.options.length, 0), skipped: 0 };
  }
  let added = 0, skipped = 0;
  for (const field of incoming.fields) {
    const target = existing.fields.find(item => item.key === field.key);
    if (!target) {
      existing.fields.push(JSON.parse(JSON.stringify(field)));
      added += field.options.length;
      continue;
    }
    if (target.type !== field.type) {
      throw new Error(`Incompatible control type for ${incoming.title} / ${field.label}.`);
    }
    const known = new Set(target.options.map(option => option.value));
    for (const option of field.options) {
      if (known.has(option.value)) { skipped++; continue; }
      target.options.push(JSON.parse(JSON.stringify(option)));
      known.add(option.value);
      added++;
    }
  }
  validateCatalogDraft(base);
  return { catalog: base, added, skipped };
}
