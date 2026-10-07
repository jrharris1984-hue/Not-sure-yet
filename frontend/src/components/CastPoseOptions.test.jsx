import {act} from 'react';
import {createRoot} from 'react-dom/client';
import CastPoseOptions from './CastPoseOptions';

test('two-person and group pickers expose categorized presets and selected state', () => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),onSelect=jest.fn();
  try {
    act(() => root.render(<CastPoseOptions count={2} value="back to back" onSelect={onSelect}/>));
    expect(container.textContent).toContain('Portrait');
    expect(container.textContent).toContain('Interaction');
    expect(container.textContent).toContain('Movement');
    expect(container.textContent).toContain('Seated & mixed levels');
    expect(container.textContent).toContain('Angles');
    expect(container.querySelector('[aria-pressed="true"]').textContent).toBe('back to back');
    act(() => [...container.querySelectorAll('button')].find(button => button.textContent==='walking arm in arm').click());
    expect(onSelect).toHaveBeenCalledWith('walking arm in arm');

    act(() => root.render(<CastPoseOptions count={3} value="" onSelect={onSelect}/>));
    expect(container.textContent).toContain('staggered lineup');
    expect(container.textContent).toContain('casual candid group');

    act(() => root.render(<CastPoseOptions count={1} value="" onSelect={onSelect}/>));
    expect(container.textContent).toBe('');
  } finally {act(() => root.unmount());}
});

test('custom shared pose can be entered, selected, and restored', () => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),onSelect=jest.fn();
  try {
    act(() => root.render(<CastPoseOptions count={2} value="" onSelect={onSelect}/>));
    const input=container.querySelector('[aria-label="Custom shared pose"]');
    act(() => {
      input.value='one kneeling while the other stands behind';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    const useButton=[...container.querySelectorAll('button')].find(button => button.textContent==='Use custom');
    act(() => useButton.click());
    expect(onSelect).toHaveBeenCalledWith('one kneeling while the other stands behind');

    act(() => root.render(<CastPoseOptions count={2} value="one kneeling while the other stands behind" onSelect={onSelect}/>));
    expect(container.textContent).toContain('Active custom pose: one kneeling while the other stands behind');
    expect(container.querySelector('[aria-label="Custom shared pose"]').value).toBe('one kneeling while the other stands behind');
  } finally {act(() => root.unmount());}
});
