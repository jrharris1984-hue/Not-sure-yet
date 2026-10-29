import {act} from 'react';
import {createRoot} from 'react-dom/client';
import VisualChoice,{choiceSwatch} from './VisualChoice';
import DetailNavigator from './DetailNavigator';
import CreationSectionHeader from './CreationSectionHeader';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
test('swatches only describe recognized color fields without reinterpreting custom choices',()=>{
  expect(choiceSwatch('chip-hair-color','black')).toBe('#20232b');
  expect(choiceSwatch('chip-hair-style','black')).toBeNull();
  expect(choiceSwatch('chip-hair-color','custom dye formula')).toBeNull();
});
test('visual choices retain custom labels, selection semantics and callback',()=>{
  const select=jest.fn();
  act(()=>root.render(<VisualChoice field="chip-hair-color" value="black" label="My black dye" active onClick={select}/>));
  const button=container.querySelector('button');
  expect(button.textContent).toBe('My black dye');
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.visual-choice-swatch')).not.toBeNull();
  act(()=>button.click());expect(select).toHaveBeenCalledTimes(1);
});
test('detail navigation exposes every destination and bounds previous/next',()=>{
  const change=jest.fn(),fields=[{key:'a',label:'First'},{key:'custom',label:'Custom field'}];
  const paint=value=>act(()=>root.render(<DetailNavigator fields={fields} value={value} onChange={change}/>));
  paint('a');expect(container.querySelector('[aria-label="Previous detail"]').disabled).toBe(true);
  act(()=>container.querySelector('[aria-label="Next detail"]').click());expect(change).toHaveBeenCalledWith('custom');
  paint('custom');expect(container.querySelector('[aria-label="Next detail"]').disabled).toBe(true);
  act(()=>container.querySelector('[aria-label="Previous detail"]').click());expect(change).toHaveBeenLastCalledWith('a');
});
test('section header navigates existing destinations without modifying character data',()=>{
  const onSection=jest.fn(),sections=[{key:'hair',title:'Hair'},{key:'custom',title:'Custom category'}];
  act(()=>root.render(<CreationSectionHeader section={sections[0]} sections={sections} stages={[{title:'Appearance',sections:['hair']}]} onSection={onSection}/>));
  expect(container.textContent).toContain('Appearance');
  expect(container.querySelector('[aria-label="Previous category"]').disabled).toBe(true);
  act(()=>container.querySelector('[aria-label="Next category"]').click());expect(onSection).toHaveBeenCalledWith('custom');
});
