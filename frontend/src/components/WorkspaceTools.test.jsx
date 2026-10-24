import {act} from 'react';
import {createRoot} from 'react-dom/client';
import WorkspaceTools from './WorkspaceTools';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
test('desktop utilities start collapsed and preserve form values when toggled',()=>{
  act(()=>root.render(<WorkspaceTools compact><input defaultValue="Saved tags"/><button>Randomize</button></WorkspaceTools>));
  const details=container.querySelector('details'),input=container.querySelector('input');
  expect(details.open).toBe(false);
  act(()=>{details.open=true;});
  expect(container.querySelector('input')).toBe(input);
  expect(input.value).toBe('Saved tags');
  act(()=>{details.open=false;});
  expect(input.value).toBe('Saved tags');
});
test('legacy mobile utilities retain their original placement without a new disclosure',()=>{
  act(()=>root.render(<WorkspaceTools compact={false}><button>Character tools</button></WorkspaceTools>));
  expect(container.querySelector('details')).toBeNull();
  expect(container.querySelector('button').textContent).toBe('Character tools');
});
