import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import PromptFormatControl from './PromptFormatControl';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
test('format control switches to compact and identifies word counts accurately', () => {
  const container=document.createElement('div'),root=createRoot(container),onChange=jest.fn();
  act(()=>root.render(<PromptFormatControl value="compact" onChange={onChange} meta={{detailedPromptWords:180,promptWords:95}}/>));
  expect(container.textContent).toContain('180 detailed words → 95 compact words');
  expect(container.textContent).toContain('not model tokens');
  expect(container.querySelector('option[value="ollama"]')).not.toBeNull();
  expect(container.textContent).toContain('stays saved until you change it');
  const select=container.querySelector('select');
  act(()=>{select.value='detailed';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(onChange).toHaveBeenCalledWith('detailed');
  act(()=>root.unmount());
});
