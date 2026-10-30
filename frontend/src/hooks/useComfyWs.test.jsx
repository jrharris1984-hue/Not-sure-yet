import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useComfyWs} from './useComfyWs';
let sockets,root,container,state;
function Probe({id}){state=useComfyWs(id);return null;}
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;sockets=[];global.WebSocket=class{constructor(){sockets.push(this)}close(){}};container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
const paint=id=>act(()=>root.render(<Probe id={id}/>));
const event=(type,data)=>act(()=>sockets.at(-1).onmessage({data:JSON.stringify({type,data})}));
test('node completion is not image completion and changing jobs clears sampling progress',()=>{
  paint('first');act(()=>sockets[0].onopen());event('progress',{value:4,max:8});
  expect(state.step).toBe(4);event('executed',{node:'sampler'});expect(state.status).toBe('running');
  event('executing',{node:'second-sampler'});expect(state.max).toBe(0);
  event('progress',{value:1,max:20});paint('second');expect(state.max).toBe(0);expect(state.previewUrl).toBeNull();expect(sockets[0].onmessage).toBeNull();
});
