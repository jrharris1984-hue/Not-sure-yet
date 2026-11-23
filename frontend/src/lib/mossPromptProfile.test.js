import { composeMossPrompt, inspectMossPhysique, mossVisualPriority, mossBodyGeometry, dedupeMossClauses, detectMossPromptConflicts, resolveMossProfile } from './mossPromptProfile';

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
  expect(result.positive).toContain('Subject A: MOSS VISUAL PRIORITY:');
  expect(result.positive).toContain('Subject B: MOSS VISUAL PRIORITY:');
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

test('deduplicates only exact repeated MOSS clauses', () => {
  const result = dedupeMossClauses('wide hips; rounded contour; WIDE   HIPS; custom wide hip description');
  expect(result.positive).toBe('wide hips; rounded contour; custom wide hip description');
  expect(result.removed).toEqual(['WIDE   HIPS']);
});

test('MOSS composition reports removed duplicates without changing custom wording', () => {
  const result = composeMossPrompt('studio portrait; studio portrait; my custom phrase', [{ dna: { physique: {} } }]);
  expect(result.positive).toContain('my custom phrase');
  expect(result.mossRemovedDuplicates).toEqual(['studio portrait']);
  expect(result.promptWords).toBe(result.positive.split(/\s+/).filter(Boolean).length);
});

test('flags opposing hip language without deleting user wording', () => {
  const dna = { physique: { hips: 'extreme' } };
  const prompt = 'Portrait with narrow hips; dramatic studio lighting';
  const result = composeMossPrompt(prompt, [{ dna }]);
  expect(result.positive).toContain('narrow hips');
  expect(result.mossPromptConflicts).toEqual([
    expect.objectContaining({ region: 'hips', selected: 'wide', conflictingDescription: 'narrow' }),
  ]);
});

test('does not mistake the compiler priority lead for a conflict', () => {
  const dna = { physique: { hips: 'extreme', thighs: 'massive' } };
  expect(composeMossPrompt('wide hips; thick upper thighs', [{ dna }]).mossPromptConflicts).toEqual([]);
});

test('slider overrides preset when evaluating semantic conflicts', () => {
  const dna = { physique: { hips: 'extreme', hip_scale: 10 } };
  expect(detectMossPromptConflicts('dramatically broad hip silhouette', dna))
    .toEqual([expect.objectContaining({ region: 'hips', selected: 'narrow' })]);
});

test('avoids cross-subject semantic conflict guesses', () => {
  const result = composeMossPrompt('Subject A: narrow hips; Subject B: wide hips', [
    { label: 'A', dna: { physique: { hips: 'narrow' } } },
    { label: 'B', dna: { physique: { hips: 'wide' } } },
  ]);
  expect(result.mossPromptConflicts).toEqual([]);
});

test('identifies MOSS variants by workflow name', () => {
  expect(resolveMossProfile('Moss Image FinalCut Universal FP8')).toBe('finalcut');
  expect(resolveMossProfile('HyperMoss Lush Turbo int8 V1')).toBe('hypermoss');
  expect(resolveMossProfile('Other MOSS checkpoint')).toBe('generic');
});

test('workflow-specific wording keeps the same selected geometry', () => {
  const subjects = [{ dna: { physique: { hips: 'extreme' } } }];
  const finalcut = composeMossPrompt('studio portrait', subjects, 'Moss Image FinalCut Universal FP8');
  const hypermoss = composeMossPrompt('studio portrait', subjects, 'HyperMoss Lush Turbo int8 V1');
  expect(finalcut.mossProfile).toBe('finalcut');
  expect(hypermoss.mossProfile).toBe('hypermoss');
  expect(finalcut.positive).toContain('dramatically broad lateral hip silhouette');
  expect(hypermoss.positive).toContain('dramatically broad lateral hip silhouette');
  expect(finalcut.positive).not.toBe(hypermoss.positive);
  expect(finalcut.positive).toContain('studio portrait');
  expect(hypermoss.positive).toContain('studio portrait');
});
