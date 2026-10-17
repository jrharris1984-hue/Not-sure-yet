import {act} from 'react';
import {createRoot} from 'react-dom/client';
import RandomizerSuites from './RandomizerSuites';
import {previewPerson} from '@/lib/workspacePreview';
jest.mock('./RandomizerPresets',()=>()=> <p>Saved custom randomizers</p>);
let container,root,people,onApply;
function Harness(){return <RandomizerSuites people={people} onApply={next=>{onApply(next);people=next;root.render(<Harness/>);}}/>;}
const click=async text=>{await act(async()=>[...container.querySelectorAll('button')].find(button=>button.textContent.includes(text)).click());};
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);people=[previewPerson()];onApply=jest.fn();act(()=>root.render(<Harness/>));});
afterEach(()=>act(()=>root.unmount()));
test('requires preview before applying, supports undo and exposes custom presets',async()=>{
  await click('Fresh character look');expect(onApply).not.toHaveBeenCalled();expect(container.querySelector('[aria-label="Randomizer preview"]')).not.toBeNull();
  const original=JSON.stringify(people);await click('Apply these changes');expect(onApply).toHaveBeenCalledTimes(1);
  await click('Undo last randomizer');expect(JSON.stringify(people)).toBe(original);
  await click('My randomizers');expect(container.textContent).toContain('Saved custom randomizers');
});
test('stale previews cannot overwrite a character that changed meanwhile',async()=>{
  await click('Fresh character look');people=[{...people[0],name:'Changed'}];act(()=>root.render(<Harness/>));
  expect([...container.querySelectorAll('button')].find(b=>b.textContent==='Apply these changes').disabled).toBe(true);
});
