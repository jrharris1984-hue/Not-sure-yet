import { ADDITIONAL_OUTFIT_GROUPS, OUTFIT_SET_LABELS } from './completeOutfitSets';
import { wardrobeMode, wardrobeFieldDisabled, selectWardrobeMode, editWardrobeField, resolveWardrobeMode } from './wardrobeMode';
import { DEFAULT_DNA, SECTIONS, buildPrompts } from './dna';
import { resolveBuilderControls } from './builderControlResolution';
import { compileModelPrompts } from './modelPromptCompilers';
const outfit = ADDITIONAL_OUTFIT_GROUPS[0].options[0];
const outerSet = 'tailored women’s pantsuit with a matching blouse, handbag and pumps';

test('underneath lingerie can be disabled and restored without losing the saved selection', () => {
  const original={outfit_mode:'full',outfit_set:outerSet,set_lingerie:'saved lingerie choice',exposure_mode:'lingerie showing'};
  const disabled=editWardrobeField(original,'set_lingerie_mode','none');
  expect(disabled.exposure_mode).toBe('use selected outfit');
  expect(disabled.set_lingerie).toBe('saved lingerie choice');
  expect(wardrobeFieldDisabled('set_lingerie',disabled)).toBe(true);
  expect(wardrobeFieldDisabled('set_lingerie_mode',disabled)).toBe(false);
  expect(editWardrobeField(disabled,'exposure_mode','lingerie only')).toBe(disabled);
  expect(resolveWardrobeMode(disabled)).toMatchObject({outfit_set:outerSet,set_lingerie:'',underwear:''});
  const enabled=editWardrobeField(disabled,'set_lingerie_mode','matching');
  expect(resolveWardrobeMode(enabled).set_lingerie).toBe('saved lingerie choice');
  expect(wardrobeFieldDisabled('set_lingerie',enabled)).toBe(false);
  expect(wardrobeFieldDisabled('set_lingerie_mode',{outfit_mode:'custom'})).toBe(true);
  expect(editWardrobeField({...disabled,outfit_mode:'custom'},'exposure_mode','lingerie only').exposure_mode).toBe('lingerie only');
  expect(original.exposure_mode).toBe('lingerie showing');
});

test.each(['chroma','krea2','standard','pony','sdxl','qwen_image','wan_t2v'])('%s keeps the outer set when an imported recipe disables its lingerie layer', promptStyle => {
  const dna={...DEFAULT_DNA,wardrobe:{outfit_mode:'full',outfit_set:outerSet,set_lingerie_mode:'none',set_lingerie:'stored lace lingerie',exposure_mode:'lingerie only'}};
  const result=compileModelPrompts({promptStyle,dna});
  expect(result.positive).toContain('pantsuit');
  expect(result.positive).not.toMatch(/matching satin bra|stored lace lingerie|lingerie only|reveal lingerie/);
  expect(dna.wardrobe.set_lingerie).toBe('stored lace lingerie');
});

test('disabling the extra layer preserves a lingerie set worn as the main outfit', () => {
  const value={outfit_mode:'full',outfit_set:outfit,set_lingerie_mode:'none',exposure_mode:'use selected outfit'};
  expect(resolveWardrobeMode(value).outfit_set).toBe(outfit);
  const uniform={outfit_set:'French maid dress with apron, matching lingerie, stockings and heels',set_lingerie_mode:'none'};
  expect(resolveWardrobeMode(uniform).outfit_set).toBe('French maid dress with apron, stockings and heels');
});
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
test.each(['chroma', 'krea2', 'standard'])('%s compact prompts resolve pantsuit and visible garter-stockings into separate garments', promptStyle => {
  const dna = {
    ...DEFAULT_DNA,
    wardrobe: {
      outfit_mode: 'full',
      outfit_set: outerSet,
      outfit_set_color: 'ivory',
      set_lingerie_mode: 'matching',
      set_lingerie: 'satin balconette bra and matching high-waisted briefs with garter belt, stockings and pumps',
      exposure_mode: 'lingerie showing',
    },
  };
  const positive = compileModelPrompts({ promptStyle, dna, promptFormat: 'compact' }).positive;
  expect(positive).toContain('tailored blazer worn open over the selected lingerie');
  expect(positive).toContain('no blouse, no trousers or pants');
  expect(positive).toContain('stockings ending clearly at the upper thighs');
  expect(positive).toContain('visible bare skin between the stocking tops and the briefs');
  expect(positive).not.toContain('tailored women’s pantsuit');
  expect(positive.match(/satin balconette bra and matching high-waisted briefs with garter belt, stockings and pumps/g) || []).toHaveLength(1);
});

