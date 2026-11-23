import { DEFAULT_DNA } from './dna';
import { compileModelPrompts, resolvePromptCompiler } from './modelPromptCompilers';
import { resolvePhysiqueControls } from './physiqueControls';

const recipe = () => JSON.parse(JSON.stringify(DEFAULT_DNA));
it.each(['chroma', 'krea2', 'sdxl', 'zimage', 'pony', 'flux2_klein'])('keeps explicit physique sliders authoritative in %s', promptStyle => {
  const dna = recipe();
  dna.physique = { ...dna.physique, body_type: 'hourglass', waist: 'tiny', waist_scale: 450, hips: 'wide', hip_scale: 10, butt: 'huge', butt_scale: 10, glute_shape: 'fantasy oversized glutes' };
  const original = JSON.stringify(dna);
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).not.toMatch(/cinched narrow waist|tiny waist|fantasy oversized glutes|huge butt|ample bust and hips|believable adult proportions|natural proportions|cartoon/);
  expect(positive).toContain('sculpted bulbous glute contour');
  expect(positive).toMatch(/small glute/);
  expect(positive).toMatch(/narrow hips/);
  expect(positive).toContain('waist width 450/500');
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
    ['butt_scale', 141, 142, 'size intensity'],
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
  expect(positive).toMatch(/lateral hip width intensity 92\/2000/);
  expect(positive).toMatch(/upper-thigh volume intensity 87\/750/);
  expect(positive).toMatch(/size intensity 225\/2000/);
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

it.each(['Moss Image FinalCut Universal FP8', 'HyperMoss Lush Turbo int8 V1'])('routes %s to the MOSS compiler', workflowName => {
  expect(resolvePromptCompiler({ workflowName })).toBe('moss');
});
it('preserves MOSS extreme regional selections and separate glute shape', () => {
  const dna = recipe();
  dna.physique = { ...dna.physique, hips: 'extreme', thighs: 'massive', butt_scale: 225, glute_shape: 'heart-shaped' };
  const { positive } = compileModelPrompts({ promptStyle: 'moss', dna });
  expect(positive).toMatch(/dramatically broad hip silhouette/i);
  expect(positive).toMatch(/extremely broad upper thighs/i);
  expect(positive).toMatch(/size intensity 225\/2000/);
  expect(positive).toMatch(/heart.*glute contour/i);
});


it('gives MOSS a concise visual priority only for strongly exaggerated selections', () => {
  const dna = recipe();
  dna.physique = { ...dna.physique, hips: 'extreme', thighs: 'massive', butt: 'hyper' };
  const { positive } = compileModelPrompts({ promptStyle: 'moss', dna });
  expect(positive).toContain('MOSS VISUAL PRIORITY:');
  expect(positive).toContain('dramatically broad lateral hip silhouette');
  expect(positive).toContain('exceptionally full upper-thigh volume');
  expect(positive).toContain('fantasy-scale rearward glute projection');
  const ordinary = recipe();
  ordinary.physique = { ...ordinary.physique, hips: 'average', thighs: 'toned', butt: 'round' };
  expect(compileModelPrompts({ promptStyle: 'moss', dna: ordinary }).positive).not.toContain('MOSS VISUAL PRIORITY:');
});


describe('physique slider endpoint comparisons', () => {
  it.each([
    ['hip_scale', 'lateral hip width intensity', 2000],
    ['thigh_scale', 'upper-thigh volume intensity', 750],
    ['butt_scale', 'size intensity', 2000],
  ])('keeps %s low, middle, and maximum settings distinguishable in MOSS', (key, axis, maximum) => {
    const values = [1, Math.round(maximum / 2), maximum];
    const prompts = values.map(value => {
      const dna = recipe();
      dna.physique = { ...dna.physique, [key]: value };
      return compileModelPrompts({ promptStyle: 'moss', dna }).positive;
    });
    values.forEach((value, index) => {
      expect(prompts[index]).toContain(`${axis} ${value}/${maximum}`);
    });
    expect(new Set(prompts).size).toBe(3);
  });

  it.each(['moss', 'chroma', 'pony', 'krea2'])('preserves pose action through the %s compiler', promptStyle => {
    const dna = recipe();
    dna.pose = { ...dna.pose, action: 'standing quarter turn' };
    const positive = compileModelPrompts({ promptStyle, dna }).positive;
    expect(positive.toLowerCase()).toMatch(/quarter.turn|45 degrees|three.quarter/);
  });
});


describe('Physique 2.0 expanded range compatibility', () => {
  it.each([
    ['bust_scale', 500, /bust size 500\/2000/],
    ['hip_scale', 300, /hip width 300\/2000/],
    ['waist_scale', 200, /waist width 200\/500/],
    ['thigh_scale', 300, /thigh size 300\/750/],
    ['butt_scale', 1500, /glute size 1500\/2000/],
  ])('compiles expanded %s maximum for MOSS', (key, maximum, phrase) => {
    const dna = recipe();
    dna.physique = {...dna.physique, [key]: maximum};
    expect(compileModelPrompts({promptStyle:'moss', dna}).positive).toMatch(phrase);
  });
  it('keeps the previous glute scale interpretation at 300', () => {
    const dna = recipe();
    dna.physique = {...dna.physique, butt_scale:300};
    expect(compileModelPrompts({promptStyle:'moss',dna}).positive).toMatch(/size intensity 300\/2000/);
  });
});


it.each(['chroma','krea2','sdxl','zimage','pony','flux2_klein'])('compiles new shoulder arm and calf controls for %s',promptStyle=>{
 const dna=recipe();
 dna.physique={...dna.physique,shoulder_width:95,clavicle_definition:80,upper_arm_fullness:90,arm_muscularity:75,calf_fullness:85,ankle_taper:60};
 const positive=compileModelPrompts({promptStyle,dna}).positive;
 expect(positive).toContain('very broad shoulders with a strong, expansive upper-body frame');
 expect(positive).toContain('strong high-definition clavicle line');
 expect(positive).toContain('very full upper arms with substantial volume');
 expect(positive).toContain('pronounced athletic arm definition');
 expect(positive).toContain('very full calves with substantial lower-leg volume');
 expect(positive).toContain('defined taper from calf to ankle');
});
