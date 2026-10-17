import { act } from 'react';
import {createRoot} from 'react-dom/client';
import RandomSceneControls from './RandomSceneControls';
let root, container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('natural range and scoped actions are accessible without dispatching a render',()=>{
 const action=jest.fn();
 act(()=>root.render(<RandomSceneControls profile="natural" onProfile={jest.fn()} onRandomize={jest.fn()} onPhotoRandomize={action} issues={['Locked pose conflict']}/>));
 expect(container.querySelector('select').value).toBe('natural');
 for (const label of ['Scene only','Pose only','Lighting only','Camera only','Appearance only']) expect([...container.querySelectorAll('button')].some(b=>b.textContent===label)).toBe(true);
 act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Scene only').click());
 expect(action).toHaveBeenCalledWith('scene');
 expect(container.querySelector('[role="status"]').textContent).toContain('Locked pose conflict');
 act(()=>root.render(<RandomSceneControls profile="natural" onPhotoRandomize={action} busy/>));
 expect([...container.querySelectorAll('button')].every(b=>b.disabled)).toBe(true);
});

test('all four scene actions are visible and range selection does not queue a render',()=>{
 global.IS_REACT_ACT_ENVIRONMENT=true;
 const container=document.createElement('div'),root=createRoot(container),onRandomize=jest.fn(),onProfile=jest.fn();
 act(()=>root.render(<RandomSceneControls profile="adventurous" onProfile={onProfile} onRandomize={onRandomize}/>));
 expect(container.querySelectorAll('button')).toHaveLength(4);
 act(()=>container.querySelector('[data-testid="btn-random-scene-duo_feet"]').click());
 expect(onRandomize).toHaveBeenCalledWith('duo_feet');
 const select=container.querySelector('select');
 act(()=>{select.value='balanced';select.dispatchEvent(new Event('change',{bubbles:true}));});
 expect(onProfile).toHaveBeenCalledWith('balanced');expect(onRandomize).toHaveBeenCalledTimes(1);
 act(()=>root.unmount());
});
