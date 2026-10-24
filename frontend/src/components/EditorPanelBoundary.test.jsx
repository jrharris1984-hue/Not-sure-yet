import {act} from 'react';
import {createRoot} from 'react-dom/client';
import EditorPanelBoundary from './EditorPanelBoundary';
it('contains a failed panel and retries without replacing its parent state', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const container = document.createElement('div'), root = createRoot(container);
  let fail = true;
  function Panel() { if (fail) throw new Error('broken panel'); return <p>Recovered choices</p>; }
  try {
    act(() => root.render(<><p>Toolbar remains</p><EditorPanelBoundary><Panel /></EditorPanelBoundary></>));
    expect(container.textContent).toContain('Toolbar remains');
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    fail = false;
    act(() => container.querySelector('button').click());
    expect(container.textContent).toContain('Recovered choices');
  } finally { act(() => root.unmount()); errors.mockRestore(); }
});
