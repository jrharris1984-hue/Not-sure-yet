import { wardrobeExposure, wardrobeNudity, EXPOSURE_CHOICES } from './wardrobeNudity';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolveBuilderControls } from './builderControlResolution';
import { DEFAULT_DNA, SECTIONS, randomizeSection } from './dna';

const families = ['sdxl', 'pony', 'chroma', 'zimage', 'krea2', 'flux2_klein', 'wan_t2v'];
const base = wardrobe => ({ ...DEFAULT_DNA, identity: { ...DEFAULT_DNA.identity, age: 35 }, wardrobe });

test.each([[0, 'use selected outfit'], [20, 'slightly revealing'], [35, 'revealing outfit'], [60, 'partially nude'], [100, 'nude']])('saved exposure %i migrates to %s', (nudity_level, expected) => {
  expect(wardrobeExposure({ nudity_level })).toBe(expected);
});

test('saved keep-lingerie choice maps to open outfit, and explicit choice overrides old values', () => {
  expect(wardrobeExposure({ nudity_level: 100, nudity_outfit: 'keep lingerie', outfit_preset: 'playboy bunny' }))
    .toBe('open or shifted outfit');
  expect(wardrobeNudity({ exposure_mode: 'use selected outfit', nudity_level: 100 }).suppressClothing).toBe(false);
});

test.each(families)('%s preserves the selected costume in open outfit mode', promptStyle => {
  const { positive } = compileModelPrompts({ promptStyle, dna: base({ exposure_mode: 'open or shifted outfit', outfit_preset: 'playboy bunny' }) });
  expect(positive).toMatch(/playboy bunny/i);
  expect(positive).toContain('worn open or shifted');
  expect(positive).not.toContain('fully nude');
});

test.each(families)('%s uses named coverage without numeric exposure or conflicting clothing', promptStyle => {
  const dna = base({ exposure_mode: 'nude', nudity_level: 90, outfit_set: 'royal princess gown with matching jewelry, veil and heels', state: 'fully clothed' });
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).toContain('fully nude');
  expect(positive).not.toMatch(/princess gown|fully clothed|wardrobe exposure|90\/100/);
  expect(dna.wardrobe.outfit_set).toContain('princess gown');
});

test('named coverage takes precedence over contradictory Bare presets', () => {
  const dna = base({ exposure_mode: 'revealing outfit', outfit_preset: 'nude' });
  const result = resolveBuilderControls(dna);
  expect(result.dna.wardrobe.outfit_preset).toBe('');
  expect(result.notes.some(note => /Bare preset/.test(note.text))).toBe(true);
  expect(dna.wardrobe.outfit_preset).toBe('nude');
});

test('open outfit respects garment priority and explains a missing outfit', () => {
  const source = base({ exposure_mode: 'open or shifted outfit', outfit_set: 'maid outfit', top: 'corset', state: 'fully clothed' });
  const result = resolveBuilderControls(source);
  expect(result.dna.wardrobe.outfit_set).toBe('');
  expect(result.dna.wardrobe.top).toBe('corset');
  expect(result.dna.wardrobe.state).toBe('');
  expect(resolveBuilderControls(base({ exposure_mode: 'open or shifted outfit' })).notes.some(note => /Choose an outfit/.test(note.text))).toBe(true);
});

test('named control replaces the slider and stays protected from randomize', () => {
  const fields = SECTIONS.find(section => section.key === 'wardrobe').fields;
  expect(fields.some(field => ['nudity_level', 'nudity_outfit'].includes(field.key))).toBe(false);
  expect(fields.find(field => field.key === 'exposure_mode').options).toEqual(EXPOSURE_CHOICES);
  expect(randomizeSection('wardrobe', { exposure_mode: 'revealing outfit' }).exposure_mode).toBe('revealing outfit');
});

test('each subject keeps its own clothing coverage', () => {
  const a = base({ exposure_mode: 'nude', outfit_preset: 'streetwear' });
  const b = base({ exposure_mode: 'use selected outfit', outfit_preset: 'tailored pantsuit' });
  const { positive } = compileModelPrompts({ promptStyle: 'krea2', dna: a, subjects: [{ label: 'A', dna: a }, { label: 'B', dna: b }], isMulti: true });
  expect(positive).toContain('Subject A wardrobe: fully nude');
  expect(positive).toContain('Subject B wardrobe: tailored pantsuit');
  expect(positive).not.toContain('streetwear');
});

test.each(families)('%s transitions from an outer outfit with visible lingerie to lingerie only', promptStyle => {
  const wardrobe = { outfit_preset: 'tailored pantsuit', underwear: 'lace panties', top: 'blouse', bottom: 'jeans', state: 'fully clothed' };
  const showing = compileModelPrompts({ promptStyle, dna: base({ ...wardrobe, exposure_mode: 'lingerie showing' }) }).positive;
  expect(showing).toContain('lingerie underneath');
  expect(showing).toMatch(/blouse/i);
  expect(showing).not.toContain('fully clothed');
  const only = compileModelPrompts({ promptStyle, dna: base({ ...wardrobe, exposure_mode: 'lingerie only' }) }).positive;
  expect(only).toContain('lingerie only');
  expect(only).toMatch(/lace panties/i);
  expect(only).not.toMatch(/blouse|jeans|tailored pantsuit|fully clothed/i);
  expect(wardrobe.top).toBe('blouse');
});

test('lingerie stage preserves an existing lingerie set or supplies an explicit default', () => {
  const selected = resolveBuilderControls(base({ exposure_mode: 'lingerie only', outfit_set: 'lace lingerie set', top: 'blouse' }));
  expect(selected.dna.wardrobe.outfit_preset).toBe('lace lingerie set');
  const fallback = resolveBuilderControls(base({ exposure_mode: 'lingerie only', outfit_preset: 'tailored pantsuit' }));
  expect(fallback.dna.wardrobe.outfit_preset).toBe('lace lingerie set');
  expect(fallback.notes.some(note => note.text.includes('until you select'))).toBe(true);
});
