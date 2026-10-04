import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MediaCorrections from './MediaCorrections';
import { endpoints } from '@/lib/api';
jest.mock('@/lib/api', () => ({ endpoints: { mediaLibraryTags: jest.fn(), saveMediaCorrections: jest.fn(), reanalyzeMedia: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { tags: ['mirror reflection', 'favorites'] }, refetch: jest.fn() }) }));
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); root = createRoot(container); jest.clearAllMocks(); });
afterEach(() => act(() => root.unmount()));
const button = text => [...container.querySelectorAll('button')].find(n => n.textContent.includes(text));
const input = (node, value) => { Object.getOwnPropertyDescriptor(node.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLSelectElement.prototype, 'value').set.call(node, value); node.dispatchEvent(new Event(node.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true })); };

test('editing count confirms it, blocks reanalysis until saving, and saves tags separately', async () => {
  const saved = jest.fn();
  act(() => root.render(<MediaCorrections item={{ id: 3, person_count: 2, general_tags: ['couple'] }} onSaved={saved} />));
  act(() => input(container.querySelector('input[type="number"]'), '1'));
  expect(button('Reanalyze').disabled).toBe(true);
  const countConfirm = container.querySelector('input[type="checkbox"]'); expect(countConfirm.checked).toBe(true);
  const tagInput = container.querySelector('input[list]');
  act(() => input(tagInput, 'Favorites'));
  const tagSelect = [...container.querySelectorAll('select')].find(n => [...n.options].some(o => o.value === 'organization'));
  act(() => input(tagSelect, 'organization'));
  act(() => button('Add tag').click());
  await act(async () => button('Save corrections').click());
  const body = endpoints.saveMediaCorrections.mock.calls[0][1];
  expect(body.values.person_count).toBe(1);
  expect(body.confirmed_fields).toContain('person_count');
  expect(body.organization_tags).toEqual(['favorites']);
  expect(body.descriptive_tags).not.toContain('favorites');
  expect(saved).toHaveBeenCalled();
  expect(button('Reanalyze').disabled).toBe(false);
});

test('save failure keeps edits and blocks reanalysis', async () => {
  endpoints.saveMediaCorrections.mockRejectedValue({ response: { data: { detail: 'Server unavailable' } } });
  act(() => root.render(<MediaCorrections item={{ id: 4 }} onSaved={jest.fn()} />));
  act(() => input(container.querySelector('input[type="number"]'), '1'));
  await act(async () => button('Save corrections').click());
  expect(container.querySelector('[role="status"]').textContent).toBe('Server unavailable');
  expect(container.querySelector('input[type="number"]').value).toBe('1');
  expect(button('Reanalyze').disabled).toBe(true);
});

test('saved confirmed fields are loaded and reanalysis does not send draft replacements', async () => {
  const saved = jest.fn();
  act(() => root.render(<MediaCorrections item={{ id: 5, correction_review: { values: { person_count: 1 }, confirmed_fields: ['person_count'], descriptive_tags: ['mirror reflection'] } }} onSaved={saved} />));
  expect(container.querySelector('input[type="checkbox"]').checked).toBe(true);
  await act(async () => button('Reanalyze').click());
  expect(endpoints.reanalyzeMedia).toHaveBeenCalledWith(5);
  expect(saved).toHaveBeenCalled();
});
