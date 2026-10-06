import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MobileBuilderSheets from './MobileBuilderSheets';

let root, container;
beforeEach(() => { jest.useFakeTimers(); global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
const sections = [{ key: 'hair', title: 'Hair', fields: [{ key: 'color', label: 'Color' }] }, { key: 'scenario', title: 'Scenario', fields: [] }];
const defaults = { sections, section: sections[0], subjects: [{ id: 'a', label: 'A' }], activeId: 'a', values: { color: 'black' },
  renderControls: field => <button type="button">Edit {field}</button>, outputControls: <div>Workflow settings</div>, imageCount: 2, canGenerate: true };
const paint = props => act(() => root.render(<MobileBuilderSheets {...defaults} {...props} />));
const click = text => act(() => Array.from(container.querySelectorAll('button')).find(button => button.textContent === text).click());
test('opens a scoped detail sheet and returns to the unchanged category selection', () => {
  paint(); click('Colorblack');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Edit color');
  expect(container.querySelector('.sheet-scoped-scrim').parentElement).toBe(container.querySelector('[data-testid="primary-creation-sheet"]'));
  expect(container.querySelector('.sheet-primary-content').getAttribute('aria-hidden')).toBe('true');
  click('Done');
  act(() => jest.advanceTimersByTime(320));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).toContain('Colorblack');
});
test('exposes scenario, people, subject switching and generation without changing the cast', () => {
  const onSection = jest.fn(), onPeople = jest.fn(), onSubject = jest.fn(), onGenerate = jest.fn();
  paint({ onSection, onPeople, onSubject, onGenerate });
  click('Scenario'); click('People · 1'); click('Edit A'); click('Generate (2)');
  expect(onSection).toHaveBeenCalledWith('scenario'); expect(onPeople).toHaveBeenCalledTimes(1);
  expect(onSubject).toHaveBeenCalledWith('a'); expect(onGenerate).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('1 person');
});
test('settings, Escape dismissal, and More tools remain reachable', () => {
  const onTools = jest.fn(); paint({ onTools }); click('Settings');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Workflow settings');
  act(() => container.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  act(() => jest.advanceTimersByTime(320));
  expect(container.querySelector('[role="dialog"]')).toBeNull(); click('More tools'); expect(onTools).toHaveBeenCalledTimes(1);
});
test('category changes close stale detail controls and generation respects readiness', () => {
  paint(); click('Colorblack'); paint({ section: sections[1], canGenerate: false });
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Generate (2)').disabled).toBe(true);
});

function pointer(target, type, y, time) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, { pointerId: { value: 1 }, clientY: { value: y }, timeStamp: { value: time }, button: { value: 0 } });
  act(() => target.dispatchEvent(event));
}
test('primary sheet follows the finger before release and settles to an expanded stop', () => {
  paint(); const sheet = container.querySelector('[data-testid="primary-creation-sheet"]');
  sheet.getBoundingClientRect = () => ({ height: 400 });
  sheet.parentElement.getBoundingClientRect = () => ({ height: 800 });
  const handle = sheet.querySelector('.sheet-handle');
  pointer(handle, 'pointerdown', 400, 0); pointer(handle, 'pointermove', 240, 100);
  expect(sheet.style.height).toBe('560px'); expect(sheet.style.transition).toBe('none');
  pointer(handle, 'pointerup', 240, 200);
  expect(sheet.className).toContain('sheet-expanded'); expect(sheet.style.height).toBe('');
});
test('detail drag tracks movement, returns on cancellation, and animates dismissal', () => {
  paint(); click('Colorblack'); let sheet = container.querySelector('[role="dialog"]');
  let handle = sheet.querySelector('.sheet-handle');
  pointer(handle, 'pointerdown', 200, 0); pointer(handle, 'pointermove', 260, 100);
  expect(sheet.style.transform).toContain('60px');
  pointer(handle, 'pointercancel', 260, 200);
  expect(sheet.style.transform).toContain('0px');
  pointer(handle, 'pointerdown', 200, 300); pointer(handle, 'pointermove', 350, 500); pointer(handle, 'pointerup', 350, 600);
  expect(sheet.className).toContain('sheet-closing');
  act(() => jest.advanceTimersByTime(320)); expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('switching categories preserves the expanded sheet height', () => {
  const onSection = jest.fn(); paint({ onSection });
  const sheet = container.querySelector('[data-testid="primary-creation-sheet"]');
  act(() => sheet.querySelector('.sheet-handle').click());
  expect(sheet.className).toContain('sheet-expanded');
  click('Scenario'); expect(onSection).toHaveBeenCalledWith('scenario');
  paint({ onSection, section: sections[1] });
  expect(sheet.className).toContain('sheet-expanded');
});

test('selected options review opens the selected category and person accents follow the active subject', () => {
  const onSection = jest.fn();
  paint({ onSection, subjects: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], activeId: 'b',
    selectedItems: [{ section: 'hair', field: 'color', category: 'Hair', label: 'Color', value: 'black' }] });
  expect(container.querySelector('[data-testid="mobile-sheet-builder"]').style.getPropertyValue('--person-accent')).toBe('#93c5fd');
  expect(container.querySelectorAll('.studio-person-badge')).toHaveLength(2);
  click('Selected · 1');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Hair · Color');
  act(() => container.querySelector('.studio-selected-option').click());
  expect(onSection).toHaveBeenCalledWith('hair');
});

test('Reset beside Save calls the current-person reset action', () => {
  const onReset = jest.fn(); paint({ onReset }); click('Reset');
  expect(onReset).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="Reset current person"]')).not.toBeNull();
});
