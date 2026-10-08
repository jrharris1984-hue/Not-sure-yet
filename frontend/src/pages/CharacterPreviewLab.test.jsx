import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CharacterPreviewLab from './CharacterPreviewLab';
import CharacterPreviewEntry from '@/components/CharacterPreviewEntry';
import { endpoints } from '@/lib/api';
import { CHARACTER_PREVIEW_DRAFT_KEY, CHARACTER_PREVIEW_OPTIONS_KEY } from '@/lib/characterPreview';

jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
const mockInvalidate = jest.fn();
const mockQc = { invalidateQueries: mockInvalidate };
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => mockQc, useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'workflows'
  ? [{ id: 'image', kind: 'image', prompt_style: 'chroma', name: 'Chroma' }, { id: 'video', kind: 'video', name: 'Video' }] : {} }) }));
jest.mock('@/lib/api', () => ({ API_BASE: '/api', endpoints: { dispatchRender: jest.fn(), pollRender: jest.fn(), createCharacter: jest.fn(), updateCharacter: jest.fn(), aiRefine: jest.fn(), aiSuggest: jest.fn() } }));
jest.mock('@/components/UniversalLoraPicker', () => () => null);
jest.mock('@/components/DnaSection', () => ({ value, onChange }) => <button onClick={() => onChange({ ...value, age: 42 })}>Change age</button>);
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); sessionStorage.clear(); jest.clearAllMocks();
  container = document.createElement('div'); root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

test('home entry links to its separate preview lab', () => {
  act(() => root.render(<CharacterPreviewEntry />));
  expect(container.querySelector('a').getAttribute('href')).toBe('/create/character-preview');
  expect(container.textContent).toContain('Character Preview Lab');
});

test('lab drafts stay separate, preview requests are manual, and edits flag an older image', async () => {
  localStorage.setItem('regular-editor-draft', 'untouched');
  act(() => root.render(<CharacterPreviewLab />));
  expect(endpoints.dispatchRender).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="Preview workflow"]').textContent).not.toContain('Video');
  endpoints.dispatchRender.mockResolvedValue({ id: 'preview', status: 'done', output_files: ['/test.png'] });
  const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Update Preview');
  await act(async () => button.click());
  expect(endpoints.dispatchRender.mock.calls[0][0].hidden_from_gallery).toBe(true);
  expect(container.querySelector('img').getAttribute('src')).toBe('/test.png');
  act(() => [...container.querySelectorAll('button')].find(item => item.textContent === 'Change age').click());
  expect(container.textContent).toContain('Earlier selections');
  expect(JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_DRAFT_KEY)).identity.age).toBe(42);
  expect(localStorage.getItem('regular-editor-draft')).toBe('untouched');
});

const click = text => [...container.querySelectorAll('button')].find(button => button.textContent === text).click();
const type = (label, value) => {
  const input = container.querySelector(`[aria-label="${label}"]`);
  const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

test('locked seeds repeat, unlocked updates choose fresh seeds, and capture reuses the displayed seed', async () => {
  endpoints.dispatchRender.mockImplementation(async body => ({ id: `render-${endpoints.dispatchRender.mock.calls.length}`, status: 'done', output_files: [body.hidden_from_gallery ? '/preview.png' : '/capture.png'] }));
  act(() => root.render(<CharacterPreviewLab />));
  expect(container.querySelector('[aria-label="Lock preview seed"]').checked).toBe(true);
  expect([...container.querySelectorAll('button')].find(button => button.textContent === 'Capture full size to Gallery').disabled).toBe(true);
  await act(async () => click('Update Preview'));
  await act(async () => click('Update Preview'));
  expect(endpoints.dispatchRender.mock.calls[0][0].seed).toBe(endpoints.dispatchRender.mock.calls[1][0].seed);
  act(() => container.querySelector('[aria-label="Lock preview seed"]').click());
  const random = jest.spyOn(Math, 'random').mockReturnValueOnce(0.25).mockReturnValueOnce(0.5);
  await act(async () => click('Update Preview'));
  const firstFresh = endpoints.dispatchRender.mock.calls[2][0].seed;
  await act(async () => click('Update Preview'));
  const lastPreview = endpoints.dispatchRender.mock.calls[3][0];
  expect(lastPreview.seed).not.toBe(firstFresh);
  expect(container.textContent).not.toContain('Earlier selections');
  await act(async () => click('Capture full size to Gallery'));
  const capture = endpoints.dispatchRender.mock.calls[4][0];
  expect(capture.seed).toBe(lastPreview.seed);
  expect(capture.hidden_from_gallery).toBe(false);
  expect(capture.parent_render_id).toBe('render-4');
  expect(Math.max(capture.width, capture.height)).toBeGreaterThan(640);
  expect(capture.prompt_positive).toBe(lastPreview.prompt_positive);
  expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['renders'] });
  expect(container.querySelector('[alt="AI character preview"]').getAttribute('src')).toBe('/preview.png');
  expect(container.querySelector('[alt="Full-size character capture"]').getAttribute('src')).toBe('/capture.png');
  expect(JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_OPTIONS_KEY))).toMatchObject({ seed: lastPreview.seed, seedLocked: false });
  random.mockRestore();
});

test('saving creates a character once, later saves update it, and captures are associated with it', async () => {
  endpoints.createCharacter.mockResolvedValue({ id: 'saved-character' });
  endpoints.updateCharacter.mockResolvedValue({ id: 'saved-character' });
  endpoints.dispatchRender.mockResolvedValue({ id: 'image', status: 'done', output_files: ['/image.png'] });
  act(() => root.render(<CharacterPreviewLab />));
  act(() => type('Lab character name', 'My character'));
  await act(async () => click('Save character'));
  expect(endpoints.createCharacter).toHaveBeenCalledWith(expect.objectContaining({ name: 'My character', subjects: [expect.objectContaining({ label: 'A' })] }));
  expect(container.querySelector('a[href="/character/saved-character"]')).toBeTruthy();
  act(() => click('Change age'));
  expect(container.textContent).toContain('unsaved changes');
  await act(async () => click('Save character changes'));
  expect(endpoints.createCharacter).toHaveBeenCalledTimes(1);
  expect(endpoints.updateCharacter).toHaveBeenCalledWith('saved-character', expect.objectContaining({ dna: expect.objectContaining({ identity: expect.objectContaining({ age: 42 }) }) }));
  await act(async () => click('Update Preview'));
  expect(endpoints.dispatchRender.mock.calls[0][0].character_id).toBe('saved-character');
  await act(async () => click('Capture full size to Gallery'));
  expect(endpoints.dispatchRender.mock.calls[1][0].character_id).toBe('saved-character');
  expect(JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_OPTIONS_KEY)).characterId).toBe('saved-character');
});

test('editing a seed or DNA requires a fresh preview before capture and invalid seeds block generation', async () => {
  endpoints.dispatchRender.mockResolvedValue({ id: 'image', status: 'done', output_files: ['/image.png'] });
  act(() => root.render(<CharacterPreviewLab />));
  await act(async () => click('Update Preview'));
  act(() => type('Preview seed', '98'));
  expect([...container.querySelectorAll('button')].find(button => button.textContent === 'Capture full size to Gallery').disabled).toBe(true);
  act(() => type('Preview seed', '-1'));
  expect(container.textContent).toContain('Seed must be a whole number');
  expect([...container.querySelectorAll('button')].find(button => button.textContent === 'Update Preview').disabled).toBe(true);
});

test('AI suggestions are reviewed and applied manually before the preview becomes stale', async () => {
  endpoints.dispatchRender.mockResolvedValue({ id: 'image', status: 'done', output_files: ['/image.png'] });
  endpoints.aiRefine.mockResolvedValue({ dna: { identity: { age: 45 } } });
  act(() => root.render(<CharacterPreviewLab />));
  await act(async () => click('Update Preview'));
  act(() => type('Character AI instruction', 'Make the character 45'));
  await act(async () => click('Suggest character changes'));
  expect(JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_DRAFT_KEY)).identity.age).not.toBe(45);
  expect(container.textContent).toContain('Review 1 proposed changes');
  act(() => click('Apply AI changes'));
  expect(JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_DRAFT_KEY)).identity.age).toBe(45);
  expect(container.textContent).toContain('Earlier selections');
  expect(endpoints.dispatchRender).toHaveBeenCalledTimes(1);
});

test('save failures are retryable and duplicate clicks cannot create duplicate characters', async () => {
  let resolve;
  endpoints.createCharacter.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  act(() => root.render(<CharacterPreviewLab />));
  act(() => { const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Save character'); button.click(); button.click(); });
  expect(container.textContent).toContain('Saving character…');
  expect(endpoints.createCharacter).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ id: 'saved' }));
  endpoints.updateCharacter.mockRejectedValueOnce({ response: { data: { detail: 'Server unavailable' } } }).mockResolvedValueOnce({ id: 'saved' });
  await act(async () => click('Save character changes'));
  expect(container.textContent).toContain('Server unavailable');
  await act(async () => click('Save character changes'));
  expect(container.textContent).not.toContain('Server unavailable');
});
