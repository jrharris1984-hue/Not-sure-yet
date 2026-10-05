import { act } from 'react';
import { createRoot } from 'react-dom/client';
import RandomSceneControls from './RandomSceneControls';
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
