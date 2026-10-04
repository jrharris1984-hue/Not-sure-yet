import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MediaLibraryPreview from './MediaLibraryPreview';
jest.mock('@/lib/api', () => ({ endpoints: {
  mediaLibraryThumbnailUrl: id => `/thumb/${id}`,
  mediaLibraryOriginalUrl: id => `/original/${id}`,
} }));
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); root = createRoot(container); });
afterEach(() => act(() => root.unmount()));
const render = (item, original = false) => act(() => root.render(<MediaLibraryPreview item={item} original={original} />));
const error = () => act(() => container.querySelector('img').dispatchEvent(new Event('error')));

test('analyzed image without thumbnail metadata requests its original image', () => {
  render({ id: 7, media_type: 'image', thumbnail_url: null, analysis_status: 'complete' });
  expect(container.querySelector('img').getAttribute('src')).toBe('/original/7');
});
test('broken thumbnail falls back to original, then explains unavailable previews without retry loops', () => {
  render({ id: 8, media_type: 'image', thumbnail_url: '/old-thumbnail' });
  expect(container.querySelector('img').getAttribute('src')).toBe('/thumb/8');
  error(); expect(container.querySelector('img').getAttribute('src')).toBe('/original/8');
  error(); expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('[role="status"]').textContent).toContain('Preview unavailable');
});
test('detail view falls back to thumbnail if the original cannot load', () => {
  render({ id: 9, media_type: 'image' }, true);
  error(); expect(container.querySelector('img').getAttribute('src')).toBe('/thumb/9');
});
test('video preview attempts a thumbnail without requiring metadata and never loads a video in an image element', () => {
  render({ id: 10, media_type: 'video' });
  expect(container.querySelector('img').getAttribute('src')).toBe('/thumb/10');
  error(); expect(container.querySelector('img')).toBeNull();
});
