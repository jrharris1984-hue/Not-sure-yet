import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useBuilderRenderPolling} from './useBuilderRenderPolling';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({endpoints:{pollRender:jest.fn()}}));
let root, container, props;
function Probe(p) {useBuilderRenderPolling(p);return null;}
beforeEach(()=>{
 global.IS_REACT_ACT_ENVIRONMENT=true;jest.useFakeTimers();jest.clearAllMocks();
 container=document.createElement('div');root=createRoot(container);
 props={batchRenders:[],selectedBatchRenderId:'',activeRender:{id:'old',status:'running'},setBatchRenders:jest.fn(),setSelectedBatchRenderId:jest.fn(),setActiveRender:jest.fn()};
});
afterEach(()=>{act(()=>root.unmount());jest.useRealTimers();});
const tick=()=>act(async()=>{jest.advanceTimersByTime(2500);});
test('a late single-render poll cannot overwrite a newly selected result',async()=>{
 let resolve;endpoints.pollRender.mockReturnValue(new Promise(r=>{resolve=r;}));
 act(()=>root.render(<Probe {...props}/>));await tick();
 act(()=>root.render(<Probe {...props} activeRender={{id:'new',status:'done'}}/>));
 await act(async()=>resolve({id:'old',status:'done',output_files:['old.png']}));
 expect(props.setActiveRender).not.toHaveBeenCalled();
});
test('single-render polling does not overlap slow requests and resumes after a connection error',async()=>{
 let reject;endpoints.pollRender.mockReturnValueOnce(new Promise((r,j)=>{reject=j;})).mockResolvedValue({id:'old',status:'done'});
 act(()=>root.render(<Probe {...props}/>));await tick();await tick();
 expect(endpoints.pollRender).toHaveBeenCalledTimes(1);
 await act(async()=>reject(new Error('offline')));await tick();
 expect(props.setActiveRender).toHaveBeenCalledWith({id:'old',status:'done'});
});
test('a late batch poll cannot replace a new batch or change its selected thumbnail',async()=>{
 let resolve;endpoints.pollRender.mockReturnValue(new Promise(r=>{resolve=r;}));
 const batch=[{id:'a',status:'running'},{id:'b',status:'done'}];
 act(()=>root.render(<Probe {...props} batchRenders={batch} activeRender={batch[0]} selectedBatchRenderId="a"/>));await tick();
 expect(endpoints.pollRender).toHaveBeenCalledTimes(1);
 act(()=>root.render(<Probe {...props} batchRenders={[{id:'new',status:'done'}]} activeRender={{id:'new',status:'done'}}/>));
 await act(async()=>resolve({id:'a',status:'done'}));
 expect(props.setBatchRenders).not.toHaveBeenCalled();expect(props.setActiveRender).not.toHaveBeenCalled();
});
test('completed batch selects a successful result when the selected render failed',async()=>{
 endpoints.pollRender.mockResolvedValue({id:'a',status:'failed'});
 const batch=[{id:'a',status:'running'},{id:'b',status:'done',output_files:['b.png']}];
 act(()=>root.render(<Probe {...props} batchRenders={batch} activeRender={batch[0]} selectedBatchRenderId="a"/>));await tick();
 expect(props.setSelectedBatchRenderId).toHaveBeenCalledWith('b');
 expect(props.setActiveRender).toHaveBeenCalledWith(batch[1]);
});
