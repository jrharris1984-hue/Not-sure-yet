import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import GalleryCarousel from './GalleryCarousel';
let container, root, ref, onNavigate;
const records = [{ id: 'a', url: 'a.png' }, { id: 'b', url: 'b.png' }, { id: 'c', url: 'c.png' }];
beforeEach(() => { jest.useFakeTimers(); global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); ref = createRef(); onNavigate = jest.fn(); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
function paint(current = records[1], extra = {}) {
  act(() => root.render(<GalleryCarousel ref={ref} current={current} previous={records[0]} next={records[2]} onNavigate={onNavigate} outputUrl={item => item.url} isVideo={url => url.endsWith('.mp4')} {...extra} />));
  container.querySelector('[data-testid="gallery-carousel"]').getBoundingClientRect = () => ({ width: 300 });
}
function pointer(type, x, y, time = 100) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, { pointerId: { value: 1 }, clientX: { value: x }, clientY: { value: y }, timeStamp: { value: time }, button: { value: 0 } });
  act(() => container.querySelector('[data-testid="gallery-carousel"]').dispatchEvent(event));
}
const track = () => container.querySelector('[data-testid="gallery-carousel-track"]');
test('drag reveals the neighbor immediately and commits navigation only after settling', () => {
  paint(); pointer('pointerdown', 200, 20, 0); pointer('pointermove', 90, 20, 100);
  expect(track().style.transform).toContain('-110px'); expect(track().style.transition).toBe('none'); expect(onNavigate).not.toHaveBeenCalled();
  pointer('pointerup', 90, 20, 200); expect(track().style.transform).toContain('-300px');
  act(() => jest.advanceTimersByTime(320)); expect(onNavigate).toHaveBeenCalledWith(1);
  paint(records[2]); expect(track().style.transform).toContain('0px');
});
test('short drag, vertical movement and cancelled gestures preserve the current picture', () => {
  paint(); pointer('pointerdown', 200, 20, 0); pointer('pointermove', 180, 20, 200); pointer('pointerup', 180, 20, 400);
  expect(track().style.transform).toContain('0px');
  pointer('pointerdown', 200, 20, 500); pointer('pointermove', 180, 100, 600); pointer('pointerup', 100, 150, 700);
  expect(track().style.transform).toContain('0px');
  pointer('pointerdown', 200, 20, 800); pointer('pointermove', 70, 20, 900); pointer('pointercancel', 70, 20, 1000);
  act(() => jest.advanceTimersByTime(320)); expect(onNavigate).not.toHaveBeenCalled();
});
test('button navigation settles once and timers are cancelled when the viewer unmounts', () => {
  paint(); act(() => { ref.current.navigate(-1); ref.current.navigate(-1); });
  act(() => jest.advanceTimersByTime(320)); expect(onNavigate).toHaveBeenCalledTimes(1); expect(onNavigate).toHaveBeenCalledWith(-1);
  act(() => ref.current.navigate(1)); act(() => root.render(null)); act(() => jest.advanceTimersByTime(320)); expect(onNavigate).toHaveBeenCalledTimes(1);
});
test('reduced motion switches immediately and a single item never swipes', () => {
  const original = window.matchMedia; window.matchMedia = () => ({ matches: true });
  try { paint(); act(() => ref.current.navigate(1)); expect(onNavigate).toHaveBeenCalledWith(1); }
  finally { window.matchMedia = original; }
  onNavigate.mockClear(); paint(records[1], { previous: null, next: null });
  pointer('pointerdown', 250, 20, 0); pointer('pointermove', 40, 20, 100); pointer('pointerup', 40, 20, 200);
  expect(onNavigate).not.toHaveBeenCalled();
});
