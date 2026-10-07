import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useOllamaPrompt} from './useOllamaPrompt';
import {endpoints} from './api';
import {updateAssistantResearch} from './assistantResearch';
jest.mock('./api',()=>({endpoints:{aiCompileOllama:jest.fn()}}));
let root,container,state;
function Harness({source,enabled=true}) {state=useOllamaPrompt(source,enabled);return <output>{state.positive}</output>;}
beforeEach(()=>{updateAssistantResearch({enabled:false,focus:"",result:null});global.IS_REACT_ACT_ENVIRONMENT=true;jest.useFakeTimers();container=document.createElement('div');root=createRoot(container);endpoints.aiCompileOllama.mockReset();});
afterEach(()=>{act(()=>root.unmount());jest.useRealTimers();});
const render=props=>act(()=>root.render(<Harness {...props}/>));
test('debounces compilation and uses checked wording only for its current source',async()=>{
 endpoints.aiCompileOllama.mockResolvedValue({positive:'adult woman with silver hair',accepted:true,reason:'checked'});
 render({source:'adult woman, silver hair'});expect(state.pending).toBe(true);
 await act(async()=>{jest.advanceTimersByTime(700);});
 expect(state.pending).toBe(false);expect(state.positive).toBe('adult woman with silver hair');
 render({source:'adult man, black hair'});expect(state.positive).toBe('adult man, black hair');expect(state.pending).toBe(true);
});
test('late results from a previous selection are discarded',async()=>{
 let resolve;endpoints.aiCompileOllama.mockReturnValue(new Promise(done=>resolve=done));
 render({source:'old selection'});act(()=>jest.advanceTimersByTime(700));
 render({source:'new selection'});
 await act(async()=>resolve({positive:'old result',accepted:true}));
 expect(state.positive).toBe('new selection');expect(state.pending).toBe(true);
});
test('an unavailable model falls back without retaining a pending state',async()=>{
 endpoints.aiCompileOllama.mockRejectedValue(new Error('offline'));
 render({source:'selected portrait'});await act(async()=>jest.advanceTimersByTime(700));
 expect(state.positive).toBe('selected portrait');expect(state.pending).toBe(false);expect(state.reason).toContain('unavailable');
});
test('other formats do not request Ollama',async()=>{
 render({source:'selected portrait',enabled:false});await act(async()=>jest.advanceTimersByTime(1000));
 expect(endpoints.aiCompileOllama).not.toHaveBeenCalled();expect(state.pending).toBe(false);
});
test('changing web research or its focus recompiles even when the selections are unchanged',async()=>{
 endpoints.aiCompileOllama.mockResolvedValue({positive:'selected portrait',accepted:true});
 render({source:'selected portrait'});await act(async()=>jest.advanceTimersByTime(700));
 act(()=>updateAssistantResearch({enabled:true,focus:'studio lighting'}));
 expect(state.pending).toBe(true);
 await act(async()=>jest.advanceTimersByTime(700));
 expect(endpoints.aiCompileOllama).toHaveBeenCalledTimes(2);
 act(()=>updateAssistantResearch({focus:'window lighting'}));
 await act(async()=>jest.advanceTimersByTime(700));
 expect(endpoints.aiCompileOllama).toHaveBeenCalledTimes(3);
});
