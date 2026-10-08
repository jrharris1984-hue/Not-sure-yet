import { characterPreviewPayload, CHARACTER_PREVIEW_SEED, previewWorkflows, previewAiChanges, applyPreviewAiChanges } from './characterPreview';
import { DEFAULT_DNA } from './dna';

const workflow = { id: 'chroma', kind: 'image', prompt_style: 'chroma', name: 'Golden Chroma' };
const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));

test('previews use one small image and fixed seed without changing character data', () => {
  const before = JSON.stringify(dna);
  const payload = characterPreviewPayload({ dna, workflow, promptCatalog: { sections: [] } });
  expect(payload.seed).toBe(CHARACTER_PREVIEW_SEED);
  expect(payload.batch_size).toBe(1);
  expect(Math.max(payload.width, payload.height)).toBeLessThanOrEqual(640);
  expect(payload.width % 64).toBe(0);
  expect(payload.hidden_from_gallery).toBe(true);
  expect(payload.operation).toBe('character_preview');
  expect(payload.prompt_positive).not.toMatch(/undefined|NaN/);
  expect(JSON.stringify(dna)).toBe(before);
});

test('preview requests retain model-specific sampling and selected LoRA', () => {
  const payload = characterPreviewPayload({ dna, workflow: { ...workflow, prompt_style: 'krea2_aio' },
    lora: { name: 'outfit.safetensors', strength: 0.65, triggerWords: ['custom outfit'] } });
  expect(payload.sampler_name).toBe('euler_ancestral');
  expect(payload.scheduler).toBe('beta');
  expect(payload.prompt_positive).toContain('custom outfit');
  expect(payload.selected_loras).toEqual([{ name: 'outfit.safetensors', strength: 0.65, triggers: ['custom outfit'] }]);
});

test('edit and video workflows are unavailable for character previews', () => {
  expect(previewWorkflows([workflow, { id: 'video', kind: 'video' }, { id: 'face', kind: 'face' }])).toEqual([workflow]);
  expect(() => characterPreviewPayload({ dna, workflow: { kind: 'edit' } })).toThrow('still-image');
});

test.each(['chroma', 'krea2_aio', 'qwen_rapid', 'pony'])('full-size %s captures reuse seed and LoRA and are visible in Gallery', style => {
  const options = { dna, workflow: { ...workflow, prompt_style: style }, seed: 5678, lora: { name: 'test.safetensors', strength: 0.7, triggerWords: ['distinctive look'] } };
  const small = characterPreviewPayload(options);
  const full = characterPreviewPayload({ ...options, capture: true });
  expect(full.seed).toBe(small.seed);
  expect(full.prompt_positive).toBe(small.prompt_positive);
  expect(full.selected_loras).toEqual(small.selected_loras);
  expect(full.hidden_from_gallery).toBe(false);
  expect(full.operation).toBe('character_capture');
  expect(full.quality_tier).toBe('quality');
  expect(Math.max(full.width, full.height)).toBeGreaterThan(640);
  expect(full.batch_size).toBe(1);
});

test('invalid seeds are rejected and balanced capture uses its full model recipe', () => {
  for (const seed of ['', -1, 1.5, 'invalid', 2147483647]) expect(() => characterPreviewPayload({ dna, workflow, seed })).toThrow('Seed');
  const full = characterPreviewPayload({ dna, workflow, seed: 0, capture: true, qualityTier: 'balanced' });
  expect(full.seed).toBe(0); expect(full.width).toBe(768); expect(full.height).toBe(1152); expect(full.steps).toBe(26);
});


test('AI review respects section and field locks and ignores malformed or unknown changes', () => {
  const sections = [
    { key: 'identity', title: 'Identity', fields: [{ key: 'age', label: 'Age' }, { key: 'gender', label: 'Gender' }] },
    { key: 'hair', title: 'Hair', fields: [{ key: 'color', label: 'Color' }] },
  ];
  const suggestion = { identity: { age: 45, gender: 'female', unknown: 'bad' }, hair: { color: 'silver' }, scenario: { cast_type: 'two people' } };
  const changes = previewAiChanges(dna, suggestion, sections, { hair: true }, { identity: { age: true } });
  expect(changes.every(change => change.section === 'identity' && change.field === 'gender')).toBe(true);
  expect(previewAiChanges(dna, { identity: { age: { invalid: 1 } } }, sections)).toEqual([]);
  const ageChange = { section: 'identity', field: 'age', value: 45 };
  expect(applyPreviewAiChanges(dna, [ageChange], {}, { identity: { age: true } }).identity.age).toBe(dna.identity.age);
  expect(applyPreviewAiChanges(dna, [ageChange]).identity.age).toBe(45);
  expect(dna.identity.age).not.toBe(45);
});
