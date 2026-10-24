import {act} from 'react';
import {createRoot} from 'react-dom/client';
import SelectedDetails from './SelectedDetails';
import SelectedDetailsDrawer from './SelectedDetailsDrawer';
let container,root;
const item={section:'hair',field:'color',category:'Hair',label:'Color',value:'Brown',locked:true,note:'Controlled by preset'};
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();jest.restoreAllMocks();});
test('searches saved details, shows locks and notes, and opens the exact field',()=>{
  const edit=jest.fn();
  act(()=>root.render(<SelectedDetails items={[item]} onEdit={edit}/>));
  expect(container.textContent).toContain('Locked');expect(container.textContent).toContain('Controlled by preset');
  act(()=>container.querySelector('button').click());expect(edit).toHaveBeenCalledWith(item);
  const input=container.querySelector('input');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'unknown');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(container.textContent).toContain('No matching selections');expect(container.querySelector('button')).toBeNull();
});
test('native drawer opens and closes without changing selections',()=>{
  act(()=>root.render(<SelectedDetailsDrawer items={[item]} onEdit={jest.fn()}/>));
  const dialog=container.querySelector('dialog'),trigger=container.querySelector('button');
  dialog.showModal=jest.fn();dialog.close=jest.fn();
  act(()=>trigger.click());expect(dialog.showModal).toHaveBeenCalledTimes(1);
  act(()=>dialog.querySelector('button').click());expect(dialog.close).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(trigger);
});

test('closed drawer does not build selection rows and Escape releases them',()=>{
  act(()=>root.render(<SelectedDetailsDrawer items={[item]} onEdit={jest.fn()}/>));
  const dialog=container.querySelector('dialog');dialog.showModal=jest.fn();
  expect(container.querySelector('.selected-detail-row')).toBeNull();
  act(()=>container.querySelector('button').click());expect(container.querySelector('.selected-detail-row')).not.toBeNull();
  act(()=>dialog.dispatchEvent(new Event('cancel',{bubbles:true})));
  expect(container.querySelector('.selected-detail-row')).toBeNull();
});
test('clicking empty space inside the drawer does not dismiss it',()=>{
  act(()=>root.render(<SelectedDetailsDrawer items={[item]} onEdit={jest.fn()}/>));
  const dialog=container.querySelector('dialog');dialog.showModal=jest.fn();dialog.close=jest.fn();
  dialog.getBoundingClientRect=()=>({left:100,right:560,top:0,bottom:800});
  act(()=>container.querySelector('button').click());
  act(()=>dialog.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:200,clientY:600})));
  expect(dialog.close).not.toHaveBeenCalled();
  act(()=>dialog.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:50,clientY:600})));
  expect(dialog.close).toHaveBeenCalledTimes(1);
});
