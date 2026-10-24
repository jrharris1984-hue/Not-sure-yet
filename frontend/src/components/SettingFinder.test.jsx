import {act} from 'react';
import {createRoot} from 'react-dom/client';
import SettingFinder from './SettingFinder';
let root,container,onSelect;
const sections=[{key:'hair',title:'Hair',fields:[{key:'color',label:'Color',groups:[{name:'Natural',options:['auburn']}]},{key:'style',label:'Style',options:['curly']}]},{key:'camera',title:'Camera',fields:[{key:'angle',label:'Angle',optionLabels:{low:'Low angle'}}]}];
const dialog=()=>document.querySelector('dialog.setting-finder');
const search=value=>act(()=>{const input=dialog().querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
const buttons=()=>[...dialog().querySelectorAll('.setting-finder-results button')];
beforeEach(()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);onSelect=jest.fn();
  HTMLDialogElement.prototype.showModal=jest.fn(function(){this.setAttribute('open','');});
  HTMLDialogElement.prototype.close=jest.fn(function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));});
  act(()=>root.render(<SettingFinder sections={sections} onSelect={onSelect}/>));
  act(()=>container.querySelector('button').click());
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('searches names, group options and display labels, then opens the exact control',()=>{
  expect(document.activeElement).toBe(dialog().querySelector('input'));
  search('hair color');expect(buttons()).toHaveLength(1);
  search('auburn');expect(buttons()[0].textContent).toContain('Color');
  search('low angle');expect(buttons()).toHaveLength(1);
  act(()=>buttons()[0].click());
  expect(onSelect).toHaveBeenCalledWith({section:'camera',category:'Camera',field:'angle',label:'Angle'});
  expect(dialog().open).toBe(false);
});
test('empty results recover without edits or navigation',()=>{
  search('not-a-setting');expect(buttons()).toHaveLength(0);
  expect(dialog().textContent).toContain('No matching controls');
  act(()=>dialog().querySelector('.setting-finder-clear').click());
  expect(buttons()).toHaveLength(3);expect(onSelect).not.toHaveBeenCalled();
});
test('closing and native Escape return focus without selecting anything',()=>{
  act(()=>dialog().querySelector('[aria-label="Close setting finder"]').click());
  expect(document.activeElement).toBe(container.querySelector('button'));
  act(()=>container.querySelector('button').click());
  act(()=>{dialog().dispatchEvent(new Event('cancel'));dialog().close();});
  expect(document.activeElement).toBe(container.querySelector('button'));
  expect(onSelect).not.toHaveBeenCalled();
});
test('large custom catalogs remain reachable in batches',()=>{
  const fields=Array.from({length:65},(_,i)=>({key:`field${i}`,label:`Control ${i}`}));
  act(()=>root.render(<SettingFinder sections={[{key:'custom',title:'Custom',fields}]} onSelect={onSelect}/>));
  expect(buttons()).toHaveLength(31);
  act(()=>buttons().at(-1).click());expect(buttons()).toHaveLength(61);
  act(()=>buttons().at(-1).click());expect(buttons()).toHaveLength(65);
  act(()=>buttons().at(-1).click());expect(onSelect.mock.calls[0][0].field).toBe('field64');
});
