import { DEFAULT_DNA } from './dna';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolvePhysiqueControls } from './physiqueControls';

const recipe = () => JSON.parse(JSON.stringify(DEFAULT_DNA));
it.each(['chroma', 'krea2', 'sdxl', 'zimage', 'pony', 'flux2_klein'])('keeps explicit physique sliders authoritative in %s', promptStyle => {
  const dna = recipe();
  dna.physique = { ...dna.physique, body_type: 'hourglass', waist: 'tiny', waist_scale: 90, hips: 'wide', hip_scale: 10, butt: 'huge', butt_scale: 10, glute_shape: 'fantasy oversized glutes' };
  const original = JSON.stringify(dna);
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).not.toMatch(/cinched narrow waist|tiny waist|fantasy oversized glutes|huge butt|ample bust and hips|believable adult proportions|natural proportions|cartoon/);
  expect(positive).toContain('sculpted bulbous glute contour');
  expect(positive).toMatch(/small glute/);
  expect(positive).toMatch(/narrow hips/);
  expect(positive).toMatch(/(?:very wide|pronounced width) waist/);
  expect(positive).toContain('photographic skin texture');
  expect(JSON.stringify(dna)).toBe(original);
});
it.each(['chroma', 'krea2', 'sdxl', 'zimage', 'pony'])('preserves athletic bust contour without adding a small size in %s', promptStyle => {
  const dna = recipe();
  dna.physique = { ...dna.physique, bust_scale: 70, bust_shape: 'athletic' };
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).toContain('firm athletic breast contour');
  expect(positive).not.toContain('small athletic firm breasts');
});
it('makes Chroma bust shape effective and keeps implant volume authoritative', () => {
  const dna = recipe(); dna.physique.bust_scale = 60; dna.physique.bust_shape = 'round';
  const round = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  dna.physique.bust_shape = 'teardrop';
  const tear = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  expect(round).toContain('rounded breast contour');
  expect(tear).toContain('teardrop-shaped breast contour');
  expect(round).not.toBe(tear);
  dna.physique.implant_volume = 1500;
  const augmented = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
  expect(augmented).toContain('augmented bust');
  expect(augmented).not.toContain('teardrop-shaped');
});
it.each(['chroma', 'krea2', 'sdxl', 'zimage', 'pony'])('compiles zero-slider size presets and photo style in %s', promptStyle => {
  const dna = recipe();
  dna.physique = { ...dna.physique, bust: 'large', butt: 'large', hips: 'wide' };
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).toMatch(/large.*bust|large.*breast/);
  expect(positive).toMatch(/large.*glute|large.*butt|large.*ass/);
});
it('removes conflicting regional preset assumptions and resolves legacy CGI style', () => {
  const dna = recipe(); dna.physique.body_type = 'apple'; dna.physique.waist_scale = 10;
  expect(resolvePhysiqueControls(dna).dna.physique.body_type).toBe('');
  dna.style.render = 'octane';
  const { positive, negative } = compileModelPrompts({ promptStyle: 'chroma', dna });
  expect(positive).not.toMatch(/octane|CGI|3d render/);
  expect(positive).toContain('photorealistic');
  expect(negative).toContain('cartoon');
});
it('keeps zeroed-negative strategies and edit instructions intact', () => {
  const dna = recipe();
  expect(compileModelPrompts({ promptStyle: 'krea2', dna }).negative).toBe('');
  expect(compileModelPrompts({ promptStyle: 'flux2_klein', dna }).negativeStrategy).toBe('zeroed');
  expect(compileModelPrompts({ promptStyle: 'qwen_edit', dna, editInstruction: 'Change the background to a garden' }).positive).toContain('Change the background to a garden');
});


it('keeps individual hip, thigh and glute slider positions distinct in compiled prompts', () => {
  for (const [key, first, second, label] of [
    ['hip_scale', 41, 42, 'lateral hip width intensity'],
    ['thigh_scale', 61, 62, 'upper-thigh volume intensity'],
    ['butt_scale', 141, 142, 'glute volume intensity'],
  ]) {
    const dna = recipe();
    dna.physique[key] = first;
    const before = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
    dna.physique[key] = second;
    const after = compileModelPrompts({ promptStyle: 'chroma', dna }).positive;
    expect(before).toContain(label);
    expect(after).toContain(label);
    expect(before).not.toBe(after);
  }
});


it.each(['natural', 'enhanced', 'extreme'])('preserves explicitly selected extreme physique presets in %s anatomy mode', anatomy_mode => {
  const dna = recipe();
  dna.style = { ...dna.style, anatomy_mode };
  dna.physique = { ...dna.physique, bust: 'hyper', butt: 'hyper', hips: 'extreme', thighs: 'massive' };
  const original = JSON.stringify(dna);
  const result = compileModelPrompts({ promptStyle: 'chroma', dna });
  expect(result.positive).toMatch(/hyper|fantasy-scale|extreme|massive|oversized/i);
  expect(JSON.stringify(dna)).toBe(original);
});


it.each(['pony', 'krea2'])('uses consistent regional slider descriptions in %s', promptStyle => {
  const dna = recipe();
  dna.physique = { ...dna.physique, hip_scale: 92, thigh_scale: 87, butt_scale: 225 };
  const positive = compileModelPrompts({ promptStyle, dna }).positive;
  expect(positive).toMatch(/lateral hip width intensity 92\/100/);
  expect(positive).toMatch(/upper-thigh volume intensity 87\/100/);
  expect(positive).toMatch(/glute volume intensity 225\/300/);
});


it('does not shrink Hyper and Huge physique presets in Z-Image normalization', () => {
  const dna = recipe();
  dna.style = { ...dna.style, anatomy_mode: 'natural' };
  dna.physique = { ...dna.physique, bust: 'hyper', butt: 'hyper', hips: 'extreme' };
  const positive = compileModelPrompts({ promptStyle: 'zimage', dna }).positive;
  expect(positive).toMatch(/hyper-scale bust|hyper.*bust/i);
  expect(positive).toMatch(/fantasy-scale hyper glute|hyper.*glute/i);
  expect(positive).not.toMatch(/very large breasts with believable weight|extremely full rounded buttocks/i);
});
