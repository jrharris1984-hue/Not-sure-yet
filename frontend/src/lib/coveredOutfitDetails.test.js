import { concealedAnatomyFields, hasCoveringOuterOutfit } from './coveredOutfitDetails';
import { resolveBuilderControls } from './builderControlResolution';
import { compileModelPrompts } from './modelPromptCompilers';

const pantsuit = () => ({ identity: { age: 30, gender: 'female' },
  wardrobe: { outfit_mode: 'full', outfit_set: 'tailored women’s pantsuit with a matching blouse, handbag and pumps', exposure_mode: 'use selected outfit' },
  intimate: { pubic_hair: 'landing strip', pussy: 'small labia', clit: 'subtle', asshole: 'trimmed',
    nipple_size: 'large', areola_color: 'pink', piercings: ['nose', 'nipple'] },
  pose: { distance: 'full body' } });

test('a covering outfit omits concealed anatomy without changing the saved character', () => {
  const source = pantsuit(), original = JSON.stringify(source);
  const { dna, notes } = resolveBuilderControls(source);
  for (const field of ['pubic_hair','pussy','clit','asshole','nipple_size','areola_color']) expect(dna.intimate[field]).toBe('');
  expect(dna.intimate.piercings).toEqual(['nose']);
  expect(dna.wardrobe.outfit_set).toContain('pantsuit');
  expect(notes.some(note => note.section === 'intimate' && note.text.includes('Hidden'))).toBe(true);
  expect(JSON.stringify(source)).toBe(original);
});

test('unknown custom clothing is not assigned inferred coverage', () => {
  expect(hasCoveringOuterOutfit({ wardrobe: { outfit_preset: 'custom outfit' } })).toBe(false);
  expect(hasCoveringOuterOutfit({ wardrobe: {} })).toBe(false);
  expect(hasCoveringOuterOutfit({ wardrobe: { outfit_preset: 'sheer pantsuit' } })).toBe(false);
  expect(hasCoveringOuterOutfit({ wardrobe: { outfit_preset: 'tailored pantsuit', state: 'open' } })).toBe(false);
});

test('expanded catalog wording is also checked for transparent clothing', () => {
  const source = { wardrobe: { outfit_preset: 'tailored pantsuit with transparent mesh panels' },
    _catalogSelections: { wardrobe: { outfit_preset: 'tailored pantsuit' } } };
  expect(hasCoveringOuterOutfit(source)).toBe(false);
});

test.each(['qwen_rapid','qwen_image','chroma','krea2','zimage','sdxl','pony','flux2_klein'])('%s suppresses hidden tags in detailed and compact output', promptStyle => {
  for (const promptFormat of ['detailed','compact','scene']) {
    const { positive } = compileModelPrompts({ dna: pantsuit(), promptStyle, promptFormat, workflowKind: 'image' });
    expect(positive).toMatch(/pantsuit/);
    expect(positive).not.toMatch(/landing strip|small labia|subtle clit|trimmed asshole|large nipple|pink areola/i);
  }
});

test('coverage is resolved independently for each clothed subject', () => {
  const a = pantsuit(), b = pantsuit(); b.identity.age = 72;
  const { positive } = compileModelPrompts({ dna: a, subjects: [{label:'A',dna:a},{label:'B',dna:b}],
    promptStyle: 'qwen_rapid', promptFormat: 'compact', workflowKind: 'image' });
  expect(positive).toContain('Subject A'); expect(positive).toContain('Subject B');
  expect(positive).toContain('72-year-old');
  expect(positive).not.toMatch(/landing strip|labia|trimmed asshole/i);
});

test.each(['pants', 'skirt', 'jeans', 'shorts'])('%s hides lower surface details and retains upper visibility and shape', bottom => {
  const source = { wardrobe: { outfit_mode: 'custom', bottom }, physique: { hips: 'wide', waist: 'narrow' }, intimate: { nipple_size: 'small', pussy: 'custom_surface_detail' } };
  const before = JSON.stringify(source);
  const resolved = resolveBuilderControls(source).dna;
  expect(resolved.intimate.pussy).toBe('');
  expect(resolved.intimate.nipple_size).toBe('small');
  expect(resolved.physique).toEqual(source.physique);
  expect(JSON.stringify(source)).toBe(before);
});
test('a covering blouse hides upper surface details independently of lower clothing', () => {
  const fields = concealedAnatomyFields({ wardrobe: { top: 'cotton blouse' } });
  expect(fields).toContain('nipple_size'); expect(fields).not.toContain('pubic_hair');
});
test.each(['topless', 'bottomless', 'nude'])('explicit %s coverage stays authoritative', exposure_mode => {
  const fields = concealedAnatomyFields({ wardrobe: { top: 'blouse', bottom: 'pants', exposure_mode: exposure_mode === 'nude' ? 'nude' : `custom_coverage_${exposure_mode}` } });
  if (exposure_mode === 'topless') expect(fields).not.toContain('nipple_size');
  if (exposure_mode === 'bottomless') expect(fields).not.toContain('pubic_hair');
  if (exposure_mode === 'nude') expect(fields).toEqual([]);
});
test('transparent and unknown garments do not imply concealment', () => {
  expect(concealedAnatomyFields({ wardrobe: { top: 'sheer blouse', bottom: 'transparent skirt' } })).toEqual([]);
  expect(concealedAnatomyFields({ wardrobe: { top: 'custom_unknown' } })).toEqual([]);
});
