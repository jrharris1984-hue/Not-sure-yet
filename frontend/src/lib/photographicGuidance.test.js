import { applyPhotographicGuidance, PHOTO_DETAIL } from './photographicGuidance';
import { compileModelPrompts } from './modelPromptCompilers';
import { DEFAULT_DNA } from './dna';

test.each(['sdxl', 'sdxl_dmd2', 'pony', 'chroma', 'zimage', 'krea2', 'flux2_klein'])('%s carries early photographic detail while retaining composition', promptStyle => {
  const dna = { ...DEFAULT_DNA, pose: { ...DEFAULT_DNA.pose, distance: 'full body' } };
  const result = compileModelPrompts({ promptStyle, dna });
  expect(result.positive.indexOf(PHOTO_DETAIL)).toBeLessThan(350);
  expect(result.positive).toMatch(/full.body|head to feet/i);
  if (result.negativeStrategy === 'text') expect(result.negative).toContain('airbrushed skin');
  else expect(result.negative).not.toContain('airbrushed skin');
  if (promptStyle === 'pony') expect(result.positive).toContain('score_9');
});

test('rewritten prompts and variations get the same guidance without duplicates', () => {
  const first = applyPhotographicGuidance({ positive: 'Change the jacket to blue.', negative: 'cartoon' });
  expect(first.positive).toContain('Change the jacket to blue.');
  const second = applyPhotographicGuidance(first);
  expect(second).toEqual(first);
  expect(second.negative.split(', ').filter(term => term === 'cartoon')).toHaveLength(1);
});

test('exact recipes and editing/video instructions stay unchanged when guidance is disabled', () => {
  expect(applyPhotographicGuidance({ positive: 'Saved original text', negative: '', enabled: false }))
    .toEqual({ positive: 'Saved original text', negative: '' });
});

test('Pony score tags remain first when supplied first', () => {
  const result = applyPhotographicGuidance({ positive: 'score_9, score_8_up, full body photograph' });
  expect(result.positive).toMatch(/^score_9, score_8_up,/);
  expect(result.positive).toContain(PHOTO_DETAIL);
});

test('blank negatives receive a standard baseline, custom exclusions merge without repetition', () => {
  const standard = applyPhotographicGuidance({ positive: 'A photograph', negative: '' });
  expect(standard.negative).toContain('malformed hands');
  expect(standard.negative).toContain('blurry');
  expect(standard.negative).toContain('airbrushed skin');
  const custom = applyPhotographicGuidance({ positive: 'A photograph', negative: 'Blurry, blurry, red jacket' });
  expect(custom.negative).toContain('red jacket');
  expect(custom.negative.toLowerCase().split(', ').filter(term => term === 'blurry')).toHaveLength(1);
});

test('zeroed conditioning receives positive detail and retains its original negative text', () => {
  const result = applyPhotographicGuidance({ positive: 'A photograph', negative: 'original', negativeStrategy: 'zeroed' });
  expect(result.positive).toContain(PHOTO_DETAIL);
  expect(result.negative).toBe('original');
});
