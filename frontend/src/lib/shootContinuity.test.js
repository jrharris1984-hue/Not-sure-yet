import { referenceShootWorkflows, shootContinuityDefaults, shootReferenceInstruction, shootReferencePreview } from './shootContinuity';
const workflows = [
  {id:'default',kind:'image'}, {id:'source',kind:'image'},
  {id:'edit',kind:'edit',prompt_style:'qwen_edit'},
  {id:'pose',kind:'edit',prompt_style:'qwen_edit',edit_variant:'pose'},
];
test('photo matching defaults to a standard editor and retains the source seed including zero', () => {
  expect(shootContinuityDefaults({render_id:'photo',recipe:{workflow_id:'source',seed:0}},workflows,'default'))
    .toEqual({mode:'reference',workflowId:'edit',seed:0,loras:{}});
  expect(referenceShootWorkflows(workflows).map(w => w.id)).toEqual(['edit']);
});
test('text mode carries source workflow and LoRAs rather than the application default', () => {
  const loras={'4':{lora_name:'likeness.safetensors',strength_model:.8}};
  expect(shootContinuityDefaults({render_id:'photo',recipe:{workflow_id:'source',seed:42,lora_overrides:loras}},workflows.slice(0,2),'default'))
    .toEqual({mode:'text',workflowId:'source',seed:42,loras});
});
test('no source chooses a text workflow and does not copy unrelated LoRA node IDs', () => {
  expect(shootContinuityDefaults({recipe:{}},workflows,'default').workflowId).toBe('default');
  expect(shootContinuityDefaults({recipe:{workflow_id:'missing',lora_overrides:{old:{}}}},workflows,'default').loras).toEqual({});
});
test('reference instructions preserve identity while stating the selected shot changes', () => {
  expect(shootReferenceInstruction('standing, navy pantsuit')).toContain('recognizable faces, age');
  expect(shootReferenceInstruction('standing, navy pantsuit')).toContain('Requested shot: standing, navy pantsuit');
  expect(shootReferencePreview('http://comfy:8188/view?filename=character.png&type=output','/api'))
    .toBe('/api/comfyui/media?filename=character.png&type=output');
});
