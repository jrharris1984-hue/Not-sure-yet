import { SECTIONS, PHASES } from './dna';
import { resolveBuilderControls, sliderPromptSignature } from './builderControlResolution';
import { compileModelPrompts } from './modelPromptCompilers';
const families = ['chroma', 'krea2', 'zimage', 'pony', 'sdxl', 'flux2_klein'];
const base = () => ({ identity: { age: 30, gender: 'female' }, physique: {}, skin: {}, pose: { distance: 'full body', focus: 'full frame' }, feet: {}, wardrobe: {}, scene: {}, camera: {} });
test.each(families)('%s keeps supporting pedicure without competing close-up', promptStyle => {
  const dna = base(); dna.feet = { pedicure: 'painted red', framing: 'sole close-up', composition_mode: 'supporting detail' };
  const { positive, guardAdjustments } = compileModelPrompts({ dna, promptStyle });
  expect(positive).toMatch(/full character|full.length|head.to.feet/i);
  expect(positive).toMatch(/painted red|red.paint/i);
  expect(positive).not.toContain('sole close-up');
  expect(positive).not.toContain('PRIMARY FEET COMPOSITION');
  expect(guardAdjustments.join(' ')).toContain('Pose & framing controls the crop');
});
test.each(families)('%s uses an explicit foot crop instead of full-body framing', promptStyle => {
  const dna = base(); dna.feet = { composition_mode: 'feet focus', framing: 'pedicure close-up', pedicure: 'painted pink' };
  const { positive } = compileModelPrompts({ dna, promptStyle });
  expect(positive).toContain('pedicure close-up');
  expect(positive).not.toMatch(/full character visible head to feet|Full-length photograph/);
});
test('opaque socks and closed footwear hide details while leaving saved selections intact', () => {
  const dna = base(); dna.wardrobe = { footwear: 'boots', hosiery_type: 'opaque tights' };
  dna.feet = { foot_state: ['bare'], pedicure: 'painted pink', sole_texture: 'smooth soles' };
  const original = JSON.stringify(dna);
  const result = resolveBuilderControls(dna);
  expect(result.dna.feet.pedicure).toBe('');
  expect(result.dna.feet.foot_state).toEqual([]);
  expect(result.notes.some(note => note.text.includes('Hidden'))).toBe(true);
  expect(JSON.stringify(dna)).toBe(original);
});
test('shared wardrobe hosiery wins over feet fallback; bare feet stay bare', () => {
  const dna = base(); dna.wardrobe.hosiery_type = 'pantyhose'; dna.feet.hosiery = 'ankle socks';
  expect(resolveBuilderControls(dna).dna.feet.hosiery).toBe('');
  const bare = base(); bare.feet = { hosiery: 'bare', foot_state: ['bare'] };
  expect(resolveBuilderControls(bare).dna.feet.foot_state).toEqual(['bare']);
});
test('preserves compatible front/low camera choices but removes opposing heights', () => {
  const dna = base(); dna.pose.angle = 'front'; dna.camera.angle = 'low';
  expect(resolveBuilderControls(dna).dna.camera.angle).toBe('low');
  dna.pose.angle = 'from above';
  expect(resolveBuilderControls(dna).dna.camera.angle).toBe('');
});
test('detailed garment, skin finish and environment choices override conflicting presets', () => {
  const dna = base();
  dna.wardrobe = { outfit_set: 'matching suit', outfit_preset: 'casual', dress_style: 'evening gown', skirt_style: 'mini skirt', top: 'blouse', bottom: 'jeans' };
  dna.skin = { texture: 'matte', glow: 81 };
  dna.scene = { environment: 'beach', indoor_outdoor: 'indoor' };
  const result = resolveBuilderControls(dna).dna;
  expect(result.wardrobe.outfit_set).toBe(''); expect(result.wardrobe.top).toBe(''); expect(result.wardrobe.skirt_style).toBe('');
  expect(result.skin.texture).toBe(''); expect(result.scene.indoor_outdoor).toBe('');
});
test('normalizes incompatible imported foot states and toe movements', () => {
  const dna = base(); dna.feet = { toes: ['toe curl', 'toe spread', 'toe ring'], foot_state: ['dirty', 'freshly washed'] };
  const result = resolveBuilderControls(dna).dna;
  expect(result.feet.toes).toEqual(['toe spread', 'toe ring']);
  expect(result.feet.foot_state).toEqual(['freshly washed']);
});
const sliders = SECTIONS.flatMap(section => section.fields.filter(field => field.type === 'slider' && field.key !== 'cast_age_gap').map(field => [section.key, field]));
test.each(families)('%s reflects each legal slider step and its reversal in the final prompt', promptStyle => {
  for (const [section, field] of sliders) {
    const dna = base();
    const start = field.key === 'age' ? 30 : field.key === 'implant_volume' ? 450 : 40;
    dna[section] ||= {}; dna[section][field.key] = start;
    const before = compileModelPrompts({ dna, promptStyle }).positive;
    dna[section][field.key] = start + (field.step || 1);
    const after = compileModelPrompts({ dna, promptStyle }).positive;
    expect(after).not.toBe(before);
    expect(after).toContain(sliderPromptSignature(resolveBuilderControls(dna).dna));
    dna[section][field.key] = start;
    expect(compileModelPrompts({ dna, promptStyle }).positive).toBe(before);
  }
});
test('inactive size controls do not fight implant priority', () => {
  const dna = base(); dna.physique = { implant_volume: 1000, bust_scale: 80 };
  expect(sliderPromptSignature(dna)).not.toContain('bust size');
  expect(sliderPromptSignature(dna)).toContain('implant visual size 1000/5000');
});
test('Feet belongs to the body group, outside Intimate', () => {
  expect(PHASES.find(group => group.key === 'body').sections).toContain('feet');
  expect(PHASES.find(group => group.key === 'intimate').sections).not.toContain('feet');
});

test.each(families)('%s reflects age-gap changes through the actual cast ages', promptStyle => {
  const a = base(); a.identity.age = 35; a.scenario = { cast_age_mode: 'age contrast', cast_age_gap: 10, cast_size: 'duo' };
  const b = base();
  const subjects = [{ label: 'A', dna: a }, { label: 'B', dna: b }];
  const before = compileModelPrompts({ subjects, dna: a, promptStyle }).positive;
  a.scenario.cast_age_gap = 11;
  const after = compileModelPrompts({ subjects, dna: a, promptStyle }).positive;
  expect(before).toContain('45-year-old'); expect(after).toContain('46-year-old');
  expect(after).not.toBe(before);
});

 test.each(['footless tights', 'toeless tights', 'ultra-sheer tights', 'fishnet tights'])('%s keeps visible foot details', hosiery_type => {
  const dna = base(); dna.wardrobe = { hosiery_type }; dna.feet.pedicure = 'painted red';
  expect(resolveBuilderControls(dna).dna.feet.pedicure).toBe('painted red');
});
test('pointed-toe stilettos hide the pedicure', () => {
  const dna = base(); dna.wardrobe.heel_type = 'pointed-toe stilettos'; dna.feet.pedicure = 'painted red';
  expect(resolveBuilderControls(dna).dna.feet.pedicure).toBe('');
});
test('every step across each active slider range has a distinct signature', () => {
  for (const [section, field] of sliders) {
    let previous;
    for (let value = field.min; value <= field.max; value += field.step || 1) {
      const dna = base(); dna[section] ||= {}; dna[section][field.key] = value;
      const signature = sliderPromptSignature(dna);
      if (previous !== undefined) expect(signature).not.toBe(previous);
      previous = signature;
    }
  }
});

test.each(families)('%s does not restore hidden feet details in the final fidelity pass', promptStyle => {
  const dna = base(); dna.feet = { composition_mode: 'supporting detail', pedicure: 'painted red', sole_texture: 'smooth soles' };
  dna.wardrobe = { footwear: 'combat boots', hosiery_type: 'opaque tights' };
  const { positive } = compileModelPrompts({ dna, promptStyle });
  expect(positive).not.toContain('painted red');
  expect(positive).not.toContain('smooth soles');
  expect(positive).toContain('combat boots');
});

test('platform footwear suppresses hidden sole texture and conflicting toe positioning', () => {
  const dna=base();dna.pose.action='bending over';dna.hair={length:'short bob',style:'chignon'};
  dna.wardrobe.footwear='platform heels';
  dna.feet={composition_mode:'supporting detail',toes:['toe point','toe ring'],sole_texture:'water droplets on soles',arch:'defined arch',pedicure:'natural nails',pedicure_art:'matte polish'};
  const {dna:resolved,notes}=resolveBuilderControls(dna);
  expect(resolved.feet.sole_texture).toBe('');expect(resolved.feet.arch).toBe('');
  expect(resolved.feet.toes).toEqual(['toe ring']);expect(resolved.feet.pedicure_art).toBe('');
  expect(resolved.hair.length).toBe('');expect(resolved.hair.style).toBe('chignon');
  expect(dna.feet.sole_texture).toBe('water droplets on soles');expect(notes.length).toBeGreaterThan(0);
});

test('supporting foot fallback follows the subject and uses clear foot-size language', () => {
  const dna=base();dna.style={anatomy_mode:'extreme'};dna.feet={composition_mode:'supporting detail',foot_size:'size queen',toenail_shape:'short rounded'};
  const {positive}=compileModelPrompts({dna,promptStyle:'chroma'});
  expect(positive.indexOf('Foot details:')).toBeGreaterThan(positive.indexOf('subject:'));
  expect(positive).toContain('very large feet');expect(positive).not.toContain('size queen');
});
