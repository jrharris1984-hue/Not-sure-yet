import {act} from 'react';
import {createRoot} from 'react-dom/client';
jest.mock('react-router-dom', () => ({Link:({to,children}) => <a href={to}>{children}</a>}), {virtual:true});
import WorkspacePreviewLayout from './WorkspacePreviewLayout';
import WorkspaceRenderStatus from './WorkspaceRenderStatus';
let root, container;
beforeEach(() => {global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();window.innerWidth=1440;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(() => {act(()=>root.unmount());container.remove();});
it('hides the preview without remounting the editor and remembers the choice', () => {
  act(()=>root.render(<WorkspacePreviewLayout preview={<p>Preview</p>}><input defaultValue="Draft" /></WorkspacePreviewLayout>));
  const input=container.querySelector('input:not([type=range])');
  act(()=>container.querySelector('button').click());
  expect(container.querySelector('input')).toBe(input);
  expect(container.querySelector('.workspace-preview-content')).toBeNull();
  expect(sessionStorage.getItem('ultra:workspace-view')).toBe('"edit"');
  act(()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Split').click());
  expect(container.querySelector('.workspace-preview-content').textContent).toBe('Preview');
});
it('shows only batch-local pending counts and exposes render errors and queue navigation', () => {
  const onResults=jest.fn();
  act(()=>root.render(<><WorkspaceRenderStatus render={{status:'failed',error:'Connection lost'}} renders={[{status:'queued'},{status:'done'}]} onResults={onResults}/></>));
  expect(container.querySelector('summary').textContent).toContain('1 pending in this batch');
  expect(container.textContent).toContain('Connection lost');
  expect(container.querySelector('a').getAttribute('href')).toBe('/queue');
  act(()=>container.querySelector('button').click()); expect(onResults).toHaveBeenCalledTimes(1);
});
it('provides first-use guidance before a render exists', () => {
  act(()=>root.render(<><WorkspaceRenderStatus /></>));
  expect(container.textContent).toContain('Ready to create');
  expect(container.textContent).toContain('Your image will appear after generation');
});

it('keeps empty previews collapsed and opens automatically when an image arrives', () => {
  const render=hasPreview=>act(()=>root.render(<WorkspacePreviewLayout hasPreview={hasPreview} preview={<p>Image</p>}><input defaultValue="Draft"/></WorkspacePreviewLayout>));
  render(false);
  const input=container.querySelector('input');
  expect(container.querySelector('.workspace-preview-content')).toBeNull();
  render(true);
  expect(container.querySelector('.workspace-preview-content')).not.toBeNull();
  expect(container.querySelector('input:not([type=range])')).toBe(input);
  act(()=>container.querySelector('button').click());
  render(true);
  expect(container.querySelector('.workspace-preview-content')).toBeNull();
});

it('preserves the editor DOM through Preview and adapts Split to narrow windows',()=>{
  act(()=>root.render(<WorkspacePreviewLayout preview={<p>Image</p>}><input defaultValue="Draft"/></WorkspacePreviewLayout>));
  const input=container.querySelector('input:not([type=range])');
  const choose=label=>act(()=>[...container.querySelectorAll('button')].find(button=>button.textContent===label).click());
  choose('Preview');
  expect(container.querySelector('.workspace-editor-content').hidden).toBe(true);
  choose('Split');
  expect(container.querySelector('input:not([type=range])')).toBe(input);
  act(()=>{window.innerWidth=1024;window.dispatchEvent(new Event('resize'));});
  expect(container.querySelector('[data-workspace-mode]').dataset.workspaceMode).toBe('edit');
  expect([...container.querySelectorAll('button')].some(button=>button.textContent==='Split')).toBe(false);
  choose('Preview');
  expect(container.querySelector('.workspace-preview-content')).not.toBeNull();
  choose('Edit');
  expect(container.querySelector('input')).toBe(input);
});
it('returns to editing when a different detail is requested from navigation',()=>{
  const paint=editTarget=>act(()=>root.render(<WorkspacePreviewLayout editTarget={editTarget} preview={<p>Image</p>}><input/></WorkspacePreviewLayout>));
  paint('hair');
  act(()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Preview').click());
  paint('wardrobe');
  expect(container.querySelector('.workspace-editor-content').hidden).toBe(false);
  expect(container.querySelector('[data-workspace-mode]').dataset.workspaceMode).toBe('edit');
});
