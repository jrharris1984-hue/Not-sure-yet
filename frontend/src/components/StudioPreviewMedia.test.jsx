import {act} from 'react';
import {createRoot} from 'react-dom/client';
import StudioPreviewMedia from './StudioPreviewMedia';
let root,container;
beforeEach(()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  HTMLDialogElement.prototype.showModal=jest.fn(function(){this.setAttribute('open','');});
  HTMLDialogElement.prototype.close=jest.fn(function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));});
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render=props=>act(()=>root.render(<StudioPreviewMedia {...props}/>));
const button=text=>[...container.querySelectorAll('button')].find(item=>item.textContent.includes(text));
test('empty and queued previews explain what happens next without offering fake progress',()=>{
  render({});expect(container.textContent).toContain('after generation');
  render({status:'queued'});expect(container.textContent).toContain('renderer is available');
  expect(container.querySelector('progress')).toBeNull();
});
test('image failure retries media only and a new source recovers automatically',()=>{
  render({source:'/a.png'});
  act(()=>container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.textContent).toContain('Preview unavailable');
  act(()=>button('Retry preview').click());
  expect(container.querySelector('img')).not.toBeNull();
  act(()=>container.querySelector('img').dispatchEvent(new Event('error')));
  render({source:'/b.png'});expect(container.querySelector('img').src).toContain('/b.png');
});
test('larger preview opens without navigation and returns focus when closed',()=>{
  render({source:'/a.png'});
  const trigger=button('View larger');
  act(()=>trigger.click());
  expect(container.querySelector('dialog[open] img')).not.toBeNull();
  act(()=>button('Close preview').click());
  expect(container.querySelector('dialog[open]')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
test('Escape follows native dialog cancellation and removes expanded media',()=>{
  render({source:'/a.png'});act(()=>button('View larger').click());
  const dialog=container.querySelector('dialog');
  act(()=>{dialog.dispatchEvent(new Event('cancel'));dialog.close();});
  expect(dialog.querySelector('img')).toBeNull();
  expect(document.activeElement).toBe(button('View larger'));
});
test('video previews remain videos with controls in both views',()=>{
  render({source:'/clip.mp4'});
  expect(container.querySelector('video').controls).toBe(true);
  act(()=>button('View larger').click());
  expect(container.querySelector('dialog video').controls).toBe(true);
});
