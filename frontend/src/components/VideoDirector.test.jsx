import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import VideoDirector from './VideoDirector';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
function Probe({workflow,disabled=false}){const [value,setValue]=useState({enabled:false,action:'Walk along the path'});return <VideoDirector value={value} onChange={setValue} workflow={workflow} disabled={disabled}/>;}
const button=text=>[...container.querySelectorAll('button')].find(b=>b.textContent===text);
test('freeform starts compact; mode switching retains structured choices',()=>{
 act(()=>root.render(<Probe workflow={{kind:'text_video'}}/>));expect(container.querySelector('textarea')).toBeNull();
 act(()=>button('Build a shot').click());expect(container.querySelector('textarea').value).toBe('Walk along the path');
 act(()=>button('Write freely').click());act(()=>button('Build a shot').click());expect(container.querySelector('textarea').value).toBe('Walk along the path');
 expect(container.querySelector('details').open).toBe(false);
});
test('source-image help and unsupported audio remain appropriate for WAN',()=>{
 act(()=>root.render(<Probe workflow={{kind:'video',prompt_style:'wan_i2v'}}/>));act(()=>button('Build a shot').click());
 expect(container.textContent).toContain('starting image supplies');expect(container.textContent).not.toContain('Audio direction');
 expect(container.querySelectorAll('select')).toHaveLength(2);
});
test('audio appears only for the LTX audio graph; fieldset supports busy locking',()=>{
 const workflow={kind:'text_video',prompt_style:'ltx_t2v',json_str:JSON.stringify(require('../../../backend/seed_workflows/sulphur2_t2v.json'))};
 act(()=>root.render(<Probe workflow={workflow}/>));act(()=>button('Build a shot').click());expect(container.textContent).toContain('Audio direction');
 act(()=>root.render(<Probe workflow={workflow} disabled/>));expect(container.querySelector('fieldset').disabled).toBe(true);
});
