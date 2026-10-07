import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ShootSetup from './ShootSetup';
import { endpoints } from '@/lib/api';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ characterId: 'person' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
const mockWorkflows = [
  { id: 'chroma', name: 'Chroma1-HD', kind: 'image', prompt_style: 'chroma' },
  { id: 'krea', name: 'Krea 2 Turbo', kind: 'image', prompt_style: 'krea2' },
];
const mockDna = { identity: { age: 35, gender: 'female' }, wardrobe: { outfit_preset: 'streetwear' } };
let mockContext = {render_id:null,recipe:{}};
let mockMutation;
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'workflows' ? mockWorkflows
    : queryKey[0] === 'shoot-context' ? mockContext
    : queryKey[0] === 'settings' ? { default_workflow_id: 'chroma' }
      : { id: 'person', name: 'Test', dna: mockDna } }),
  useMutation: options => { mockMutation = options; return { mutate: jest.fn() }; },
}));

test('shoot sections keep wardrobe selections when switching and expose set properties', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container=document.createElement('div'),root=createRoot(container);
  try {
    act(() => root.render(<ShootSetup />));
    expect(container.querySelector('[data-testid="shoot-basics-panel"]').hidden).toBe(false);
    expect(container.querySelector('[data-testid="shoot-clothing-sequence"]').hidden).toBe(true);
    const tab = label => [...container.querySelectorAll('nav[aria-label="Shoot setup sections"] button')].find(button => button.textContent.includes(label));
    act(() => tab('Wardrobe').click());
    act(() => container.querySelector('[data-testid="enable-clothing-sequence"]').click());
    act(() => tab('Shot list').click());
    act(() => tab('Wardrobe').click());
    expect(container.querySelector('[data-testid="enable-clothing-sequence"]').checked).toBe(true);
    act(() => tab('Set & lighting').click());
    expect(container.querySelector('[data-testid="shoot-set-panel"]').hidden).toBe(false);
    expect(container.querySelector('[aria-label="Shoot Background details"]')).not.toBeNull();
  } finally {act(() => root.unmount());}
});

test('reference shoots use the saved photo, original seed and identity-preserving frame instructions', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockContext={render_id:'source-photo',preview:'photo.png',recipe:{workflow_id:'chroma',seed:42,selected_lora_name:'old-lora'}};
  mockWorkflows.push({id:'reference',kind:'edit',prompt_style:'qwen_edit',name:'Qwen Edit'});
  const create=jest.spyOn(endpoints,'createShoot').mockImplementation(async body => body);
  const container=document.createElement('div'),root=createRoot(container);
  try {
    act(() => root.render(<ShootSetup />));
    expect(container.querySelector('[data-testid="select-shoot-workflow"]').value).toBe('reference');
    const body=await mockMutation.mutationFn();
    expect(body.source_render_id).toBe('source-photo');
    expect(body.base_seed).toBe(42);
    expect(body.seed_mode).toBe('same');
    expect(body.lora_overrides).toEqual({});
    expect(body.dispatch_settings).toEqual({});
    expect(body.frames.every(frame => frame.edit_instruction.includes('Preserve the same people'))).toBe(true);
    expect(body.frames[0].prompt_positive).toContain('35');
  } finally {act(() => root.unmount());create.mockRestore();mockWorkflows.pop();mockContext={render_id:null,recipe:{}};}
});
jest.mock('@/components/LoraPanel', () => ({ workflow, dna }) => {
  const { workflowFamily, loraStackHealth } = require('@/lib/loraRegistry');
  const health = loraStackHealth({ workflow, overrides: { '1': { lora_name: 'goldenchromaV1.safetensors', strength_model: .7 } } });
  return <div data-testid="planner-routing">{workflowFamily(workflow)} | {dna?.wardrobe?.outfit_preset} | {health.warnings.join(' ')}</div>;
});

test('ordered shot sets preserve edits and queue the reviewed order without rendering during editing', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const create = jest.spyOn(endpoints, 'createShoot').mockImplementation(async body => body);
  const container = document.createElement('div'), root = createRoot(container);
  const select = (label, value) => act(() => {
    const node = container.querySelector(`[aria-label="${label}"]`);
    node.value = value; node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const tab = label => [...container.querySelectorAll('nav[aria-label="Shoot setup sections"] button')].find(button => button.textContent.includes(label));
  try {
    act(() => root.render(<ShootSetup />));
    act(() => tab('Shot list').click());
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Ordered shot sets').click());
    expect(container.querySelector('[data-testid="shoot-count-value"]').textContent).toBe('4');
    select('Shot set', 'couch');
    select('New set outfit', 'tailored pantsuit');
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Add 3 shots').click());
    select('Shot 5 Camera height', 'low');
    act(() => container.querySelector('[aria-label="Move shot 5 up"]').click());
    act(() => tab('Wardrobe').click());
    expect(container.querySelector('[data-testid="shoot-clothing-sequence"]').hidden).toBe(true);
    act(() => tab('Shot list').click());
    expect(container.querySelector('[aria-label="Shot 4 Camera height"]').value).toBe('low');
    expect(create).not.toHaveBeenCalled();
    const body = await mockMutation.mutationFn();
    expect(body.count).toBe(7);
    expect(body.pose_mode).toBe('ordered_sets');
    expect(body.frames[3].camera_overrides.angle).toBe('low');
    expect(body.frames[3].scene_direction).toContain('couch');
    expect(body.frames[3].prompt_positive).toContain('couch');
    expect(body.frames[3].outfit_overrides.outfit_preset).toBe('tailored pantsuit');
    expect(body.frames[4].pose_overrides.angle).toBe('back');
    expect(body.frames.every(frame => frame.shot_label)).toBe(true);
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Pose rotation / AI').click());
    expect(container.querySelector('[data-testid="shoot-count-value"]').textContent).toBe('8');
  } finally { act(() => root.unmount()); create.mockRestore(); }
});

test('an empty ordered shot list cannot be queued', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'), root = createRoot(container);
  try {
    act(() => root.render(<ShootSetup />));
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Ordered shot sets').click());
    for (let i = 0; i < 4; i++) act(() => container.querySelector('[aria-label="Remove shot 1"]').click());
    expect(container.querySelector('[data-testid="btn-start-shoot"]').disabled).toBe(true);
    expect(container.querySelector('[data-testid="shoot-count-value"]').textContent).toBe('0');
  } finally { act(() => root.unmount()); }
});

test('photoshoot passes selected workflow metadata and character selections into compatibility checks', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() => root.render(<ShootSetup />));
    const planner = container.querySelector('[data-testid="planner-routing"]');
    expect(planner.textContent).toContain('chroma | streetwear');
    expect(planner.textContent).not.toContain('not unknown');
    expect(planner.textContent).not.toContain('is for chroma');
    const select = [...container.querySelectorAll('select')].find(node => [...node.options].some(option => option.value === 'krea'));
    act(() => { select.value = 'krea'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(planner.textContent).toContain('krea2 | streetwear');
    expect(planner.textContent).toContain('Golden Chroma is for chroma, not krea2.');
  } finally { act(() => root.unmount()); }
});

test('ordered coverage mode previews four shots per stage for a 28-photo run', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  try {
    act(() => root.render(<ShootSetup />));
    act(() => container.querySelector('[data-testid="enable-clothing-sequence"]').click());
    expect(container.querySelector('[data-testid="clothing-sequence-total"]').textContent).toContain('7 stages × 4 photos = 28 photos');
    expect(container.querySelector('[data-testid="shoot-count-value"]').textContent).toBe('28');
    expect(container.querySelector('[data-testid="slider-shoot-count"]').disabled).toBe(true);
    expect(container.querySelector('[data-testid="shoot-outfit-panel"]').disabled).toBe(true);
    expect(container.querySelector('[data-testid="shoot-preview-frame-3"]').textContent).toContain('use selected outfit');
    expect(container.querySelector('[data-testid="shoot-preview-frame-4"]').textContent).toContain('slightly revealing');
    expect(container.querySelector('[data-testid="shoot-preview-frame-27"]').textContent).toContain('nude');
    act(() => container.querySelector('[data-testid="enable-clothing-sequence"]').click());
    expect(container.querySelector('[data-testid="shoot-count-value"]').textContent).toBe('8');
  } finally { act(() => root.unmount()); }
});
