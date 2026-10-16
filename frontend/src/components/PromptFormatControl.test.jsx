import {createRoot} from 'react-dom/client';
import {act} from 'react';
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

test('scene format shows missing context and remains selectable', () => {
  const container=document.createElement('div'),root=createRoot(container),onChange=jest.fn();
  act(()=>root.render(<PromptFormatControl value="scene" onChange={onChange} meta={{detailedPromptWords:180,promptWords:160,scenePlan:{subjectCount:1,selectedSubjects:1,present:{setting:true,lighting:false,camera:false,action:true},missing:['lighting','camera']}}}/>));
  expect(container.textContent).toContain('160 scene words');
  expect(container.textContent).toContain('Not specified: lighting, camera');
  const select=container.querySelector('select');
  act(()=>{select.value='scene';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(onChange).toHaveBeenCalledWith('scene');
  act(()=>root.unmount());
});

test('video structure choice can expose only detailed and scene formats', () => {
  const container=document.createElement('div'),root=createRoot(container);
  act(()=>root.render(<PromptFormatControl value="scene" onChange={()=>{}} formats={['detailed','scene']}/>));
  expect([...container.querySelectorAll('option')].map(option=>option.value)).toEqual(['detailed','scene']);
  act(()=>root.unmount());
});
