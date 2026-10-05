import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ShootPlanner from './ShootPlanner';
import { endpoints } from '@/lib/api';

jest.mock('@/lib/api', () => ({ endpoints: { aiShootPlan: jest.fn() } }));
let container, root;
const workflow = { id: 'chroma', kind: 'image' };
const frames = Array.from({ length: 4 }, () => ({ pose_action: 'walking', framing: 'full body' }));
const input = (node, value) => {
  const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
const button = text => [...container.querySelectorAll('button')].find(node => node.textContent.includes(text));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); root = createRoot(container); endpoints.aiShootPlan.mockReset();
});
afterEach(() => act(() => root.unmount()));

test('draft is reviewable and edits only take effect after Apply; selected revisions preserve other cards', async () => {
  const apply = jest.fn();
  endpoints.aiShootPlan.mockResolvedValue({ frames, warnings: [] });
  act(() => root.render(<ShootPlanner characterId="c" workflow={workflow} count={4} lockScenario onApply={apply} />));
  act(() => input(container.querySelector('textarea'), 'walking fashion shoot'));
  await act(async () => button('Draft 4').click());
  expect(apply).not.toHaveBeenCalled();
  const select = [...container.querySelectorAll('select')].find(node => [...node.options].some(o => o.value === 'profile'));
  act(() => input(select, 'profile'));
  act(() => button('Apply reviewed').click());
  expect(apply.mock.calls[0][0][0].view).toBe('profile');
  act(() => container.querySelector('input[type="checkbox"]:not([aria-label="Use web research"])').click());
  endpoints.aiShootPlan.mockResolvedValue({ frames: [{ pose_action: 'seated', framing: 'full body' }], warnings: [] });
  await act(async () => button('Revise 1 selected').click());
  expect(endpoints.aiShootPlan.mock.calls[1][0].count).toBe(1);
  act(() => button('Apply reviewed').click());
  expect(apply.mock.calls[1][0][0].pose_action).toBe('seated');
  expect(apply.mock.calls[1][0][1].pose_action).toBe('walking');
});

test('response for a previous workflow cannot be applied', async () => {
  let resolve;
  endpoints.aiShootPlan.mockReturnValue(new Promise(r => { resolve = r; }));
  const apply = jest.fn();
  act(() => root.render(<ShootPlanner characterId="c" workflow={workflow} count={4} lockScenario onApply={apply} />));
  act(() => input(container.querySelector('textarea'), 'fashion shoot'));
  act(() => button('Draft 4').click());
  act(() => root.render(<ShootPlanner characterId="c" workflow={{ id: 'krea', kind: 'image' }} count={4} lockScenario onApply={apply} />));
  await act(async () => resolve({ frames, warnings: [] }));
  expect(button('Apply reviewed')).toBeUndefined();
  expect(apply).not.toHaveBeenCalled();
});

test('AI failure remains visible and does not apply or discard an existing plan', async () => {
  endpoints.aiShootPlan.mockRejectedValue({ response: { data: { detail: 'Ollama is offline' } } });
  const apply = jest.fn();
  act(() => root.render(<ShootPlanner characterId="c" workflow={workflow} count={4} lockScenario appliedFrames={frames} onApply={apply} />));
  act(() => input(container.querySelector('textarea'), 'make the lighting warm'));
  await act(async () => button('Revise whole').click());
  expect(container.querySelector('[role="alert"]').textContent).toBe('Ollama is offline');
  expect(apply).not.toHaveBeenCalled();
  expect(button('Apply reviewed')).toBeDefined();
});
