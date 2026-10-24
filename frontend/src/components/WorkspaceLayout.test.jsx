import {act} from 'react';
import {createRoot} from 'react-dom/client';
jest.mock('react-router-dom', () => ({Link:({to,children}) => <a href={to}>{children}</a>}), {virtual:true});
import WorkspacePreviewLayout from './WorkspacePreviewLayout';
import WorkspaceRenderStatus from './WorkspaceRenderStatus';
let root, container;
beforeEach(() => {global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(() => {act(()=>root.unmount());container.remove();});
it('hides the preview without remounting the editor and remembers the choice', () => {
  act(()=>root.render(<WorkspacePreviewLayout preview={<p>Preview</p>}><input defaultValue="Draft" /></WorkspacePreviewLayout>));
  const input=container.querySelector('input:not([type=range])');
  act(()=>container.querySelector('button').click());
  expect(container.querySelector('input')).toBe(input);
  expect(container.querySelector('.workspace-preview-content')).toBeNull();
  expect(sessionStorage.getItem('ultra:preview-open')).toBe('false');
  act(()=>container.querySelector('button').click());
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
  expect(container.textContent).toContain('first image');
});
