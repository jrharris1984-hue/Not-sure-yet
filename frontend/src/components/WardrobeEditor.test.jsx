import {act} from 'react';
import {createRoot} from 'react-dom/client';
import WardrobeEditor from './WardrobeEditor';
import {SECTIONS} from '@/lib/dna';
let root,container;
const section=SECTIONS.find(item=>item.key==='wardrobe');
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const changeSelect=(element,value)=>act(()=>{element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));});
const openAdvanced=()=>{const button=[...container.querySelectorAll('button')].find(item=>item.textContent==='Advanced settings');if(button)act(()=>button.click());};
test('browsing groups, fields and categories does not alter saved character data',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'custom',top:'t-shirt'}} onChange={onChange}/>));
  openAdvanced();
  changeSelect(container.querySelector('select[aria-label="Editing detail"]'),'top');
  expect(container.querySelectorAll('[data-field-key]')).toHaveLength(1);
  expect(container.querySelector('[data-field-key="top"]')).not.toBeNull();
  changeSelect(container.querySelector('[aria-label="Clothing category"]'),'shoes');
  expect(container.querySelector('[aria-label="Clothing category"]').value).toBe('shoes');
  expect(onChange).not.toHaveBeenCalled();
  act(()=>container.querySelector('[data-testid="wardrobe-mode-full"]').click());
  expect(onChange.mock.calls[0][0]).toMatchObject({top:'t-shirt',outfit_mode:'full'});
});
test('direct requests reveal inactive fields and preserve custom library controls',()=>{
  const custom={...section,fields:[...section.fields,{key:'custom_note',label:'My clothing note',type:'text'}]};
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={custom} value={{outfit_mode:'full'}} requestedField={{field:'top'}} onChange={onChange}/>));
  openAdvanced();
  expect(container.querySelector('[data-field-key="top"]')).not.toBeNull();
  expect(container.querySelector('[data-field-key="top"] fieldset').disabled).toBe(true);
  act(()=>root.render(<WardrobeEditor section={custom} value={{outfit_mode:'custom'}} requestedField={{field:'custom_note'}} onChange={onChange}/>));
  openAdvanced();
  expect(container.querySelector('[data-field-key="custom_note"]')).not.toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});
test('outfit mode lock prevents switching modes',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'custom'}} fieldLocks={{outfit_mode:true}} onChange={onChange}/>));
  act(()=>container.querySelector('[data-testid="wardrobe-mode-full"]').click());
  expect(onChange).not.toHaveBeenCalled();
});

test('guided coverage step exposes grouped fine-tuning choices',()=>{
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'custom',exposure_mode:'use selected outfit'}} onChange={jest.fn()}/>));
  act(()=>container.querySelector('.wardrobe-guided-steps button:nth-child(2)').click());
  const fineTune=[...container.querySelectorAll('.wardrobe-coverage-details summary')].find(item=>item.textContent.includes('Fine-tune coverage'));
  expect(fineTune).not.toBeNull();
  act(()=>fineTune.click());
  const category=container.querySelector('select[aria-label="Choice category"]');
  expect(category).not.toBeNull();
  expect([...category.options].map(option=>option.value)).toContain('Necklines & coverage');
  changeSelect(category,'Necklines & coverage');
  expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-high-neckline"]')).not.toBeNull();
});

test('coverage presets override a full outfit even when its optional lingerie layer is off',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<WardrobeEditor section={section} value={{outfit_mode:'full',outfit_set:'tailored pantsuit',set_lingerie_mode:'none'}} onChange={onChange}/>));
  act(()=>container.querySelector('.wardrobe-guided-steps button:nth-child(2)').click());
  const lingerieOnly=[...container.querySelectorAll('.wardrobe-coverage-choice')].find(button=>button.textContent.includes('Lingerie only'));
  expect(lingerieOnly.disabled).toBe(false);
  act(()=>lingerieOnly.click());
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({outfit_set:'tailored pantsuit',set_lingerie_mode:'none',exposure_mode:'lingerie only'}));
});
