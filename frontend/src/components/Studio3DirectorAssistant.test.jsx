import {act} from 'react';
import {createRoot} from 'react-dom/client';
import Studio3DirectorAssistant from './Studio3DirectorAssistant';
import {endpoints} from '@/lib/api';

jest.mock('@/lib/api',()=>({endpoints:{aiShootPlan:jest.fn()}}));
let root,container;
const press=async label=>act(async()=>[...container.querySelectorAll('button')].find(button=>button.textContent.includes(label)).click());
const setBrief=value=>act(()=>{const input=container.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('reviews editable AI suggestions before applying the Studio 3 plan',async()=>{
 const onApply=jest.fn();const plan={version:1,characterId:'character-1',shots:[{id:'shot-1',enabled:true,label:'Shot 1',pose:null,subjectView:null,cameraAngle:null,outfit:null,scene:{},lighting:{}}]};
 endpoints.aiShootPlan.mockResolvedValue({frames:[{pose_action:'walking',view:'back',camera_height:'low',outfit_preset:'jacket',environment:'loft',lighting_source:'window'}],warnings:[]});
 await act(async()=>root.render(<Studio3DirectorAssistant characterId="character-1" workflow={{id:'image',kind:'image'}} plan={plan} lockScenario={false} outfitOptions={['jacket']} onApply={onApply}/>));
 setBrief('Warm editorial portraits in a loft');await press('Draft suggestions');
 expect(endpoints.aiShootPlan).toHaveBeenCalledWith(expect.objectContaining({character_id:'character-1',workflow_id:'image',count:1,shot_numbers:[1],lock_scenario:false}));
 expect(container.textContent).toContain('3.0 Shot Storyboard');expect(onApply).not.toHaveBeenCalled();
 await press('Apply reviewed suggestions');expect(onApply).toHaveBeenCalledWith(expect.objectContaining({shots:[expect.objectContaining({pose:'walking',subjectView:'back',cameraAngle:'low',outfit:'jacket'})]}));
});
test('blocks AI planning when workflow is not a text-to-image workflow',async()=>{
 const plan={shots:[{id:'shot-1',enabled:true,label:'Shot 1'}]};
 await act(async()=>root.render(<Studio3DirectorAssistant characterId="character-1" workflow={{id:'video',kind:'video'}} plan={plan} lockScenario/>));
 expect([...container.querySelectorAll('button')].find(button=>button.textContent==='Draft suggestions').disabled).toBe(true);
 expect(endpoints.aiShootPlan).not.toHaveBeenCalled();
});
test('plans a long storyboard in chapter batches and carries previous shot direction forward',async()=>{
 const plan={version:1,characterId:'character-1',planType:'adult-editorial',shots:Array.from({length:40},(_,index)=>({
  id:`shot-${index+1}`,enabled:true,label:`Shot ${index+1}`,chapter:`Chapter ${Math.floor(index/10)+1}`,
  pose:'standing',subjectView:'front',cameraAngle:'eye-level',coverage:'use selected outfit',
  wardrobeAction:'Keep the selected outfit worn',outfit:'tailored look',scene:{environment:'studio'},lighting:{style:'softbox'},
 }))};
 endpoints.aiShootPlan.mockImplementation(async request=>({frames:Array.from({length:request.count},()=>({pose_action:'walking',view:'back',camera_height:'low'})),warnings:[]}));
 const onApply=jest.fn();
 await act(async()=>root.render(<Studio3DirectorAssistant characterId="character-1" workflow={{id:'image',kind:'image'}} plan={plan} lockScenario={false} outfitOptions={[]} onApply={onApply}/>));
 setBrief('A connected editorial story with changing camera angles');await press('Draft 40 suggestions');
 expect(endpoints.aiShootPlan).toHaveBeenCalledTimes(4);
 expect(endpoints.aiShootPlan.mock.calls.map(([request])=>request.count)).toEqual([10,10,10,10]);
 expect(endpoints.aiShootPlan.mock.calls[1][0].chapter).toBe('Chapter 2');
 expect(endpoints.aiShootPlan.mock.calls[1][0].chapter_position).toBe(11);
 expect(endpoints.aiShootPlan.mock.calls[1][0].continuity_context).toContain('Shot 10');
 expect(endpoints.aiShootPlan.mock.calls[1][0].continuity_context).toContain('coverage: use selected outfit');
 expect(endpoints.aiShootPlan.mock.calls[1][0].current_frames[0]).toMatchObject({coverage:'use selected outfit',wardrobe_action:'Keep the selected outfit worn'});
 expect(endpoints.aiShootPlan.mock.calls.every(([request])=>request.count<=20)).toBe(true);
 expect(container.textContent).toContain('3.0 Shot Storyboard');
 expect(onApply).not.toHaveBeenCalled();
});
test('keeps completed chapter suggestions and resumes after a later chunk fails',async()=>{
 const plan={shots:Array.from({length:30},(_,index)=>({id:`shot-${index+1}`,enabled:true,label:`Shot ${index+1}`,chapter:`Chapter ${index<10?1:2}`,pose:'standing',scene:{},lighting:{}}))};
 endpoints.aiShootPlan.mockResolvedValueOnce({frames:Array.from({length:10},()=>({pose_action:'walking'})),warnings:[]})
  .mockRejectedValueOnce({response:{data:{detail:'Ollama timed out'}}})
  .mockImplementation(async request=>({frames:Array.from({length:request.count},()=>({pose_action:'walking'})),warnings:[]}));
 await act(async()=>root.render(<Studio3DirectorAssistant characterId="character-1" workflow={{id:'image',kind:'image'}} plan={plan} lockScenario={false} onApply={jest.fn()}/>));
 setBrief('A connected two chapter editorial');await press('Draft 30 suggestions');
 expect(container.textContent).toContain('Ollama timed out');
 expect(container.textContent).toContain('Continue remaining shots (20)');
 await press('Continue remaining shots');
 expect(endpoints.aiShootPlan).toHaveBeenCalledTimes(3);
 expect(container.textContent).toContain('3.0 Shot Storyboard');
 expect(container.textContent).not.toContain('Continue remaining shots');
});
