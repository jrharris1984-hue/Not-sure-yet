import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PromptResearchNotes } from './WebPromptResearch';

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

test('renders shared research sources and distinguishes retrieved sources from citations', () => {
  act(() => root.render(<PromptResearchNotes result={{ sources: [
    { id: 'S1', title: 'Camera guide', url: 'https://example.com/guide', cited: true },
    { id: 'S2', title: 'Lighting guide', url: 'https://example.com/light', cited: false },
  ] }} />));
  expect(container.querySelectorAll('a')).toHaveLength(2);
  expect(container.querySelector('a').textContent).toBe('[S1] Camera guide');
  expect(container.querySelector('a').getAttribute('rel')).toBe('noreferrer');
  expect(container.querySelectorAll('li')[0].textContent).not.toContain('not cited');
  expect(container.querySelectorAll('li')[1].textContent).toContain('not cited by assistant');
});

test('renders nested prompt refinement notes and omits unusable links', () => {
  act(() => root.render(<PromptResearchNotes result={{ research: {
    changes: ['Clarified lighting', null],
    sources: [null, { title: 'Unlinked reference', url: 'javascript:alert(1)' }],
  } }} />));
  expect(container.textContent).toContain('Clarified lighting');
  expect(container.textContent).toContain('Unlinked reference');
  expect(container.querySelector('a')).toBeNull();
});

test('renders nothing when there is no research metadata', () => {
  for (const result of [undefined, null, { positive: 'Original prompt' }, { sources: null, changes: {} }]) {
    act(() => root.render(<PromptResearchNotes result={result} />));
    expect(container.childNodes).toHaveLength(0);
  }
});
