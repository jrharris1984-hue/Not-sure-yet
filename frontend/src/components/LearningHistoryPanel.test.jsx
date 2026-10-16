import {act, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {endpoints} from '@/lib/api';
import LearningHistoryPanel from './LearningHistoryPanel';
jest.mock('@/lib/api',()=>({endpoints:{learningHistory:jest.fn(),learningDecision:jest.fn()}}));
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>}),{virtual:true});
global.IS_REACT_ACT_ENVIRONMENT=true;
const context={workflow_id:'chroma',generation:{steps:26,cfg:4},framing:['full body'],subject_count:1};
const item={id:'recommendation',settings:{width:896,height:1344},matched:3,reviewed:4,distinct_prompts:2,models:['chroma.safetensors'],evidence:[{id:'a',rating:'matched'}],decision:'active'};
let root,container,client,onApply;
beforeEach(()=>{
  jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});onApply=jest.fn();
  endpoints.learningHistory.mockResolvedValue({reviewed_examples:4,recommendations:[item]});
  endpoints.learningDecision.mockResolvedValue({recommendation:item});
});
afterEach(()=>{act(()=>root.unmount());client.clear();container.remove();});
function Harness({blocked=''}) {
  const [settings,setSettings]=useState({width:1024,height:1024,steps:26,cfg:4,seed:99});
  return <><LearningHistoryPanel context={context} settings={settings} blocked={blocked} onApply={size=>{onApply(size);setSettings(current=>({...current,...size}));}}/><button onClick={()=>setSettings(current=>({...current,width:1280}))}>Manual size change</button><output>{JSON.stringify(settings)}</output></>;
}
const button=text=>[...container.querySelectorAll('button')].find(button=>button.textContent===text);
async function render(props={}){await act(async()=>root.render(<QueryClientProvider client={client}><Harness {...props}/></QueryClientProvider>));}
async function refresh(){await act(async()=>{button('Refresh learning history').click();await new Promise(resolve=>setTimeout(resolve,10));});}

test('loads evidence on request, never applies automatically, and supports Apply and Undo',async()=>{
  await render();expect(endpoints.learningHistory).not.toHaveBeenCalled();
  await refresh();
  expect(container.textContent).toContain('3 of 4 reviewed results');
  expect(container.querySelector('a[href="/gallery?render=a"]')).not.toBeNull();
  expect(onApply).not.toHaveBeenCalled();
  await act(async()=>button('Apply image size').click());
  expect(endpoints.learningDecision).toHaveBeenCalledWith('recommendation',{context,action:'applied'});
  expect(onApply).toHaveBeenCalledWith({width:896,height:1344});
  expect(JSON.parse(container.querySelector('output').textContent)).toEqual({width:896,height:1344,steps:26,cfg:4,seed:99});
  act(()=>button('Undo image size').click());
  expect(onApply).toHaveBeenLastCalledWith({width:1024,height:1024});
});
test('persists dismissal, shows dismissed history, and restores it without applying settings',async()=>{
  await render();await refresh();
  endpoints.learningHistory.mockResolvedValue({reviewed_examples:4,recommendations:[{...item,decision:'dismissed'}]});
  await act(async()=>button('Dismiss').click());
  expect(endpoints.learningDecision).toHaveBeenLastCalledWith(item.id,{context,action:'dismissed'});
  expect(button('Apply image size')).toBeUndefined();
  expect(container.textContent).toContain('Dismissed recommendations');
  endpoints.learningHistory.mockResolvedValue({reviewed_examples:4,recommendations:[item]});
  await act(async()=>button('Restore recommendation').click());
  expect(endpoints.learningDecision).toHaveBeenLastCalledWith(item.id,{context,action:'active'});
  expect(onApply).not.toHaveBeenCalled();
});
test('a rejected approval changes nothing and exact recipe mode blocks applying',async()=>{
  await render();await refresh();
  endpoints.learningDecision.mockRejectedValue({response:{data:{detail:'Evidence changed. Refresh history.'}}});
  await act(async()=>button('Apply image size').click());
  expect(container.textContent).toContain('Evidence changed');expect(onApply).not.toHaveBeenCalled();
  await render({blocked:'Exact recipe mode preserves its saved image size.'});
  expect(button('Apply image size').disabled).toBe(true);
});
test('provides useful empty and error states',async()=>{
  endpoints.learningHistory.mockResolvedValue({reviewed_examples:2,recommendations:[]});
  await render();await refresh();expect(container.textContent).toContain('No supported pattern yet');
  endpoints.learningHistory.mockRejectedValue(new Error('offline'));await refresh();
  expect(container.textContent).toContain('Could not load Learning History');expect(onApply).not.toHaveBeenCalled();
});
test('does not apply a pending approval after changing workflows or leaving Builder',async()=>{
  let resolve;endpoints.learningDecision.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  await render();await refresh();
  act(()=>button('Apply image size').click());
  act(()=>root.render(<div>Another workflow</div>));
  await act(async()=>resolve({recommendation:item}));
  expect(onApply).not.toHaveBeenCalled();
});

test('Undo preserves a later manual size edit',async()=>{
  await render();await refresh();
  await act(async()=>button('Apply image size').click());
  act(()=>button('Manual size change').click());
  expect(button('Undo image size').disabled).toBe(true);
  expect(JSON.parse(container.querySelector('output').textContent).width).toBe(1280);
});
