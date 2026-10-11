import { compileModelPrompts } from './modelPromptCompilers';
import { underneathLayer, preserveUnderneathLayers } from './underneathLayer';
import { auditSelectionPrompt } from './selectionPromptAudit';
const outfit = 'tailored women’s pantsuit with a matching blouse, handbag and pumps';
const lace = 'matching lace bra and briefs';
const dna = () => ({ identity: { age: 47, gender: 'female' }, pose: { distance: 'full body' }, wardrobe: { outfit_mode: 'full', outfit_set: outfit, outfit_set_color: 'ivory', set_lingerie_mode: 'matching', set_lingerie: lace, exposure_mode: 'use selected outfit' } });
for (const promptStyle of ['chroma', 'krea2', 'standard', 'sdxl', 'pony']) {
  test.each(['compact', 'detailed'])(`${promptStyle} %s retains the selected underneath layer with the outer outfit`, promptFormat => {
    const source = dna(), before = JSON.stringify(source);
    const result = compileModelPrompts({ dna: source, promptStyle, promptFormat });
    expect(result.positive).toContain(lace);
    expect(result.positive).toContain('pantsuit');
    expect(result.positive).toContain('ivory');
    expect(result.positive.split(lace)).toHaveLength(2);
    expect(JSON.stringify(source)).toBe(before);
    const row = auditSelectionPrompt(result.positive, result.selectionManifest).rows.find(row => row.key.includes('wardrobe.set_lingerie'));
    expect(row.status).toBe('included');
  });
}
test.each(['compact', 'detailed'])('disabled underneath layer stays saved and absent from %s output', promptFormat => {
  const source = dna(); source.wardrobe.set_lingerie_mode = 'none';
  const result = compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat });
  expect(result.positive).not.toContain(lace);
  expect(source.wardrobe.set_lingerie).toBe(lace);
  expect(result.positive).toContain('pantsuit');
});
test('the full set supplies matching lingerie if no specific layer is selected', () => {
  const source = dna(); delete source.wardrobe.set_lingerie;
  const result = compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat: 'compact' });
  expect(result.positive).toContain('matching satin bra and briefs');
});
test('custom keyword text for the selected layer reaches compact and detailed output', () => {
  const source = dna(); source.wardrobe.set_lingerie = 'custom_lace';
  const promptCatalog = { sections: [{ key: 'wardrobe', title: 'Wardrobe', fields: [{ key: 'set_lingerie', label: 'Underneath layer', type: 'chips', options: [{ value: 'custom_lace', label: 'Lace', keywords: 'ivory embroidered lace bra and briefs' }] }] }] };
  for (const promptFormat of ['compact', 'detailed']) expect(compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat, promptCatalog }).positive).toContain('ivory embroidered lace bra and briefs');
});
test('each cast member retains their own underneath layer without cross-subject deduplication', () => {
  const subjects = ['A', 'B'].map(label => ({ label, dna: dna() }));
  const result = preserveUnderneathLayers({ positive: 'Subject A: pantsuit. Subject B: pantsuit.' }, subjects);
  expect(result.positive).toContain(`Subject A wardrobe: underneath clothing: ${lace}`);
  expect(result.positive).toContain(`Subject B wardrobe: underneath clothing: ${lace}`);
  expect(preserveUnderneathLayers(result, subjects)).toEqual(result);
});
test('a main lingerie outfit is not also described as its own underneath layer', () => {
  expect(underneathLayer({ outfit_mode: 'full', outfit_set: lace, set_lingerie: lace })).toBeNull();
  expect(underneathLayer({ outfit_mode: 'custom', outfit_set: outfit, set_lingerie: lace })).toBeNull();
});

test.each(['compact', 'detailed'])('the screenshot pantsuit and Everyday matching lace keep underwear without competing robe or slippers in %s output', promptFormat => {
  const source = dna();
  source.wardrobe.set_lingerie = 'matching lace bra and briefs with a coordinating satin robe and slippers';
  const result = compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat });
  expect(result.positive).toContain('matching lace bra and briefs');
  expect(result.positive).toContain('pantsuit');
  expect(result.positive).toContain('pumps');
  expect(result.positive).not.toMatch(/satin robe|slippers/);
  expect(source.wardrobe.set_lingerie).toContain('satin robe');
  const row = auditSelectionPrompt(result.positive, result.selectionManifest).rows.find(row => row.key.includes('wardrobe.set_lingerie'));
  expect(row.status).toBe('included');
});

test('an ensemble used as the main outfit retains its robe and footwear without a duplicate underneath layer', () => {
  const source = dna();
  source.wardrobe.outfit_set = 'matching lace bra and briefs with a coordinating satin robe and slippers';
  source.wardrobe.set_lingerie = source.wardrobe.outfit_set;
  const result = compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat: 'compact' });
  expect(result.positive).toContain('satin robe');
  expect(result.positive).toContain('slippers');
  expect(result.positive).not.toContain('underneath clothing:');
});

test('authored keywords are preserved even when they match a different built-in ensemble', () => {
  const source = dna(); source.wardrobe.set_lingerie = 'custom_layer';
  const keywords = 'matching lace bra and briefs with a coordinating satin robe and slippers';
  const promptCatalog = { sections: [{ key: 'wardrobe', fields: [{ key: 'set_lingerie', type: 'chips', options: [{ value: 'custom_layer', label: 'My layer', keywords }] }] }] };
  const result = compileModelPrompts({ dna: source, promptStyle: 'chroma', promptFormat: 'compact', promptCatalog });
  expect(result.positive).toContain(keywords);
});
