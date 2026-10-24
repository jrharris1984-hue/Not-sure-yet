import {act} from 'react';
import {createRoot} from 'react-dom/client';
import useTabPreference from './useTabPreference';
let root,container;
function Preference({name}) { const [value,setValue]=useTabPreference(name,0); return <button onClick={()=>setValue(current=>current+1)}>{value}</button>; }
beforeEach(()=>{sessionStorage.clear();global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();jest.restoreAllMocks();});
const render=name=>act(()=>root.render(<Preference name={name}/>));
test('changing preference keys does not overwrite the destination with the previous value',()=>{
  sessionStorage.setItem('a','2');sessionStorage.setItem('b','7');
  render('a');render('b');
  expect(container.textContent).toBe('7');
  act(()=>container.querySelector('button').click());
  expect(sessionStorage.getItem('b')).toBe('8');
  expect(sessionStorage.getItem('a')).toBe('2');
  render('a');expect(container.textContent).toBe('2');
});
test('storage denial leaves preferences usable in memory',()=>{
  jest.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('blocked');});
  jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('blocked');});
  render('a');act(()=>container.querySelector('button').click());
  expect(container.textContent).toBe('1');
});
