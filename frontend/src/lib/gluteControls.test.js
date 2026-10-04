import { SECTIONS, DEFAULT_DNA } from './dna';
import { gluteSizePrompt, gluteShapePrompt, buildGlutePrompt, GLUTE_SIZE_MAX } from './gluteControls';
import { compileModelPrompts } from './modelPromptCompilers';

const physique = SECTIONS.find((section) => section.key === 'physique');
const shapes = physique.fields.find((field) => field.key === 'glute_shape').groups.flatMap((group) => group.options);

it('extends glutes to 300 while retaining the existing breast slider ranges', () => {
  expect(physique.fields.find((field) => field.key === 'butt_scale').max).toBe(GLUTE_SIZE_MAX);
  expect(physique.fields.find((field) => field.key === 'bust_scale').max).toBe(100);
  expect(physique.fields.find((field) => field.key === 'implant_volume').max).toBe(5000);
  expect(gluteSizePrompt(0)).toBe('');
  expect(new Set([100, 125, 150, 175, 200].map((value) => gluteSizePrompt(value))).size).toBe(5);
});

it.each(shapes)('keeps %s in the final single-subject Chroma creation prompt', (shape) => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.butt_scale = 100;
  dna.physique.glute_shape = shape;
  const { positive } = compileModelPrompts({ promptStyle: 'chroma', workflowKind: 'image', dna });
  expect(positive).toContain(`GLUTE SHAPE: ${gluteShapePrompt(shape)}`);
  expect(positive).toContain('fantasy-scale extremely oversized glute volume');
});

it('keeps shape authoritative even with no numeric size override', () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.butt_scale = 0;
  dna.physique.glute_shape = 'pronounced upper shelf';
  expect(compileModelPrompts({ promptStyle: 'chroma', dna }).positive).toContain('distinct horizontal upper glute shelf');
});

it.each(['chroma', 'zimage', 'krea2', 'pony', 'sdxl'])('sends extended glute volume to %s rather than silently capping at 100', (promptStyle) => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.butt_scale = 200;
  const high = compileModelPrompts({ promptStyle, workflowKind: 'image', dna }).positive;
  dna.physique.butt_scale = 100;
  const low = compileModelPrompts({ promptStyle, workflowKind: 'image', dna }).positive;
  expect(high).toContain('fantasy-scale extremely oversized with broad rounded volume');
  expect(high).not.toBe(low);
});

it('keeps ordinary Chroma breast volume wording while adding glute shape', () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.bust_scale = 80;
  const before = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  dna.physique.glute_shape = 'high round projection';
  dna.physique.butt_scale = 150;
  const after = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  const breastClause = 'rounded, very strong volume bust (size intensity 80/100)';
  expect(before).toContain(breastClause);
  expect(after).toContain(breastClause);
});

it('gives shape priority over the generic high-size projection cue without changing size or pose', () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.butt_scale = 150;
  dna.physique.hip_scale = 80;
  dna.physique.glute_shape = 'soft pear-shaped';
  dna.pose = { ...dna.pose, distance: 'full body', angle: '3/4', action: 'standing' };
  const pear = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  dna.physique.glute_shape = 'pronounced upper shelf';
  const shelf = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  expect(pear).toContain('broad heavy lower outer fullness');
  expect(shelf).toContain('abrupt rearward step at the top');
  for (const prompt of [pear, shelf]) {
    expect(prompt).toContain(gluteSizePrompt(150, { intensity: true }));
    expect(prompt).toContain('full body, 3/4, standing');
    expect(prompt).not.toContain('extreme rear and lateral projection, clearly visible lower-body volume');
    expect(prompt.indexOf('GLUTE SHAPE:')).toBeLessThan(prompt.indexOf('dramatically wide hips'));
  }
});

it('emits one volume clause and one texture at both ordinary and extended sizes', () => {
  for (const size of [50, 100, 125, 150, 175, 200, 238, 250, 300]) {
    const prompt = buildGlutePrompt({ size, texture: 'smooth', intensity: true });
    expect(prompt).toContain(gluteSizePrompt(size, { intensity: true }));
    expect(prompt.match(/glute volume/g)).toHaveLength(1);
    expect(prompt.match(/smooth skin/g)).toHaveLength(1);
    expect(prompt).not.toMatch(/:\d|impossible|otherworldly|colossal/);
  }
});

it('keeps shape independent of size and clamps invalid slider values', () => {
  expect(gluteShapePrompt('naturally round', { size: 300 })).toBe(gluteShapePrompt('naturally round'));
  expect(gluteSizePrompt(-1)).toBe('');
  expect(gluteSizePrompt('invalid')).toBe('');
  expect(gluteSizePrompt(999)).toBe(gluteSizePrompt(300));
});

it('compiles the saved 238 detail-crop recipe without conflicting framing or size weights', () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.butt_scale = 238;
  dna.physique.glute_shape = 'naturally round';
  dna.pose = { ...dna.pose, distance: 'detail shot', focus: 'full frame', angle: 'profile', action: 'lying' };
  dna.hair = { ...dna.hair, length: 'pixie', style: 'braids' };
  const original = JSON.stringify(dna);
  const { positive, guardAdjustments } = compileModelPrompts({ promptStyle: 'chroma', dna });
  expect(positive).toContain('tight detail framing');
  expect(positive).toContain('composition: detail shot, profile, lying');
  expect(positive).not.toMatch(/full-character|full character|head to feet|pixie|:1\.[3-8]|extended to/);
  expect(positive).toContain('braids hairstyle');
  expect(positive.match(/glute volume/g)).toHaveLength(1);
  expect(guardAdjustments.length).toBeGreaterThan(0);
  expect(JSON.stringify(dna)).toBe(original);
});

it.each(['full body', 'wide shot'])('retains head-to-feet composition for %s', (distance) => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.pose = { ...dna.pose, focus: 'full frame', distance };
  expect(compileModelPrompts({ promptStyle: 'chroma', dna }).positive).toContain('full character visible head to feet');
});
