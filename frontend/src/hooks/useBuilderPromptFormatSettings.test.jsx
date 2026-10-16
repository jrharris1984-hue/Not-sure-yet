import { act, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useBuilderPromptFormatSettings } from './useBuilderPromptFormatSettings';

global.IS_REACT_ACT_ENVIRONMENT = true;

function Harness({ settings }) {
  const [format, setFormat] = useState('detailed');
  const touched = useRef(false);
  useBuilderPromptFormatSettings(settings, touched, setFormat);
  return <button onClick={() => {
    touched.current = true;
    setFormat('ollama');
    localStorage.setItem('ultra-prompt-format', 'ollama');
  }}>{format}</button>;
}

describe('Builder prompt format while settings load', () => {
  let container, root;
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });
  const render = settings => act(() => root.render(<Harness settings={settings} />));

  test.each([undefined, null, {}, { builder_prompt_format: 'unknown' }])(
    'keeps the current format with unavailable or invalid settings: %p', settings => {
      expect(() => render(settings)).not.toThrow();
      expect(container.textContent).toBe('detailed');
      expect(localStorage.getItem('ultra-prompt-format')).toBeNull();
    }
  );

  test.each(['detailed', 'compact', 'scene', 'ollama'])('applies %s after settings arrive', format => {
    render(undefined);
    render({ builder_prompt_format: format });
    expect(container.textContent).toBe(format);
    expect(localStorage.getItem('ultra-prompt-format')).toBe(format);
    render(undefined);
    expect(container.textContent).toBe(format);
  });

  test('does not overwrite a manual selection when delayed settings arrive', () => {
    render(undefined);
    act(() => container.querySelector('button').click());
    render({ builder_prompt_format: 'compact' });
    expect(container.textContent).toBe('ollama');
    expect(localStorage.getItem('ultra-prompt-format')).toBe('ollama');
  });
});
