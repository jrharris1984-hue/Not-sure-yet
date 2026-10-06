import { act } from 'react';
import { createRoot } from 'react-dom/client';
import AppearanceSettings from './AppearanceSettings';
import { getStudioTheme, initializeStudioTheme } from '@/lib/studioThemes';
let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; window.localStorage.clear(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); initializeStudioTheme()(); });
test('selecting a theme updates app variables, selection and persistent preference immediately', () => {
  act(() => root.render(<AppearanceSettings />));
  act(() => container.querySelector('[data-testid="theme-spider"]').click());
  expect(getStudioTheme()).toBe('spider'); expect(document.documentElement.dataset.studioTheme).toBe('spider');
  expect(document.documentElement.style.getPropertyValue('--studio-accent')).toBe('#fb7185');
  expect(container.querySelector('[data-testid="theme-spider"]').getAttribute('aria-pressed')).toBe('true');
  const cleanup = initializeStudioTheme(); expect(document.documentElement.dataset.studioTheme).toBe('spider'); cleanup();
});
test('invalid saved themes fall back to Studio and resetting restores default colors', () => {
  window.localStorage.setItem('ultra-studio:color-theme:v1', 'bad-theme');
  const cleanup = initializeStudioTheme(); expect(getStudioTheme()).toBe('studio'); cleanup();
  act(() => root.render(<AppearanceSettings />));
  act(() => container.querySelector('[data-testid="theme-ocean"]').click());
  act(() => container.querySelector('[data-testid="theme-studio"]').click());
  expect(document.documentElement.style.getPropertyValue('--studio-accent')).toBe('#86efac');
});
