import {act, useState} from 'react';
import {createRoot} from 'react-dom/client';
import LoraLibraryManager from './LoraLibraryManager';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({endpoints:{scanLora:jest.fn(),saveLoraProfile:jest.fn()}}));
let root, container;
const click=async text=>{await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent.includes(text)).click());};
function Harness(){const [records,setRecords]=useState([]);return <LoraLibraryManager installed={['SDXL/light.safetensors','SDXL/color.safetensors']} records={records} onRecords={setRecords}/>;}
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('local scan persists partial results without applying detected profiles',async()=>{
  endpoints.scanLora.mockResolvedValueOnce({name:'SDXL/light.safetensors',detected:{family:'sdxl',triggerWords:['light']},lookup_status:'Metadata scanned'}).mockRejectedValueOnce(new Error('offline'));
  act(()=>root.render(<Harness/>));await click('Scan 2 files');
  expect(endpoints.scanLora).toHaveBeenNthCalledWith(1,'SDXL/light.safetensors',false);
  expect(container.textContent).toContain('1 files checked');expect(container.textContent).toContain('Metadata scanned');
  expect(container.textContent).toContain('offline');expect(localStorage.length).toBe(0);
});
test('hash lookup is opt-in and manual confirmation saves profile',async()=>{
  endpoints.scanLora.mockImplementation(async name=>({name,detected:{family:'sdxl',triggerWords:['light']}}));
  endpoints.saveLoraProfile.mockImplementation(async(name,profile)=>({profile}));
  act(()=>root.render(<Harness/>));act(()=>container.querySelector('input[type=checkbox]').click());await click('Scan 2 files');
  expect(endpoints.scanLora).toHaveBeenCalledWith('SDXL/light.safetensors',true);
  await click('Review settings');expect(container.textContent).toContain('app starting values');
  await click('Save LoRA profile');
  expect(endpoints.saveLoraProfile).toHaveBeenCalledWith('SDXL/light.safetensors',expect.objectContaining({family:'sdxl',triggerWords:['light']}));
  expect(container.textContent).toContain('Profile saved');
});
