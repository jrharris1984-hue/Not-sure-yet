import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CharacterPreviewLab from './CharacterPreviewLab';
import CharacterPreviewEntry from '@/components/CharacterPreviewEntry';
import { endpoints } from '@/lib/api';
import { CHARACTER_PREVIEW_DRAFT_KEY } from '@/lib/characterPreview';

jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock('@tanstack/react-query', () => ({ useQuery: ({ queryKey }) => ({ data: queryKey[0] === 'workflows'
  ? [{ id: 'image', kind: 'image', prompt_style: 'chroma', name: 'Chroma' }, { id: 'video', kind: 'video', name: 'Video' }] : {} }) }));
jest.mock('@/lib/api', () => ({ API_BASE: '/api', endpoints: { dispatchRender: jest.fn(), pollRender: jest.fn() } }));
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
