import {act} from 'react';
import {createRoot} from 'react-dom/client';
import Studio3DirectorAssistant from './Studio3DirectorAssistant';
import {endpoints} from '@/lib/api';

jest.mock('@/lib/api',()=>({endpoints:{aiShootPlan:jest.fn()}}));
let root,container;
const press=async label=>act(async()=>[...container.querySelectorAll('button')].find(button=>button.textContent===label).click());
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
