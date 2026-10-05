import { writeDescriptionDraft, readDescriptionDraft } from '@/lib/builderDraft';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import AiAssistBar from './AiAssistBar';
import { endpoints } from '@/lib/api';
import { DEFAULT_DNA } from '@/lib/dna';
jest.mock('@/lib/api', () => ({ endpoints: {
  listSavedDescriptions: jest.fn(), createSavedDescription: jest.fn(),
  deleteSavedDescription: jest.fn(), aiSceneDraft: jest.fn(),
} }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  writeDescriptionDraft('');
  jest.clearAllMocks();
  endpoints.listSavedDescriptions.mockResolvedValue([]);
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const button = label => Array.from(container.querySelectorAll('button')).find(item => item.textContent.includes(label));
const render = async (props = {}) => {
  await act(async () => root.render(<AiAssistBar dna={DEFAULT_DNA} onApplySubjects={() => {}} {...props} />));
  await act(async () => button('Describe it').click());
};
const type = (element, value) => act(() => {
  Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
it('restores unfinished text and keeps it after applying a scene', async () => {
  writeDescriptionDraft('An adult in a garden');
  endpoints.aiSceneDraft.mockResolvedValue({ subjects: [{ dna: DEFAULT_DNA }] });
  const onApplySubjects = jest.fn();
  await render({ onApplySubjects });
  const input = container.querySelector('[data-testid="input-ai-freeform"]');
  expect(input.value).toBe('An adult in a garden');
  await act(async () => button('Draft scene').click());
  await act(async () => button('Apply settings').click());
  expect(onApplySubjects).toHaveBeenCalledTimes(1);
  expect(input.value).toBe('An adult in a garden');
  expect(readDescriptionDraft()).toBe(input.value);
});
it('saves the original text under a name without calling the AI', async () => {
  endpoints.createSavedDescription.mockResolvedValue({ id: 'saved-1', name: 'Garden', text: 'Adult in a garden' });
  await render();
  type(container.querySelector('[data-testid="input-ai-freeform"]'), 'Adult in a garden');
  type(container.querySelector('[aria-label="Description name"]'), 'Garden');
  await act(async () => button('Save description').click());
  expect(endpoints.createSavedDescription).toHaveBeenCalledWith({ name: 'Garden', text: 'Adult in a garden' });
  expect(endpoints.aiSceneDraft).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="Saved descriptions"]').value).toBe('saved-1');
});
it('loads a server-saved description and deletes only the saved copy', async () => {
  endpoints.listSavedDescriptions.mockResolvedValue([{ id: 'saved-1', name: 'Garden', text: 'Adult in a garden' }]);
  endpoints.deleteSavedDescription.mockResolvedValue({ ok: true });
  await render();
  const select = container.querySelector('select');
  act(() => { select.value = 'saved-1'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.querySelector('[data-testid="input-ai-freeform"]').value).toBe('Adult in a garden');
  await act(async () => container.querySelector('[aria-label="Delete saved description"]').click());
  expect(endpoints.deleteSavedDescription).toHaveBeenCalledWith('saved-1');
  expect(container.querySelector('select')).toBeNull();
  expect(container.querySelector('[data-testid="input-ai-freeform"]').value).toBe('Adult in a garden');
});

it('clears the current text and preview while preserving saved descriptions for reuse', async () => {
  endpoints.listSavedDescriptions.mockResolvedValue([{id:'saved-1',name:'Garden',text:'Adult in a garden'}]);
  endpoints.aiSceneDraft.mockResolvedValue({subjects:[{dna:DEFAULT_DNA}]});
  const onApplySubjects=jest.fn();
  await render({onApplySubjects});
  const select=container.querySelector('[aria-label="Saved descriptions"]');
  act(()=>{select.value='saved-1';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>button('Draft scene').click());
  expect(container.querySelector('[data-testid="ai-dna-preview"]')).not.toBeNull();
  act(()=>container.querySelector('[aria-label="Clear description"]').click());
  expect(container.querySelector('[data-testid="input-ai-freeform"]').value).toBe('');
  expect(container.querySelector('[data-testid="ai-dna-preview"]')).toBeNull();
  expect(readDescriptionDraft()).toBe('');
  expect(container.querySelector('[aria-label="Saved descriptions"]').value).toBe('');
  expect(endpoints.deleteSavedDescription).not.toHaveBeenCalled();
  expect(onApplySubjects).not.toHaveBeenCalled();
  act(()=>{select.value='saved-1';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector('[data-testid="input-ai-freeform"]').value).toBe('Adult in a garden');
});
