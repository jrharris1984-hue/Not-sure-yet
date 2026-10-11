import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChromaControls from './ChromaControls';
import { getRenderRecipe } from '@/lib/renderRecipes';

global.IS_REACT_ACT_ENVIRONMENT = true;

test('Flash steps fit the Chroma slider and can be edited without changing the sampler', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const recipe = {...getRenderRecipe('chroma_flash'), seed:''};
  const onChange = jest.fn();
  try {
    act(() => root.render(<ChromaControls value={recipe} onChange={onChange} />));
    const slider = container.querySelector('input[type="range"]');
    expect(Number(slider.value)).toBe(8);
    expect(Number(slider.min)).toBeLessThanOrEqual(8);
    expect(Number(slider.max)).toBeGreaterThanOrEqual(8);
    expect([...container.querySelectorAll('select')].find(select => select.querySelector('option[value="heun"]')).value).toBe('heun');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(slider, '10');
      slider.dispatchEvent(new Event('input', {bubbles:true}));
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({steps:10, cfg:1, sampler:'heun'}));
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
