import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {useContext} from 'react';
import WorkspaceTools from './WorkspaceTools';
import WorkspaceToolSections from './WorkspaceToolSections';
import ToolPortalContext from './ToolPortalContext';
let root,container;
const originalShow=HTMLDialogElement.prototype.showModal,originalClose=HTMLDialogElement.prototype.close;
beforeAll(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new Event('close'));};
});
afterAll(()=>{HTMLDialogElement.prototype.showModal=originalShow;HTMLDialogElement.prototype.close=originalClose;});
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const click=label=>act(()=>[...container.querySelectorAll('button')].find(button=>button.textContent===label).click());
test('drawer lazily mounts tools and retains drafts across navigation and closing',()=>{
  act(()=>root.render(<WorkspaceTools compact><><details data-tool-id="character" data-tool-label="Character"><summary>Character tools</summary><input defaultValue="Saved tags"/></details><div data-tool-id="randomize" data-tool-label="Randomize"><button>Randomize now</button></div></></WorkspaceTools>));
  const trigger=container.querySelector('button');
  expect(container.querySelector('input')).toBeNull();
  act(()=>trigger.click());
  const input=container.querySelector('input');input.value='My draft';
  expect(container.querySelectorAll('[aria-label="Tool categories"] button')).toHaveLength(2);
  expect(container.querySelector('summary')).toBeNull();
  click('Randomize');expect(input.closest('section').hidden).toBe(true);
  click('Character');expect(container.querySelector('input')).toBe(input);
  click('Close');expect(container.querySelector('dialog').open).toBe(false);
  expect(document.activeElement).toBe(trigger);
  act(()=>trigger.click());expect(input.value).toBe('My draft');
});
test('mobile categories preserve panels and support fallback IDs',()=>{
  act(()=>root.render(<WorkspaceToolSections><div><input defaultValue="Draft"/></div><div><p>Second</p></div></WorkspaceToolSections>));
  click('Tools 2');
  expect(container.querySelector('input').closest('section').hidden).toBe(true);
  expect(container.querySelector('p').closest('section').hidden).toBe(false);
});
test('compact false retains existing non-sheet placement',()=>{
  act(()=>root.render(<WorkspaceTools compact={false}><button>Character tools</button></WorkspaceTools>));
  expect(container.querySelector('dialog')).toBeNull();
  expect(container.querySelector('button').textContent).toBe('Character tools');
});
function PortalProbe(){const target=useContext(ToolPortalContext);return createPortal(<p data-testid="nested-tool">Nested tool</p>,target?.current || document.body);}
test('nested tool portals remain inside the native modal and navigation can close it',()=>{
  act(()=>root.render(<WorkspaceTools compact>{({close})=><div data-tool-id="pins" data-tool-label="Pins"><PortalProbe/><button onClick={close}>Go to section</button></div>}</WorkspaceTools>));
  act(()=>container.querySelector('button').click());
  expect(container.querySelector('dialog [data-testid="nested-tool"]')).not.toBeNull();
  click('Go to section');expect(container.querySelector('dialog').open).toBe(false);
});
