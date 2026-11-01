import {act} from 'react';
import {createRoot} from 'react-dom/client';
import WardrobeEditor from './WardrobeEditor';
import {SECTIONS} from '@/lib/dna';
let root,container;
const section=SECTIONS.find(item=>item.key==='wardrobe');
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const changeSelect=(element,value)=>act(()=>{element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));});
test('browsing groups, fields and categories does not alter saved character data',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'custom',top:'t-shirt'}} onChange={onChange}/>));
  changeSelect(container.querySelector('select[aria-label="Editing"]'),'top');
  expect(container.querySelectorAll('[data-field-key]')).toHaveLength(1);
  expect(container.querySelector('[data-field-key="top"]')).not.toBeNull();
  changeSelect(container.querySelector('[aria-label="Choice category"]'),'Knitwear');
  expect(container.querySelector('[aria-label="Choice category"]').value).toBe('Knitwear');
  expect(onChange).not.toHaveBeenCalled();
  act(()=>container.querySelector('[data-testid="wardrobe-mode-full"]').click());
  expect(onChange.mock.calls[0][0]).toMatchObject({top:'t-shirt',outfit_mode:'full'});
});
test('direct requests reveal inactive fields and preserve custom library controls',()=>{
  const custom={...section,fields:[...section.fields,{key:'custom_note',label:'My clothing note',type:'text'}]};
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={custom} value={{outfit_mode:'full'}} requestedField={{field:'top'}} onChange={onChange}/>));
  expect(container.querySelector('[data-field-key="top"]')).not.toBeNull();
  expect(container.querySelector('[data-field-key="top"] fieldset').disabled).toBe(true);
  act(()=>root.render(<WardrobeEditor section={custom} value={{outfit_mode:'custom'}} requestedField={{field:'custom_note'}} onChange={onChange}/>));
  expect(container.querySelector('[data-field-key="custom_note"]')).not.toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});
test('outfit mode lock prevents switching modes',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'custom'}} fieldLocks={{outfit_mode:true}} onChange={onChange}/>));
  act(()=>container.querySelector('[data-testid="wardrobe-mode-full"]').click());
  expect(onChange).not.toHaveBeenCalled();
});
