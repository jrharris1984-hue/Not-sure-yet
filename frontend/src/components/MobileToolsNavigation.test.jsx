import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MobileToolsNavigation from './MobileToolsNavigation';
let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
test('finds presets through named categories and offers a direct return to the builder', () => {
  const onGroup = jest.fn(), onBack = jest.fn();
  act(() => root.render(<MobileToolsNavigation group="overview" onGroup={onGroup} onBack={onBack} />));
  expect(container.querySelector('nav')).toBeNull();
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent.includes('Presets & people')).click());
  expect(onGroup).toHaveBeenCalledWith('presets');
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent.includes('Back to builder')).click());
  expect(onBack).toHaveBeenCalledTimes(1);
});
test('marks the open category and allows switching or returning to all tools', () => {
  const onGroup = jest.fn();
  act(() => root.render(<MobileToolsNavigation group="references" onGroup={onGroup} />));
  expect(container.querySelector('h1').textContent).toBe('References & pose');
  expect(container.querySelector('[aria-pressed="true"]').textContent).toBe('References & pose');
  act(() => [...container.querySelectorAll('nav button')].find(button => button.textContent === 'Model & output').click());
  expect(onGroup).toHaveBeenCalledWith('generation');
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'All tools').click());
  expect(onGroup).toHaveBeenCalledWith('overview');
});
