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
    if (field.key === "age") expect(after).toContain(`${start + (field.step || 1)}-year-old`);
    else for (const signature of sliderPromptSignature(resolveBuilderControls(dna).dna).split(", ").filter(value => !value.startsWith("age "))) expect(after).toContain(signature);
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
  expect(resolved.feet.toes).toEqual([]);expect(resolved.feet.pedicure_art).toBe('');
  expect(resolved.hair.length).toBe('');expect(resolved.hair.style).toBe('chignon');
  expect(dna.feet.sole_texture).toBe('water droplets on soles');expect(notes.length).toBeGreaterThan(0);
});

test('supporting foot fallback follows the subject and uses clear foot-size language', () => {
  const dna=base();dna.style={anatomy_mode:'extreme'};dna.feet={composition_mode:'supporting detail',foot_size:'size queen',toenail_shape:'short rounded'};
  const {positive}=compileModelPrompts({dna,promptStyle:'chroma'});
  expect(positive.indexOf('Foot details:')).toBeGreaterThan(positive.indexOf('subject:'));
  expect(positive).toContain('very large feet');expect(positive).not.toContain('size queen');
});

test.each(families)('%s keeps the body pose when a foot pose requests a different stance', promptStyle => {
  const dna = base();
  dna.pose.action = 'sitting on edge';
  dna.feet = { composition_mode: 'feet focus', framing: 'full body', foot_pose: 'walking barefoot' };
  const original = JSON.stringify(dna);
  const resolved = resolveBuilderControls(dna);
  expect(resolved.dna.pose.action).toBe('sitting on edge');
  expect(resolved.dna.feet.foot_pose).toBe('');
  expect(compileModelPrompts({ dna, promptStyle }).positive).not.toContain('walking barefoot');
  expect(JSON.stringify(dna)).toBe(original);
});

test('weight-bearing poses omit competing sole presentation and under-sole framing', () => {
  const dna = base(); dna.pose.action = 'squatting spread';
  dna.feet = { composition_mode: 'feet focus', framing: 'POV under foot', sole_presentation: 'both soles toward camera', foot_pose: 'soles facing lens' };
  const resolved = resolveBuilderControls(dna);
  expect(resolved.dna.pose.action).toBe('squatting spread');
  expect(resolved.dna.feet).toMatchObject({ sole_presentation: '', foot_pose: '', framing: '' });
  expect(resolved.notes.some(note => note.field === 'sole_presentation')).toBe(true);
});

test('compatible seated sole presentation remains available', () => {
  const dna = base(); dna.pose.action = 'sitting on edge';
  dna.feet = { composition_mode: 'feet focus', sole_presentation: 'both soles toward camera', foot_pose: 'soles facing lens', framing: 'sole close-up' };
  expect(resolveBuilderControls(dna).dna.feet).toEqual(dna.feet);
});

test.each([
  ['beach', 'polished wood floor', ''], ['bedroom', 'warm sand', ''],
  ['beach', 'warm sand', 'warm sand'], ['studio', 'tile floor', 'tile floor'],
  ['', 'shallow water', 'shallow water'],
])('scene %s resolves surface %s conservatively', (environment, ground_surface, expected) => {
  const dna = base(); dna.scene.environment = environment;
  dna.feet = { composition_mode: 'feet focus', ground_surface };
  expect(resolveBuilderControls(dna).dna.feet.ground_surface).toBe(expected);
});

test('dangling feet omit the contact surface without changing scene surroundings', () => {
  const dna = base(); dna.pose.action = 'sitting on edge'; dna.scene.environment = 'bedroom';
  dna.feet = { composition_mode: 'feet focus', foot_pose: 'feet dangling', ground_surface: 'soft carpet' };
  const resolved = resolveBuilderControls(dna).dna;
  expect(resolved.feet.ground_surface).toBe('');
  expect(resolved.scene.environment).toBe('bedroom');
});

test.each(families)('%s lets explicit coverage replace embedded outfit footwear and stockings', promptStyle => {
  const dna = base();
  dna.wardrobe = { outfit_set: 'French maid dress with apron, matching lingerie, stockings and heels', footwear: 'barefoot', hosiery_type: 'footless tights' };
  dna.feet = { composition_mode: 'feet focus', framing: 'full body', pedicure: 'painted red', sole_texture: 'natural sole creases' };
  expect(resolveBuilderControls(dna).dna.wardrobe.outfit_set).toBe('French maid dress with apron, matching lingerie');
  const { positive } = compileModelPrompts({ dna, promptStyle });
  expect(positive).toContain('French maid dress');
  expect(positive).toContain('footless tights');
  expect(positive).not.toMatch(/stockings and heels/);
  expect(positive).toContain('painted red');
});

test('coverage included in a complete outfit hides bare-sole details even without separate shoe fields', () => {
  const dna = base(); dna.wardrobe.outfit_set = 'classic maid dress with lace headpiece, stockings and pumps';
  dna.feet = { composition_mode: 'feet focus', sole_texture: 'smooth soles', sole_presentation: 'soles up', pedicure: 'painted red', foot_state: ['bare'] };
  expect(resolveBuilderControls(dna).dna.feet).toMatchObject({ sole_texture: '', sole_presentation: '', pedicure: '', foot_state: [] });
});

test('watersports phase removes instructions that belong to a different moment', () => {
  const dna = base();
  dna.watersports = {
    source: 'self', phase: 'before', stream: 'steady stream', direction: ['on floor'],
    wetness: ['wet floor'], aftermath: ['wet clothes'], liquid_visibility: 'spreading puddle',
    self_aim: 'onto floor near feet', flow_appearance: 'single continuous gravity-driven stream',
    highlight: 'soft side-lit highlights', garment_detail: 'wet jeans', container: 'toilet',
  };
  const resolved = resolveBuilderControls(dna);
  expect(resolved.dna.watersports).toMatchObject({
    source: 'self', phase: 'before', container: 'toilet', stream: '', direction: [], wetness: [],
    aftermath: [], liquid_visibility: '', self_aim: '', flow_appearance: '', highlight: '', garment_detail: '',
  });
  expect(resolved.notes.some(note => note.section === 'watersports' && note.text.includes('Before phase'))).toBe(true);

  dna.watersports = {
    source: 'self', phase: 'afterward', stream: 'gush', direction: ['on floor'],
    self_aim: 'onto floor near feet', flow_appearance: 'thin gentle stream',
    highlight: 'small specular highlights', self_action: 'self urination',
    wetness: ['damp'], aftermath: ['wet clothes'],
  };
  const afterward = resolveBuilderControls(dna).dna.watersports;
  expect(afterward).toMatchObject({
    stream: '', direction: [], self_aim: '', flow_appearance: '', highlight: '', self_action: '',
    wetness: ['damp'], aftermath: ['wet clothes'],
  });
});

test('watersports and feet share one surface and one composition authority', () => {
  const dna = base();
  dna.pose = { action: 'standing', distance: 'full body', focus: 'feet', angle: 'front' };
  dna.feet = { composition_mode: 'feet focus', framing: 'sole close-up', ground_surface: 'warm sand' };
  dna.watersports = { source: 'self', phase: 'afterward', surface: 'white tile', camera_view: 'wide environmental view' };
  const resolved = resolveBuilderControls(dna);
  expect(resolved.dna.feet.ground_surface).toBe('');
  expect(resolved.dna.watersports.camera_view).toBe('');
  expect(resolved.dna.pose.focus).toBe('feet');
  expect(resolved.dna.pose.distance).toBe('detail shot');
  expect(resolved.notes.some(note => note.text.includes('shared floor/ground'))).toBe(true);
  expect(resolved.notes.some(note => note.text.includes('Feet focus controls the crop'))).toBe(true);
});

test('watersports camera and stance replace competing general pose instructions', () => {
  const dna = base();
  dna.pose = { action: 'sitting on edge', distance: 'full body', focus: 'full frame', angle: 'front' };
  dna.camera = { angle: 'eye-level' };
  dna.watersports = {
    source: 'self', phase: 'in progress', stance: 'standing upright',
    camera_view: 'floor-level detail', wetness: ['dry', 'wet floor'], stream: 'steady stream',
  };
  const resolved = resolveBuilderControls(dna).dna;
  expect(resolved.pose.action).toBe('');
  expect(resolved.pose.distance).toBe('detail shot');
  expect(resolved.camera.angle).toBe('low');
  expect(resolved.watersports.wetness).toEqual(['wet floor']);
});

test('turning Watersports source off suppresses saved specialty details in every compiler', () => {
  const dna = base();
  dna.watersports = { source: 'none', stream: 'gush', wetness: ['wet floor'], camera_view: 'floor-level detail' };
  const resolved = resolveBuilderControls(dna).dna;
  expect(resolved.watersports).toMatchObject({ source: 'none', stream: '', wetness: [], camera_view: '' });
  for (const promptStyle of families) {
    const { positive } = compileModelPrompts({ dna, promptStyle });
    expect(positive).not.toMatch(/gush|wet floor|floor-level detail/i);
  }
});

