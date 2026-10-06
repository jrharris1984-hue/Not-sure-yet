import { ADDITIONAL_OUTFIT_GROUPS, OUTFIT_SET_LABELS } from './completeOutfitSets';
import { wardrobeMode, wardrobeFieldDisabled, selectWardrobeMode, editWardrobeField } from './wardrobeMode';
import { DEFAULT_DNA, SECTIONS, buildPrompts } from './dna';
import { resolveBuilderControls } from './builderControlResolution';
import { compileModelPrompts } from './modelPromptCompilers';
const outfit = ADDITIONAL_OUTFIT_GROUPS[0].options[0];
test('adds 75 unique complete sets including 60 decade and modern lingerie sets', () => {
  const options = ADDITIONAL_OUTFIT_GROUPS.flatMap(group => group.options);
  expect(options).toHaveLength(75); expect(new Set(options).size).toBe(75);
  expect(ADDITIONAL_OUTFIT_GROUPS.filter(group => /lingerie/.test(group.name)).flatMap(group => group.options)).toHaveLength(60);
  expect(Object.keys(OUTFIT_SET_LABELS)).toHaveLength(81);
  expect(SECTIONS.find(section => section.key === 'wardrobe').fields.find(field => field.key === 'outfit_set').groups.flatMap(group => group.options)).toEqual(expect.arrayContaining(options));
});
test('selecting a set enters full mode and switching to Custom restores saved pieces', () => {
  const value = { top: 'corset', footwear: 'barefoot', exposure_mode: 'nude' };
  const full = editWardrobeField(value, 'outfit_set', outfit);
  expect(full).toMatchObject({ outfit_mode: 'full', outfit_set: outfit, exposure_mode: 'use selected outfit', top: 'corset' });
  expect(wardrobeFieldDisabled('top', full)).toBe(true); expect(wardrobeFieldDisabled('outfit_set_color', full)).toBe(false);
  expect(editWardrobeField(full, 'top', 'tube top')).toBe(full);
  const custom = selectWardrobeMode(full, 'custom');
  expect(wardrobeFieldDisabled('top', custom)).toBe(false); expect(wardrobeFieldDisabled('outfit_set', custom)).toBe(true);
  const resolved = resolveBuilderControls({ wardrobe: custom }).dna.wardrobe;
  expect(resolved.top).toBe('corset'); expect(resolved.outfit_set).toBe(''); expect(custom.outfit_set).toBe(outfit);
  expect(wardrobeMode({ outfit_set: outfit })).toBe('full');
});
test.each(['chroma', 'krea2', 'flux2_klein', 'standard', 'wan_t2v', 'pony', 'sdxl', 'qwen_image'])('%s submits the full set without stored conflicting wardrobe choices', promptStyle => {
  const wardrobe = { ...DEFAULT_DNA.wardrobe, outfit_mode: 'full', outfit_set: outfit, outfit_set_color: 'red', top: 'corset', bottom: 'denim shorts', underwear: 'thong', footwear: 'barefoot', heel_type: 'combat boots', hosiery_type: 'opaque tights', garment_color: 'blue', exposure_mode: 'use selected outfit' };
  const dna = { ...DEFAULT_DNA, identity: { ...DEFAULT_DNA.identity, age: 30 }, wardrobe, feet: { ...DEFAULT_DNA.feet, hosiery: 'fishnet stockings' } };
  const result = compileModelPrompts({ promptStyle, dna });
  expect(result.positive).toContain('1950s satin bullet bra');
  expect(result.positive).not.toMatch(/denim shorts|combat boots|opaque tights|fishnet stockings|fully nude|barefoot|blue outfit/);
  expect(result.positive).toContain('red'); expect(dna.wardrobe.top).toBe('corset');
});
test('the direct compiler also excludes inactive custom pieces', () => {
  const dna = { ...DEFAULT_DNA, wardrobe: { outfit_mode: 'full', outfit_set: outfit, material: 'latex', fit: 'oversized' } };
  expect(buildPrompts(dna).positive).toContain(outfit);
  expect(buildPrompts(dna).positive).not.toMatch(/latex|oversized fit/);
});

test.each(['chroma', 'krea2', 'standard', 'wan_t2v'])('%s reveals the same matching lingerie layer across coverage stages', promptStyle => {
  const outfit_set = 'tailored women’s pantsuit with a matching blouse, handbag and pumps';
  const dna = { ...DEFAULT_DNA, wardrobe: { outfit_mode: 'full', outfit_set, exposure_mode: 'lingerie showing' } };
  const showing = compileModelPrompts({ promptStyle, dna }).positive;
  expect(showing).toContain('pantsuit'); expect(showing).toContain('matching satin bra and briefs');
  const only = compileModelPrompts({ promptStyle, dna: { ...dna, wardrobe: { ...dna.wardrobe, exposure_mode: 'lingerie only' } } }).positive;
  expect(only).toContain('matching satin bra and briefs'); expect(only).not.toContain('pantsuit');
  const nude = compileModelPrompts({ promptStyle, dna: { ...dna, wardrobe: { ...dna.wardrobe, exposure_mode: 'nude' } } }).positive;
  expect(nude).toContain('fully nude'); expect(nude).not.toMatch(/pantsuit|matching satin bra/);
});
