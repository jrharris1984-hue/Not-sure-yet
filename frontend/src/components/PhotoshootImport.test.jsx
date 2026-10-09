import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PhotoshootImport from './PhotoshootImport';
import { mergePhotoshootImport } from '@/lib/bulkPhotoshootImport';

let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); root = createRoot(container); });
afterEach(() => act(() => root.unmount()));
const click = text => [...container.querySelectorAll('button')].find(button => button.textContent === text).click();
const paste = text => { const input = container.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); };

test('upload, review, and explicit update mode save existing keys without automatic writes', async () => {
  const saved = { key: 'custom_existing', label: 'Existing', sequence: [{ title: 'Original' }] };
  const presets = [saved];
  const imported = [{ ...saved, sequence: [{ title: 'Edited', framing: 'portrait' }] }];
  const onSave = jest.fn(async (items, mode) => mergePhotoshootImport(presets, items, mode));
  act(() => root.render(<PhotoshootImport presets={presets} onSave={onSave} />));
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [{ size: 100, text: async () => JSON.stringify(imported) }] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(container.querySelector('textarea').value).toContain('Edited');
  act(() => click('Review import'));
  expect(container.textContent).toContain('Skip existing key'); expect(onSave).not.toHaveBeenCalled();
  act(() => { const mode = container.querySelector('select'); mode.value = 'update'; mode.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.textContent).toContain('1 to update');
  await act(async () => click('Save 1 shoot'));
  expect(onSave).toHaveBeenCalledWith(expect.any(Array), 'update');
  expect(container.textContent).toContain('updated 1');
});

test('malformed input prevents save, edits clear stale reviews, and failed saves keep the file for retry', async () => {
  const onSave = jest.fn().mockRejectedValueOnce(new Error('Server unavailable')).mockImplementationOnce(async (items, mode) => mergePhotoshootImport([], items, mode));
  act(() => root.render(<PhotoshootImport presets={[]} onSave={onSave} />));
  act(() => paste('not JSON'));
  act(() => click('Review import'));
  expect(container.querySelector('[role="alert"]').textContent).toContain('Could not read JSON'); expect(onSave).not.toHaveBeenCalled();
  act(() => click('Load example')); act(() => click('Review import'));
  await act(async () => click('Save 2 shoots'));
  expect(container.querySelector('textarea').value).toContain('Studio portrait set');
  expect(container.textContent).toContain('Server unavailable');
  await act(async () => click('Save 2 shoots'));
  expect(container.textContent).toContain('Added 2 shoots');
  act(() => click('Load example')); act(() => click('Review import'));
  act(() => paste('[]'));
  expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Save 2 shoots')).toBe(false);
});
