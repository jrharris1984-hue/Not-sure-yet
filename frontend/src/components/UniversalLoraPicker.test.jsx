import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import UniversalLoraPicker from './UniversalLoraPicker';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({endpoints:{comfyLoras:jest.fn(),loraLibrary:jest.fn()}}));
let root,container,last;
const name='SDXL/light.safetensors';
const workflow={id:'test',prompt_style:'sdxl'};
function Harness(){const [value,setValue]=useState({name,strength:-.5,triggerWords:[]});last=value;return <UniversalLoraPicker workflow={workflow} value={value} onChange={setValue}/>;}
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  endpoints.comfyLoras.mockResolvedValue({loras:[name]});
  endpoints.loraLibrary.mockResolvedValue({records:[{name,profile:{family:'sdxl',triggerWords:[],minStrength:-2,defaultStrength:-.75,maxStrength:2}}]});});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('backend profile restores signed controls and reset uses the saved default',async()=>{
  await act(async()=>root.render(<Harness/>));
  const slider=container.querySelector('[type=range]');expect(slider.min).toBe('-2');expect(slider.value).toBe('-0.5');
  await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Reset strength').click());
  expect(last.strength).toBe(-.75);
  expect(container.textContent).toContain('saved default');
});
test('numeric strength passes a negative value and keeps trigger words',async()=>{
  await act(async()=>root.render(<Harness/>));
  const input=container.querySelector('input[type=number]');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'-1.25');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(last).toEqual({name,strength:-1.25,triggerWords:[]});
});
