import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import GalleryCarousel from './GalleryCarousel';
let container, root, ref, onNavigate;
const records = [{ id: 'a', url: 'a.png' }, { id: 'b', url: 'b.png' }, { id: 'c', url: 'c.png' }];
beforeEach(() => { jest.useFakeTimers(); global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); ref = createRef(); onNavigate = jest.fn(); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
const view = () => container.querySelector('[data-testid="gallery-carousel"]');
function paint(current = records[1], extra = {}) {
  act(() => root.render(<GalleryCarousel ref={ref} current={current} previous={records[0]} next={records[2]} onNavigate={onNavigate} outputUrl={item => item.url} isVideo={url => url.endsWith('.mp4')} {...extra} />));
  view().getBoundingClientRect = () => ({ width: 300 });
  view().scrollTo = jest.fn(({ left }) => { view().scrollLeft = left; });
}
function scroll(left) { act(() => { view().scrollLeft = left; view().dispatchEvent(new Event('scroll')); }); }
test('native swipe commits after scrolling settles and recenters without a reverse animation', () => {
  paint(); scroll(430); act(() => jest.advanceTimersByTime(100)); expect(onNavigate).not.toHaveBeenCalled();
  scroll(600); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).toHaveBeenCalledWith(1);
  paint(records[2]); expect(view().scrollLeft).toBe(300);
  expect(container.querySelector('[data-testid="gallery-carousel-track"]').style.transform).toBe('');
  scroll(300); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).toHaveBeenCalledTimes(1);
});
test('incomplete swipes stay on the current picture', () => {
  paint(); scroll(350); act(() => jest.advanceTimersByTime(160));
  expect(onNavigate).not.toHaveBeenCalled(); expect(view().scrollLeft).toBe(300);
});
test('arrows use native smooth scroll once and closing cancels pending navigation', () => {
  paint(); act(() => { ref.current.navigate(-1); ref.current.navigate(-1); });
  expect(view().scrollTo).toHaveBeenCalledTimes(1); expect(view().scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'smooth' });
  scroll(0); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).toHaveBeenCalledWith(-1);
  act(() => ref.current.navigate(1)); act(() => root.render(null)); act(() => jest.advanceTimersByTime(320)); expect(onNavigate).toHaveBeenCalledTimes(1);
});
test('reduced motion switches immediately and a single item never navigates', () => {
  const original = window.matchMedia; window.matchMedia = () => ({ matches: true });
  try { paint(); act(() => ref.current.navigate(1)); expect(onNavigate).toHaveBeenCalledWith(1); }
  finally { window.matchMedia = original; }
  onNavigate.mockClear(); paint(records[1], { previous: null, next: null });
  act(() => ref.current.navigate(1)); scroll(600); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).not.toHaveBeenCalled();
});

test('pausing with a finger down does not change the selected record until release', () => {
  paint();
  act(() => view().dispatchEvent(new Event('touchstart', { bubbles: true })));
  scroll(600); act(() => jest.advanceTimersByTime(500)); expect(onNavigate).not.toHaveBeenCalled();
  const release = new Event('touchend', { bubbles: true }); Object.defineProperty(release, 'touches', { value: [] });
  act(() => view().dispatchEvent(release)); act(() => jest.advanceTimersByTime(160));
  expect(onNavigate).toHaveBeenCalledWith(1);
});

test('a fast native flick can cross several pictures without resetting the scroll position', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: `item-${i}`, url: `${i}.png` }));
  paint(items[1], { items }); scroll(700); act(() => jest.advanceTimersByTime(80));
  scroll(1500); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).toHaveBeenCalledWith(4);
  paint(items[5], { items }); expect(view().scrollLeft).toBe(1500);
  scroll(1500); act(() => jest.advanceTimersByTime(160)); expect(onNavigate).toHaveBeenCalledTimes(1);
});
