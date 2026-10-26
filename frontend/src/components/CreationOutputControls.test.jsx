import {act} from 'react';
import {createRoot} from 'react-dom/client';
import CreationOutputControls from './CreationOutputControls';
import {mossWorkflowSettings} from '@/lib/mossWorkflowSettings';
const stardust={id:'star',name:'Stardust',kind:'image',prompt_style:'moss_image',json_str:JSON.stringify(require('../../../backend/seed_workflows/moss_stardust_bf16.json'))};
const finalcut={id:'final',name:'FinalCut',kind:'image',prompt_style:'moss_image',json_str:JSON.stringify(require('../../../backend/seed_workflows/moss_finalcut_universal.json'))};
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render=(workflow,extra={})=>act(()=>root.render(<CreationOutputControls workflows={[stardust,finalcut,workflow]} workflowId={workflow.id} settings={mossWorkflowSettings(workflow) || {steps:1,cfg:1,width:1024,height:1024}} onSettings={()=>{}} compiler="moss_image" tier="balanced" count={1} onCount={()=>{}} {...extra}/>));
test('quality cards follow the selected checkpoint even within the same prompt family',()=>{
  const onTier=jest.fn();render(stardust,{onTier});
  const card=()=>container.querySelector('[aria-label="Workflow default"]');
  expect(card().textContent).toContain('25 steps · CFG 3');
  act(()=>card().click());expect(onTier).toHaveBeenCalledWith('balanced');
  render(finalcut,{onTier});expect(card().textContent).toContain('6 steps · CFG 2.5');
  expect(container.querySelector('[aria-label="Sampling steps"]').disabled).toBe(false);
});
test('invalid workflow defaults disable presets rather than advertising generic settings',()=>{
  render({...stardust,id:'invalid',json_str:'invalid'});
  expect(container.querySelector('[aria-label="Workflow default"]').disabled).toBe(true);
  expect(container.textContent).toContain('Workflow defaults unavailable');
});
test('rendering controls does not reapply defaults or mutate manually adjusted settings',()=>{
  const onSettings=jest.fn(),onTier=jest.fn();
  render(stardust,{settings:{...mossWorkflowSettings(stardust),steps:31,cfg:4,seed:42},onSettings,onTier});
  expect(container.querySelector('[aria-label="Sampling steps"]').value).toBe('31');
  expect(onSettings).not.toHaveBeenCalled();expect(onTier).not.toHaveBeenCalled();
});
