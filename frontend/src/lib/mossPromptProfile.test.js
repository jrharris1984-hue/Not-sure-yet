import { composeMossPrompt, inspectMossPhysique, mossVisualPriority, mossBodyGeometry } from './mossPromptProfile';

test('explicit extreme selections get a concise silhouette priority', () => {
  const dna = { physique: { hips: 'extreme', thighs: 'massive', butt: 'hyper' } };
  const lead = mossVisualPriority(dna);
  expect(lead).toContain('dramatically broad lateral hip silhouette');
  expect(lead).toContain('exceptionally full upper-thigh volume');
  expect(lead).toContain('fantasy-scale rearward glute projection');
});

test('slider takes precedence over conflicting extreme preset', () => {
  const dna = { physique: { hips: 'extreme', hip_scale: 10 } };
  expect(mossVisualPriority(dna)).not.toContain('dramatically broad lateral hip silhouette');
  expect(inspectMossPhysique(dna).warnings).toContain('hip_scale overrides the competing hips preset');
});

test('preserves individual subject priorities and accurate word count', () => {
  const result = composeMossPrompt('Photorealistic portrait', [
    { label: 'A', dna: { physique: { hips: 'extreme' } } },
    { label: 'B', dna: { physique: { butt: 'hyper' } } },
  ]);
  expect(result.positive).toContain('Subject A: PRIMARY VISUAL REQUIREMENTS:');
  expect(result.positive).toContain('Subject B: PRIMARY VISUAL REQUIREMENTS:');
  expect(result.promptWords).toBe(result.positive.trim().split(/\s+/).length);
  expect(result.mossDiagnostics).toHaveLength(2);
});

test('ordinary presets do not receive exaggerated emphasis', () => {
  expect(mossVisualPriority({ physique: { hips: 'average', thighs: 'toned', butt: 'round' } })).toBe('');
});

test('keeps size, contour and projection independent in MOSS geometry', () => {
  const dna = { physique: { butt: 'hyper', butt_scale: 250, glute_shape: 'deep rear projection', hips: 'extreme', hip_scale: 10 } };
  const original = JSON.stringify(dna);
  const geometry = mossBodyGeometry(dna);
  expect(geometry.butt).toEqual({
    sizeSource: 'slider', size: 250, contour: 'deep rear projection', projection: 'rearward',
  });
  expect(geometry.hips.sizeSource).toBe('slider');
  expect(geometry.hips.size).toBe(10);
  expect(geometry.thighs.sizeSource).toBe('unspecified');
  expect(JSON.stringify(dna)).toBe(original);
});

test('MOSS diagnostics expose geometry without changing presets', () => {
  const dna = { physique: { butt: 'hyper', glute_shape: 'dramatic side projection' } };
  const report = inspectMossPhysique(dna);
  expect(report.geometry.butt.sizeSource).toBe('preset');
  expect(report.geometry.butt.size).toBe('hyper');
  expect(report.geometry.butt.projection).toBe('lateral');
});
