import { composeMossPrompt, inspectMossPhysique, mossVisualPriority } from './mossPromptProfile';

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
