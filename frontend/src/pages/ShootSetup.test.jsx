import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ShootSetup from './ShootSetup';

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
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'workflows' ? mockWorkflows
    : queryKey[0] === 'settings' ? { default_workflow_id: 'chroma' }
      : { id: 'person', name: 'Test', dna: mockDna } }),
  useMutation: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/components/LoraPanel', () => ({ workflow, dna }) => {
  const { workflowFamily, loraStackHealth } = require('@/lib/loraRegistry');
  const health = loraStackHealth({ workflow, overrides: { '1': { lora_name: 'goldenchromaV1.safetensors', strength_model: .7 } } });
  return <div data-testid="planner-routing">{workflowFamily(workflow)} | {dna?.wardrobe?.outfit_preset} | {health.warnings.join(' ')}</div>;
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
