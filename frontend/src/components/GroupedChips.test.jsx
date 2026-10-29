import {act} from 'react';
import {createRoot} from 'react-dom/client';
import GroupedChips from './GroupedChips';
const groups=[{name:'Loose',options:['straight','wavy']},{name:'Up',options:['bun','ponytail']}];
let root,container;
beforeEach(()=>{sessionStorage.clear();global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render=(value='straight', choices=groups)=>act(()=>root.render(<GroupedChips groups={choices} value={value} testIdPrefix="hair-style" onChange={jest.fn()}/>));
const tab=name=>container.querySelector(`[data-testid="hair-style-tab-${name}"]`);
test('restores the browsed group on return, but follows a newly applied selection',()=>{
  render();
  act(()=>tab('Up').click());
  act(()=>root.render(null));
  render();
  expect(tab('Up').getAttribute('aria-pressed')).toBe('true');
  render('wavy');
  expect(tab('Loose').getAttribute('aria-pressed')).toBe('true');
});
test('uses group names so reordering a library preserves the destination',()=>{
  render();
  act(()=>tab('Up').click());
  render('straight',[...groups].reverse());
  expect(tab('Up').getAttribute('aria-pressed')).toBe('true');
  render('straight',[groups[0]]);
  expect(tab('Loose').getAttribute('aria-pressed')).toBe('true');
});
test('search survives a selection from another group, while explicit category browsing clears it',()=>{
  const choices=[{name:'First',options:Array.from({length:10},(_,i)=>`style ${i}`)},{name:'Second',options:['unique style']}];
  const paint=value=>act(()=>root.render(<GroupedChips groups={choices} value={value} testIdPrefix="hair-style" onChange={jest.fn()}/>));
  paint('style 0');
  const input=container.querySelector('input[type=search]');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'unique');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(container.querySelector('[data-testid="hair-style-unique-style"]')).not.toBeNull();
  paint('unique style');
  expect(container.querySelector('input[type=search]').value).toBe('unique');
  act(()=>tab('First').click());expect(container.querySelector('input[type=search]').value).toBe('');
});
