import { compileModelPrompts } from './modelPromptCompilers';
import { SECTIONS } from './dna';
import { buildPromptPriorityPlan } from './promptPriority';
import { PHOTO_DETAIL, LIMB_DETAIL } from './photographicGuidance';
import { isPromptMetadata } from './promptMetadata';
const base = () => ({ identity: { age: 47, gender: 'female' }, wardrobe: { outfit_mode: 'custom' }, pose: { distance: 'full body' } });
const sections = new Set(['identity', 'physique', 'face', 'hair', 'skin', 'wardrobe', 'pose', 'scene', 'lighting', 'camera', 'style']);
const omitted = new Set(['identity.name', 'wardrobe.exposure_mode', 'wardrobe.outfit_preset', 'wardrobe.set_lingerie', 'wardrobe.underwear']);
const cases = SECTIONS.filter(section => sections.has(section.key)).flatMap(section => section.fields.flatMap(field => {
  if (isPromptMetadata(section.key, field.key) || omitted.has(`${section.key}.${field.key}`) || !['chips', 'chips_multi', 'pose_chips'].includes(field.type)) return [];
  const values = (field.groups?.flatMap(group => group.options) || field.options || []).filter(value => !['none', 'default', 'full frame'].includes(value));
  return [...new Set(values)].map(value => [section.key, field.key, value, field.type]);
}));
test.each(cases)('Chroma HD preserves authored %s.%s keywords or explains why inactive', (section, field, value, type) => {
  const dna = base(); dna[section] = { ...dna[section], [field]: type === 'chips_multi' ? [value] : value };
  const marker = `selected_${section}_${field}_detail`;
  const promptCatalog = { sections: [{ key: section, title: section, fields: [{ key: field, label: field, type, options: [{ value, label: value, keywords: marker }] }] }] };
  const before = JSON.stringify(dna);
  const result = compileModelPrompts({ dna, promptStyle: 'chroma', promptCatalog });
  const row = result.selectionManifest.find(row => row.key.includes(`${section}.${field}`));
  expect(result.positive.includes(marker) || Boolean(row?.inactive && !row.inactive.startsWith('A competing selection'))).toBe(true);
  expect(JSON.stringify(dna)).toBe(before);
});
test.each(['detailed', 'compact'])('Chroma %s excludes editor metadata and retains photographic guidance', promptFormat => {
  const dna = base(); dna.physique = { bust_control_mode: 'preset', butt_control_mode: 'slider', hips_control_mode: 'preset', waist_control_mode: 'preset', thighs_control_mode: 'slider' };
  dna.wardrobe.garment_priority = 'separates';
  const result = compileModelPrompts({ dna, promptStyle: 'chroma', promptFormat });
  expect(result.positive).not.toMatch(/\bpreset\b|\bslider\b|garment priority|catalogSelections/);
  expect(result.positive).toContain(PHOTO_DETAIL); expect(result.positive).toContain(LIMB_DETAIL);
  const plan = buildPromptPriorityPlan({ dna: { ...dna, _catalogSelections: { hair: { color: 'internal' } } } });
  expect([...plan.mustMatch, ...plan.important, ...plan.detail].some(item => /control_mode|garment_priority|^_/.test(item.key))).toBe(false);
});
test('Chroma keeps resolved clothing modifiers and hand position', () => {
  const dna = base(); dna.wardrobe = { outfit_mode: 'custom', top: 'white shirt', bottom: 'navy trousers', material: 'linen', fit: 'tailored', garment_pattern: 'pinstripe', accessories: ['watch'], heel_type: 'pumps', heel_height: 'low', heel_finish: 'matte' };
  dna.pose.hands = 'hands resting at sides';
  const result = compileModelPrompts({ dna, promptStyle: 'chroma' });
  for (const detail of ['linen', 'tailored', 'pinstripe', 'watch', 'pumps', 'low', 'matte', 'hands resting at sides']) expect(result.positive).toContain(detail);
});
test('crop does not add footwear to a portrait or revive suppressed details', () => {
  const dna = base(); dna.pose.distance = 'portrait'; dna.wardrobe = { outfit_mode: 'custom', top: 'white shirt', footwear: 'combat boots', heel_type: 'pumps', heel_height: 'high' };
  const result = compileModelPrompts({ dna, promptStyle: 'chroma' });
  expect(result.positive).not.toMatch(/combat boots|pumps|high heel/);
});

test.each([['male', 'man'], ['non-binary', 'non-binary person'], ['androgynous', 'androgynous person']])('Chroma uses the selected %s identity consistently', (gender, person) => {
  const dna = base(); dna.identity.gender = gender;
  const result = compileModelPrompts({ dna, promptStyle: 'chroma' });
  expect(result.positive).toContain(`47-year-old adult ${person}`);
  expect(result.positive).not.toContain('adult woman');
});
