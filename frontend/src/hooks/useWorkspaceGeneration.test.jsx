import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useWorkspaceGeneration} from './useWorkspaceGeneration';
import {previewPerson} from '@/lib/workspacePreview';
import {endpoints} from '@/lib/api';
jest.mock('@/lib/api',()=>({endpoints:{settings:jest.fn(),listWorkflows:jest.fn(),dispatchRender:jest.fn(),pollRender:jest.fn(),uploadReferenceImage:jest.fn(),createCharacter:jest.fn(),workflowLoras:jest.fn()}}));
let root,container,current;
const workflow={id:'image',kind:'image',name:'Krea 2',prompt_style:'krea2'};
const values=()=>({mode:'describe',people:[previewPerson()],relationship:'Choose later',description:'A studio photograph',instruction:'Change the jacket',shape:'Portrait',count:2});
function Harness({value}){current=useWorkspaceGeneration(value);return null;}
const paint=async value=>{await act(async()=>root.render(<Harness value={value}/>));};
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);jest.clearAllMocks();endpoints.settings.mockResolvedValue({default_workflow_id:'image'});endpoints.listWorkflows.mockResolvedValue([workflow,{id:'edit',name:'Edit',kind:'edit',prompt_style:'qwen_edit'}]);});
afterEach(()=>{act(()=>root.unmount());jest.useRealTimers();});
test('queues the requested count with unique seeds, guards double clicks and polls to completion',async()=>{
  jest.useFakeTimers();let index=0;endpoints.dispatchRender.mockImplementation(async()=>({id:`r${++index}`,status:'queued'}));
  endpoints.pollRender.mockImplementation(async id=>({id,status:'done',output_files:[`${id}.png`]}));
  await paint(values());await act(async()=>{await Promise.all([current.generate(),current.generate()]);});
  expect(endpoints.dispatchRender).toHaveBeenCalledTimes(2);
  const seeds=endpoints.dispatchRender.mock.calls.map(([body])=>body.seed);expect(new Set(seeds).size).toBe(2);
  expect(current.pending).toBe(true);await act(async()=>{jest.advanceTimersByTime(2500);});
  expect(current.pending).toBe(false);expect(current.renders[0].output_files).toEqual(['r1.png']);
});
test('retains successful jobs when the next dispatch fails and reports partial submission',async()=>{
  endpoints.dispatchRender.mockResolvedValueOnce({id:'first',status:'queued'}).mockRejectedValueOnce(new Error('offline'));
  await paint(values());await act(async()=>current.generate());
  expect(current.renders).toHaveLength(1);expect(current.error).toContain('1 of 2 images queued');expect(current.pending).toBe(true);
});
test('uploads a reference before dispatch, uses edit workflow, and never creates a character implicitly',async()=>{
  const v={...values(),mode:'image',count:1,file:new File(['image'],'photo.png',{type:'image/png'})};
  endpoints.uploadReferenceImage.mockResolvedValue({name:'uploaded.png',subfolder:'input'});
  endpoints.dispatchRender.mockResolvedValue({id:'edit-result',status:'done'});
  await paint(v);await act(async()=>current.generate());
  expect(endpoints.dispatchRender.mock.calls[0][0]).toMatchObject({workflow_id:'edit',reference_image:'input/uploaded.png',preserve_unmentioned:true});
  expect(endpoints.createCharacter).not.toHaveBeenCalled();
  await act(async()=>current.generate());expect(endpoints.uploadReferenceImage).toHaveBeenCalledTimes(1);
});
test('save creates a separate character with all subjects and their locks',async()=>{
  const v={...values(),mode:'character'};v.people[0].name='Alex';v.people[0].field_locks={hair:{color:true}};
  endpoints.createCharacter.mockResolvedValue({id:'new',name:'Alex'});
  await paint(v);await act(async()=>current.save());
  expect(endpoints.createCharacter.mock.calls[0][0]).toMatchObject({name:'Alex',subjects:[{field_locks:{hair:{color:true}}}]});
  expect(current.saved.id).toBe('new');expect(endpoints.dispatchRender).not.toHaveBeenCalled();
});
test('invalid seeds do not upload or queue and failed uploads can be retried',async()=>{
  await paint({...values(),mode:'image',count:1,file:new File(['image'],'photo.png',{type:'image/png'})});
  act(()=>current.setSeed('bad'));await act(async()=>current.generate());
  expect(endpoints.uploadReferenceImage).not.toHaveBeenCalled();expect(endpoints.dispatchRender).not.toHaveBeenCalled();
  act(()=>current.setSeed(''));endpoints.uploadReferenceImage.mockRejectedValueOnce(new Error('upload offline')).mockResolvedValueOnce({name:'uploaded.png'});
  endpoints.dispatchRender.mockResolvedValue({id:'retry',status:'done'});
  await act(async()=>current.generate());expect(current.error).toContain('upload offline');
  await act(async()=>current.generate());expect(current.renders[0].id).toBe('retry');
});
