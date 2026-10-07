import {act} from 'react';
import {createRoot} from 'react-dom/client';
import CastPoseOptions from './CastPoseOptions';
test('two-person and group pickers retain the desktop choices and selected state', () => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),onSelect=jest.fn();
  try {
    act(() => root.render(<CastPoseOptions count={2} value="back to back" onSelect={onSelect}/>));
    expect(container.querySelectorAll('button')).toHaveLength(7);
    expect(container.querySelector('[aria-pressed="true"]').textContent).toBe('back to back');
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent==='walking together').click());
    expect(onSelect).toHaveBeenCalledWith('walking together');
    act(() => root.render(<CastPoseOptions count={3}/>));
    expect(container.textContent).toContain('staggered lineup');
    act(() => root.render(<CastPoseOptions count={1}/>));
    expect(container.textContent).toBe('');
  } finally {act(() => root.unmount());}
});
