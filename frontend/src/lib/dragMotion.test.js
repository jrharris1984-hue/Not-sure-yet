import { sheetSnap, swipeDestination } from './dragMotion';
const stops = [{ name: 'peek', pixels: 115 }, { name: 'half', pixels: 400 }, { name: 'expanded', pixels: 600 }];
test('sheet snapping uses both distance and release momentum', () => {
  expect(sheetSnap(460, 0, stops).name).toBe('half');
  expect(sheetSnap(460, -1, stops).name).toBe('expanded');
  expect(sheetSnap(300, 1.5, stops).name).toBe('peek');
});
test('carousel distinguishes short movements, flicks and deliberate swipes', () => {
  expect(swipeDestination(-20, 0, 300)).toBe(0);
  expect(swipeDestination(-20, -.8, 300)).toBe(1);
  expect(swipeDestination(100, 0, 300)).toBe(-1);
  expect(swipeDestination(4, 2, 300)).toBe(0);
});
