import { freeformPayload, freeformWorkflows } from './freeformGeneration';
const workflows = [{id:'i',kind:'image'},{id:'v',kind:'video'},{id:'t',kind:'text_video'},{id:'e',kind:'edit'},{id:'p',kind:'pose'}];
test.each(['image','video','text_video'])('%s only offers compatible standalone workflows', mode => {
  expect(freeformWorkflows(workflows, mode)).toEqual(workflows.filter(w => w.kind === mode));
});
test('image dispatch preserves free text and contains no character selections', () => {
  const body = freeformPayload({mode:'image',workflow:workflows[0],prompt:'  watercolor forest  ',negative:'blur'});
  expect(body.prompt_positive).toBe('watercolor forest');
  expect(body.prompt_negative).toBe('blur');
  for (const key of ['dna','subjects','character_id','seed','video_instruction','reference_image']) expect(body).not.toHaveProperty(key);
});
test('image-to-video keeps source subfolder and motion while text-to-video needs no image', () => {
  const body = freeformPayload({mode:'video',workflow:workflows[1],prompt:'Pan left',source:{name:'photo.png',subfolder:'refs'},seed:'42',frames:121,fps:24});
  expect(body.reference_image).toBe('refs/photo.png'); expect(body.video_instruction).toBe('Pan left'); expect(body.seed).toBe(42);
  expect(freeformPayload({mode:'text_video',workflow:workflows[2],prompt:'Ocean waves'})).not.toHaveProperty('reference_image');
});
test('requires a compatible workflow, prompt, source for animation and valid seed', () => {
  expect(() => freeformPayload({mode:'image',workflow:workflows[1],prompt:'forest'})).toThrow('compatible');
  expect(() => freeformPayload({mode:'image',workflow:workflows[0],prompt:' '})).toThrow('Describe');
  expect(() => freeformPayload({mode:'video',workflow:workflows[1],prompt:'motion'})).toThrow('Upload');
  expect(() => freeformPayload({mode:'image',workflow:workflows[0],prompt:'forest',seed:'abc'})).toThrow('seed');
});
