import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import FramingComparisonPanel from './FramingComparisonPanel';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({endpoints:{renderComparisons:jest.fn(),comparisonOptions:jest.fn(),createComparison:jest.fn()}}));
const mockNavigate=jest.fn();
jest.mock('react-router-dom',()=>({Link:({to,children})=><a href={to}>{children}</a>,useNavigate:()=>mockNavigate}),{virtual:true});
global.IS_REACT_ACT_ENVIRONMENT=true;
let root,container,client;
const source={id:'source',status:'done',workflow_type:'image',learning_context:{version:1},render_recipe:{},generation_settings:{width:1024,height:1024}};
beforeEach(()=>{
  jest.clearAllMocks();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:jest.fn(()=> '12345678-1234-4234-8234-123456789012')}});
  endpoints.renderComparisons.mockResolvedValue([]);endpoints.comparisonOptions.mockResolvedValue({recommendations:[]});
});
afterEach(()=>{act(()=>root.unmount());client.clear();container.remove();});
const button=()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Generate B and compare');
async function render(record=source){await act(async()=>root.render(<QueryClientProvider client={client}><FramingComparisonPanel render={record}/></QueryClientProvider>));}
function input(label,value){act(()=>{const input=container.querySelector(`[aria-label="${label}"]`);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});}
test('queues one candidate and reuses its request ID after an uncertain response',async()=>{
  await render();endpoints.createComparison.mockRejectedValueOnce(new Error('connection lost')).mockResolvedValueOnce({id:'pair'});
  await act(async()=>button().click());
  expect(container.textContent).toContain('Retry to recover');expect(mockNavigate).not.toHaveBeenCalled();
  await act(async()=>button().click());
  const [first,second]=endpoints.createComparison.mock.calls;
  expect(first[0]).toEqual(second[0]);
  expect(first[0]).toEqual({request_id:'12345678-1234-4234-8234-123456789012',source_render_id:'source',width:896,height:896});
  expect(mockNavigate).toHaveBeenCalledWith('/compare/pair');
});
test('prevents identical or invalid canvas sizes and omits unsupported old renders',async()=>{
  await render();input('Comparison B width','1024');input('Comparison B height','1024');expect(button().disabled).toBe(true);
  input('Comparison B width','895');expect(button().disabled).toBe(true);
  await render({...source,learning_context:undefined});expect(container.querySelector('[data-testid="framing-comparison-setup"]')).toBeNull();
});
test('loads recommendations and previous comparisons when opened',async()=>{
  endpoints.comparisonOptions.mockResolvedValue({recommendations:[{id:'recommendation',settings:{width:768,height:1152},matched:3,reviewed:4}]});
  endpoints.renderComparisons.mockResolvedValue([{id:'prior',target:{width:896,height:1344},assessment:{preference:'tie'}}]);
  await render();
  await act(async()=>{const details=container.querySelector('details');details.open=true;details.dispatchEvent(new Event('toggle'));await new Promise(resolve=>setTimeout(resolve,10));});
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
  expect(container.querySelector('a[href="/compare/prior"]')).not.toBeNull();
  act(()=>{const select=container.querySelector('select');select.value='recommendation';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector('[aria-label="Comparison B width"]').value).toBe('768');
  expect(container.querySelector('[aria-label="Comparison B height"]').value).toBe('1152');
});
