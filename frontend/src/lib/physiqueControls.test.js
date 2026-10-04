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
