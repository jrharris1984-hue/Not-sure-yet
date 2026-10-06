import { CHARACTER_TYPE_PRESETS, applyCharacterTypePreset } from './characterTypePresets';
import { DEFAULT_DNA, SECTIONS } from './dna';
test('every character type uses supported controls and an explicit adult age', () => {
  for (const preset of CHARACTER_TYPE_PRESETS) {
    expect(preset.dna.identity.age).toBeGreaterThanOrEqual(18);
    for (const [section, values] of Object.entries(preset.dna)) {
      const fields = SECTIONS.find(item => item.key === section).fields;
      for (const [key, value] of Object.entries(values)) {
        const field = fields.find(item => item.key === key);
        expect(field).toBeDefined();
        const options = field.groups?.flatMap(group => group.options) || field.options;
        if (options && value) { for (const option of Array.isArray(value) ? value : [value]) expect(options).toContain(option); }
        if (field.type === 'slider') { expect(value).toBeGreaterThanOrEqual(field.min); expect(value).toBeLessThanOrEqual(field.max); }
      }
    }
  }
});
test('a character type preserves heritage, cast and unrelated settings', () => {
  const current = { ...DEFAULT_DNA, identity: { ...DEFAULT_DNA.identity, ethnicity: 'japanese', name: 'My character' }, scenario: { ...DEFAULT_DNA.scenario, cast_size: '2', cast_type: 'couple' }, camera: { ...DEFAULT_DNA.camera, lens: '85mm' } };
  const result = applyCharacterTypePreset(current, CHARACTER_TYPE_PRESETS.find(p => p.name === 'Mature'));
  expect(result.identity).toMatchObject({ ethnicity: 'japanese', name: 'My character', age: 50 });
  expect(result.scenario).toEqual(current.scenario); expect(result.camera).toEqual(current.camera);
  expect(current.identity.age).toEqual(DEFAULT_DNA.identity.age);
});
test('uniform presets clear prior wardrobe conflicts and enhanced looks keep skin realistic', () => {
  const result = applyCharacterTypePreset({ ...DEFAULT_DNA, wardrobe: { ...DEFAULT_DNA.wardrobe, exposure_mode: 'nude', outfit_preset: 'nude', top: 'corset', underwear: 'thong' } }, CHARACTER_TYPE_PRESETS.find(p => p.name === 'Maid'));
  expect(result.wardrobe).toMatchObject({ exposure_mode: 'use selected outfit', outfit_preset: '', top: '', underwear: '', outfit_set: 'classic maid dress with lace headpiece, stockings and pumps' });
  const cosmetic = CHARACTER_TYPE_PRESETS.find(p => p.name === 'Plastic glamour');
  expect(cosmetic.dna.skin.texture).toBe('natural pores'); expect(cosmetic.dna.style.render).toBe('photorealistic');
  expect(cosmetic.dna.style.anatomy_mode).toBe('enhanced');
});
