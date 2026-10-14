import { resolveWardrobeLayers, wardrobeLayerGuidance } from './wardrobeLayers';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolveBuilderControls } from './builderControlResolution';

const character = () => ({ identity: { age: 40, gender: 'female' }, physique: { hips: 'wide hips', waist: 'narrow waist' },
  pose: { distance: 'full body' }, wardrobe: { outfit_mode: 'custom', top: 'cotton blouse', bottom: 'tailored trousers',
    underwear: 'lace bra and matching briefs', hosiery_type: 'sheer stockings', exposure_mode: 'use selected outfit' },
  intimate: { nipple_size: 'HIDDEN_UPPER_MARKER', pussy: 'HIDDEN_LOWER_MARKER' } });

test('layer order preserves body shape and classifies independent underwear, hosiery and outer garments', () => {
  const source = character(), before = JSON.stringify(source), plan = resolveWardrobeLayers(source);
  expect(plan.layers.map(layer => layer.key)).toEqual(['character', 'underwear', 'outer']);
  expect(plan.layers[0].proportions).toEqual(source.physique);
  expect(plan.layers[1].items.map(item => item.text)).toEqual(['lace bra', 'matching briefs', 'sheer stockings']);
  expect(plan.layers[2].items.map(item => item.text)).toEqual(['cotton blouse', 'tailored trousers']);
  expect(plan.covered).toEqual({ upper: true, lower: true });
  expect(JSON.stringify(source)).toBe(before);
});
test('opening outer garments reveals covering underwear rather than hidden body surfaces', () => {
  const source = character(); source.wardrobe.exposure_mode = 'custom_coverage_unzipped';
  const plan = resolveWardrobeLayers(source);
  expect(plan.outerCoverage).toEqual({ upper: false, lower: false });
  expect(plan.underwearCoverage).toEqual({ upper: true, lower: true });
  expect(plan.trousersRemain).toBe(true);
  expect(wardrobeLayerGuidance(plan)).toContain('trousers stay on the legs');
});
test('stocking transparency does not invalidate opaque underwear in the same ensemble', () => {
  const source = character(); source.wardrobe.underwear = 'cotton bra and opaque briefs with sheer stockings';
  source.wardrobe.exposure_mode = 'custom_coverage_unbuttoned';
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: true, lower: true });
});
test('transparent underwear is covered by an opaque outer layer', () => {
  const source = character(); source.wardrobe.underwear = 'sheer bra and transparent briefs';
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: true, lower: true });
  source.wardrobe.exposure_mode = 'custom_coverage_unzipped';
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: false, lower: false });
});
test('skirts keep underwear and hosiery underneath without becoming trousers', () => {
  const source = character(); source.wardrobe.bottom = 'pencil skirt';
  const text = wardrobeLayerGuidance(resolveWardrobeLayers(source));
  expect(text).toContain('selected skirt remains the outer layer');
  expect(text).not.toContain('selected trousers');
});
test('disabled full-set underwear does not activate a saved layer', () => {
  const source = character(); source.wardrobe = { outfit_mode: 'full', outfit_set: 'pantsuit', set_lingerie_mode: 'none', set_lingerie: 'bra and briefs', exposure_mode: 'custom_coverage_unzipped' };
  expect(resolveWardrobeLayers(source).layers[1].items).toEqual([]);
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: false, lower: false });
});
test('explicit removal coverage stays authoritative and does not restore removed garments', () => {
  for (const selection of ['custom_coverage_topless','custom_coverage_bottomless','nude']) {
    const source = character(); source.wardrobe.exposure_mode = selection;
    const resolved = resolveBuilderControls(source).dna, plan = resolveWardrobeLayers(resolved);
    if (selection.includes('topless')) expect(plan.covered.upper).toBe(false);
    if (selection.includes('bottomless')) expect(plan.covered.lower).toBe(false);
    if (selection === 'nude') {
      expect(plan.layers[1].items).toEqual([]); expect(plan.layers[2].items).toEqual([]);
      expect(wardrobeLayerGuidance(plan)).toBe('');
    }
  }
});
test('unknown custom wording is retained without guessed coverage', () => {
  const source = character(); source.wardrobe = { top: 'custom garment phrase', underwear: 'custom layer phrase' };
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: false, lower: false });
  expect(resolveWardrobeLayers(source).layers[1].items[0].text).toBe('custom layer phrase');
});
for (const promptStyle of ['standard','chroma','krea2','pony','sdxl','qwen_image','qwen_rapid','zimage','flux2_klein']) {
  test.each(['compact','detailed'])(`${promptStyle} %s shares layer visibility and retains body shape`, promptFormat => {
    const source = character(), before = JSON.stringify(source);
    const result = compileModelPrompts({ dna: source, promptStyle, promptFormat });
    expect(result.positive).not.toMatch(/HIDDEN_UPPER_MARKER|HIDDEN_LOWER_MARKER/);
    expect(result.positive).toContain('wide hips');
    expect(result.positive).toContain('hosiery does not replace the trousers');
    expect(result.positive).toContain('covered portions are concealed by the outer fabric');
    expect(result.wardrobeLayers[0].covered).toEqual({ upper: true, lower: true });
    expect(JSON.stringify(source)).toBe(before);
  });
}

test('layer transparency is regional and does not leak between underwear components', () => {
  const source = character(); source.wardrobe.underwear = 'cotton bra and sheer briefs'; source.wardrobe.exposure_mode = 'custom_coverage_unzipped';
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: true, lower: false });
});
test('hosiery guidance never invents a garter belt or stockings for selected socks', () => {
  const source = character(); source.wardrobe.hosiery_type = 'ankle socks';
  const text = wardrobeLayerGuidance(resolveWardrobeLayers(source));
  expect(text).toContain('selected hosiery underneath the trousers');
  expect(text).not.toMatch(/garter|stockings/);
});
test('negative custom garment wording is not interpreted as covering underwear', () => {
  const source = character(); source.wardrobe.underwear = 'no bra and no briefs'; source.wardrobe.exposure_mode = 'custom_coverage_unzipped';
  expect(resolveWardrobeLayers(source).covered).toEqual({ upper: false, lower: false });
});
test('cast layer guidance and visibility remain scoped to each character', () => {
  const a = character(), b = character(); b.wardrobe.bottom = 'pencil skirt'; b.wardrobe.top = 'sheer blouse'; b.wardrobe.underwear = '';
  const result = compileModelPrompts({ subjects: [{ label: 'A', dna: a }, { label: 'B', dna: b }], promptStyle: 'chroma', promptFormat: 'compact' });
  expect(result.wardrobeLayers[0].covered).toEqual({ upper: true, lower: true });
  expect(result.wardrobeLayers[1].covered).toEqual({ upper: false, lower: true });
  expect(result.positive).toContain('Wardrobe layers for Subject B:');
  expect(result.positive).toContain('selected skirt remains the outer layer');
  expect(b.wardrobe.bottom).toBe('pencil skirt');
});

test('a negated hosiery description does not create stockings under trousers', () => {
  const source = character(); source.wardrobe.hosiery_type = 'no stockings';
  expect(resolveWardrobeLayers(source).stockingsUnderTrousers).toBe(false);
  expect(wardrobeLayerGuidance(resolveWardrobeLayers(source))).not.toContain('selected hosiery underneath');
});
