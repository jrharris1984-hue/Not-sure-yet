import { characterPreviewPayload, CHARACTER_PREVIEW_SEED, previewWorkflows } from './characterPreview';
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
