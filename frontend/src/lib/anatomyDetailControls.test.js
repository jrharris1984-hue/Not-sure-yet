import { normalizeAnatomyDetails } from './anatomyDetailControls';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolveBuilderControls } from './builderControlResolution';
import { PHOTO_DETAIL } from './photographicGuidance';
test('legacy combined choices fill missing dimensions without overriding explicit choices', () => {
  const source = { intimate: { areolas: 'large brown', areola_size: 'small areolas', nipples: 'large', nipple_size: 'small nipple tips' } };
  const before = JSON.stringify(source);
  const result = normalizeAnatomyDetails(source);
  expect(result.intimate).toMatchObject({ areola_size: 'small areolas', areola_color: 'warm brown areolas', nipple_size: 'small nipple tips', areolas: '', nipples: '' });
  expect(JSON.stringify(source)).toBe(before);
});
test('normalization is idempotent and preserves unknown custom presets', () => {
  const source = { intimate: { areolas: 'custom_color', nipples: 'inverted' } };
  const once = normalizeAnatomyDetails(source);
  expect(normalizeAnatomyDetails(once)).toEqual(once);
  expect(once.intimate.areolas).toBe('custom_color');
});
test.each(['chroma', 'zimage', 'krea2', 'flux', 'sdxl', 'pony'])('%s keeps photographic guidance and covering outfit hides concealed details', promptStyle => {
  const dna = { identity: { age: 47, gender: 'female' }, wardrobe: { outfit_set: 'tailored pantsuit with blouse and pumps' }, pose: { distance: 'full body' }, intimate: { areolas: 'large brown', nipples: 'small' } };
  const result = compileModelPrompts({ dna, promptStyle });
  expect(result.positive).toContain(PHOTO_DETAIL);
  expect(result.positive).not.toMatch(/areolas|nipple tips/);
});
test('foot-state socks hide nail and sole details without changing saved data', () => {
  const source = { feet: { foot_state: ['in socks'], pedicure: 'painted red', sole_texture: 'smooth soles' } };
  const result = resolveBuilderControls(source);
  expect(result.dna.feet.hosiery).toBe('ankle socks');
  expect(result.dna.feet.pedicure).toBe('');
  expect(result.dna.feet.sole_texture).toBe('');
  expect(source.feet.pedicure).toBe('painted red');
});
test('authored foot-state phrases follow stable coverage choices', () => {
  const source = { wardrobe: { footwear: 'boots' }, feet: { foot_state: ['uncovered skin'], pedicure: 'polished red nails' }, _catalogSelections: { feet: { foot_state: ['bare'], pedicure: 'painted red' }, wardrobe: { footwear: 'boots' } } };
  const result = resolveBuilderControls(source);
  expect(result.dna.feet.foot_state).toEqual([]);
  expect(result.dna._catalogSelections.feet.foot_state).toEqual([]);
  expect(result.dna.feet.pedicure).toBe('');
});
test('new nail, texture and accessory controls supersede overlapping older choices', () => {
  const result = resolveBuilderControls({ feet: { composition_mode: 'feet focus', pedicure: 'long nails', toenail_shape: 'short square', sole_presentation: 'smooth soles', sole_texture: 'natural sole creases', toes: ['toe ring'], foot_accessories: ['toe ring', 'multiple toe rings'] } });
  expect(result.dna.feet.pedicure).toBe('');
  expect(result.dna.feet.sole_presentation).toBe('');
  expect(result.dna.feet.toes).toEqual([]);
  expect(result.dna.feet.foot_accessories).toEqual(['multiple toe rings']);
});

test('authored legacy keywords are not rewritten as standard preset dimensions', () => {
  const source = { intimate: { areolas: 'medium pink' } };
  const catalog = { sections: [{ key: 'intimate', fields: [{ key: 'areolas', options: [{ value: 'medium pink', keywords: 'my custom detail' }] }] }] };
  expect(normalizeAnatomyDetails(source, catalog)).toEqual(source);
});

test.each(['chroma', 'zimage', 'krea2', 'flux', 'sdxl', 'pony'])('%s uses precise dimensions and keeps the older missing color', promptStyle => {
  const dna = { identity: { age: 47, gender: 'female' }, intimate: { areolas: 'large brown', areola_size: 'small areolas' } };
  const result = compileModelPrompts({ dna, promptStyle });
  expect(result.positive).toContain('small areolas');
  expect(result.positive).toContain('warm brown areolas');
  expect(result.positive).not.toContain('wide areolas');
});
