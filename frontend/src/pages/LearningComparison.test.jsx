import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import LearningComparison from './LearningComparison';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({API_BASE:'/api',endpoints:{getComparison:jest.fn(),saveComparisonPreference:jest.fn()}}));
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>,useParams:()=>({id:'pair'})}),{virtual:true});
global.IS_REACT_ACT_ENVIRONMENT=true;
let root,container,client;
const pair={id:'pair',source_render_id:'source',workflow_name:'Chroma',seed:42,ready:true,baseline:{width:1024,height:1024},target:{width:896,height:1344},sides:{A:{render_id:'source',status:'done',dimensions:{width:1024,height:1024},output_files:['http://comfy/view?filename=a.png']},B:{render_id:'target',status:'done',dimensions:{width:896,height:1344},output_files:['b.png']}}};
beforeEach(()=>{
  jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});endpoints.getComparison.mockResolvedValue(pair);
});
afterEach(()=>{act(()=>root.unmount());client.clear();container.remove();});
async function render(){await act(async()=>{root.render(<QueryClientProvider client={client}><LearningComparison/></QueryClientProvider>);await new Promise(resolve=>setTimeout(resolve,10));});await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});}
const save=()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Save preference');
test('displays original outputs, saves a relative choice, and restores an existing assessment',async()=>{
  endpoints.getComparison.mockResolvedValue({...pair,assessment:{preference:'tie',notes:'Both are similar.'}});
  endpoints.saveComparisonPreference.mockResolvedValue({preference:'B',notes:'Both are similar.'});
  await render();expect(container.querySelector('input[value="tie"]').checked).toBe(true);
  expect(container.querySelector('img[alt="Comparison A"]').getAttribute('src')).toBe('/api/comfyui/media?filename=a.png&subfolder=&type=output');
  act(()=>container.querySelector('input[value="B"]').click());
  await act(async()=>save().click());
  expect(endpoints.saveComparisonPreference).toHaveBeenCalledWith('pair',{preference:'B',notes:'Both are similar.'});
  expect(container.textContent).toContain('Preference saved');
});
test('blocks voting for a pending or mismatched pair',async()=>{
  endpoints.getComparison.mockResolvedValue({...pair,ready:false,integrity_error:'The model setup changed.',sides:{...pair.sides,B:{...pair.sides.B,status:'failed',output_files:[]}}});
  await render();expect(save().disabled).toBe(true);expect(container.textContent).toContain('model setup changed');
  expect(endpoints.saveComparisonPreference).not.toHaveBeenCalled();
});
test('failed preference saving preserves the choice for retry',async()=>{
  endpoints.saveComparisonPreference.mockRejectedValue(new Error('offline'));
  await render();act(()=>container.querySelector('input[value="neither"]').click());await act(async()=>save().click());
  expect(container.querySelector('input[value="neither"]').checked).toBe(true);expect(container.textContent).toContain('Could not save your preference');
});
