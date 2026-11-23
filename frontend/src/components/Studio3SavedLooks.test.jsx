import {act} from 'react';
import {createRoot} from 'react-dom/client';
import Studio3SavedLooks from './Studio3SavedLooks';
let root,container;
const click=async label=>act(async()=>[...container.querySelectorAll('button')].find(button=>button.textContent===label).click());
const setInput=(selector,value)=>act(()=>{const input=container.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('saves a named look for a character and applies it to the selected shot',async()=>{
 const onApply=jest.fn();const plan={characterId:'character-1',shots:[{id:'shot-1',label:'Shot 1',enabled:true,outfit:'dress',scene:{environment:'studio'},lighting:{style:'soft'}}]};
 await act(async()=>root.render(<Studio3SavedLooks plan={plan} onApply={onApply}/>));
 setInput('input[aria-label="Saved look name"]','Studio setup');await click('Save current look');
 const stored=JSON.parse(localStorage.getItem('ultrastudio3:saved-looks:character-1'));
 expect(stored).toHaveLength(1);expect(stored[0]).toMatchObject({name:'Studio setup',wardrobe:{outfit:'dress'},scene:{environment:'studio'},lighting:{style:'soft'}});
 await click('Apply to shot');expect(onApply).toHaveBeenCalledWith(expect.objectContaining({shots:[expect.objectContaining({outfit:'dress',scene:{environment:'studio'},lighting:{style:'soft'}})]}));
});
