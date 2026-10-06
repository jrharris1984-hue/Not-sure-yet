import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MobileBuilderSheets from './MobileBuilderSheets';

let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
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
  expect(container.querySelector('[role="dialog"]')).toBeNull(); click('More tools'); expect(onTools).toHaveBeenCalledTimes(1);
});
test('category changes close stale detail controls and generation respects readiness', () => {
  paint(); click('Colorblack'); paint({ section: sections[1], canGenerate: false });
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Generate (2)').disabled).toBe(true);
});
