import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CharacterPreviewAssist from './CharacterPreviewAssist';
import { endpoints } from '@/lib/api';
jest.mock('@/lib/api', () => ({ endpoints: { aiRefine: jest.fn(), aiSuggest: jest.fn() } }));
const section = { key: 'identity', title: 'Identity', fields: [{ key: 'age', label: 'Age' }, { key: 'ethnicity', label: 'Heritage' }] };
let root, container;
const props = { dna: { identity: { age: 30, ethnicity: 'british' } }, sections: [section], section, locks: {}, fieldLocks: {}, onApply: jest.fn() };
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks(); container = document.createElement('div'); root = createRoot(container); });
afterEach(() => act(() => root.unmount()));
const click = text => [...container.querySelectorAll('button')].find(button => button.textContent === text).click();

test('category ideas offer multiple options and exclude locked fields from application', async () => {
  endpoints.aiSuggest.mockResolvedValue({ options: [{ age: 45, ethnicity: 'mexican' }, { age: 50, ethnicity: 'irish' }] });
  act(() => root.render(<CharacterPreviewAssist {...props} fieldLocks={{ identity: { age: true } }} />));
  await act(async () => click('Ideas for Identity'));
  expect(props.onApply).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="AI suggestion option"]').options).toHaveLength(2);
  act(() => { const select = container.querySelector('select'); select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Apply AI changes'));
  expect(props.onApply).toHaveBeenCalledWith({ identity: { age: 30, ethnicity: 'irish' } });
});

test('edits during an AI request make the returned suggestion stale and block application', async () => {
  let resolve;
  endpoints.aiSuggest.mockImplementation(() => new Promise(done => { resolve = done; }));
  act(() => root.render(<CharacterPreviewAssist {...props} />));
  act(() => click('Ideas for Identity'));
  act(() => root.render(<CharacterPreviewAssist {...props} dna={{ identity: { age: 40, ethnicity: 'british' } }} />));
  await act(async () => resolve({ options: [{ age: 45 }] }));
  expect(container.textContent).toContain('Request a fresh suggestion');
  expect([...container.querySelectorAll('button')].find(button => button.textContent === 'Apply AI changes').disabled).toBe(true);
  expect(props.onApply).not.toHaveBeenCalled();
});

test('AI failures stay in the panel and can be retried', async () => {
  endpoints.aiSuggest.mockRejectedValueOnce({ response: { data: { detail: 'Ollama unavailable' } } }).mockResolvedValueOnce({ options: [{ age: 45 }] });
  act(() => root.render(<CharacterPreviewAssist {...props} />));
  await act(async () => click('Ideas for Identity'));
  expect(container.querySelector('[role="alert"]').textContent).toContain('Ollama unavailable');
  await act(async () => click('Ideas for Identity'));
  expect(container.querySelector('[role="alert"]')).toBeNull(); expect(container.textContent).toContain('Review 1 proposed changes');
});
