import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import StudioGenerationBar from './StudioGenerationBar';
import StudioRenderReveal from './StudioRenderReveal';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
function Bar(props){const [bindings,setBindings]=useState({});return <StudioGenerationBar {...props} bindings={bindings} onBindings={setBindings}/>;}
const click=label=>act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent===label).click());
test('unconfigured modes request a mapping without switching or rendering; mapped mode applies exact graph defaults',()=>{
  const onWorkflow=jest.fn(),onSurprise=jest.fn();
  const workflows=[{id:'six',name:'My six step graph',kind:'image',json_str:JSON.stringify({a:{class_type:'KSampler',inputs:{steps:6,cfg:2,sampler_name:'euler',scheduler:'simple'}}})}];
  act(()=>root.render(<Bar workflows={workflows} onWorkflow={onWorkflow} onSurprise={onSurprise}/>));
  click('Turbo');expect(onWorkflow).not.toHaveBeenCalled();expect(onSurprise).not.toHaveBeenCalled();
  const select=container.querySelector('select');act(()=>{select.value='six';select.dispatchEvent(new Event('change',{bubbles:true}));});
  click('Turbo');expect(onWorkflow).toHaveBeenCalledWith(workflows[0],{steps:6,cfg:2,sampler:'euler',scheduler:'simple'});
  click('Surprise me & generate');expect(onSurprise).toHaveBeenCalledTimes(1);
});
test('queue and disconnection never invent a percentage or blur a previous result',()=>{
  act(()=>root.render(<StudioRenderReveal render={{status:'queued',queue_position:2}} live={{connected:false,max:30,step:15}} source="/previous.png"/>));
  expect(container.querySelector('progress')).toBeNull();expect(container.textContent).toContain('position 2');expect(container.textContent).toContain('Previous image');
  expect(container.querySelector('img').style.filter).toBe('');
});
test('sampling progress is stage-specific; final render uses completed output rather than stale live frame',()=>{
  act(()=>root.render(<StudioRenderReveal render={{status:'running'}} live={{connected:true,max:8,step:4,previewUrl:'blob:live'}}/>));
  expect(container.querySelector('progress').value).toBe(50);expect(container.textContent).toContain('of this stage');
  act(()=>root.render(<StudioRenderReveal render={{status:'done'}} live={{connected:true,max:8,step:8,previewUrl:'blob:live'}} source="/final.png"/>));
  expect(container.querySelector('progress')).toBeNull();expect(container.querySelector('img').src).toContain('/final.png');
});
