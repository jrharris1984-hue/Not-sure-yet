import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReferenceImageEditor, { referenceEditPayload } from './ReferenceImageEditor';
import { endpoints } from '@/lib/api';
let mockState = {};
jest.mock('react-router-dom', () => ({Link:({to,children})=><a href={to}>{children}</a>,useLocation:()=>({state:mockState})}), {virtual:true});
jest.mock('@/lib/api', () => ({endpoints:{uploadReferenceImage:jest.fn(),dispatchRender:jest.fn()}}));
const klein={id:'klein',name:'Klein edit',prompt_style:'flux2_klein_edit'};
const qwen={id:'qwen',name:'Qwen composer',prompt_style:'qwen_reference'};
const image=name=>({name,subfolder:'refs'});
test('ordered references retain subfolders and use direct edit instructions',()=>{
  expect(referenceEditPayload(qwen,[image('a.png'),image('b.png')],'Combine image 1 and image 2.',768,1024,'42')).toMatchObject({reference_images:['refs/a.png','refs/b.png'],reference_image:'refs/a.png',seed:42,edit_instruction:'Combine image 1 and image 2.',preserve_unmentioned:false});
  expect(referenceEditPayload(klein,[image('a.png')],'Blue wall',768,1024,'')).not.toHaveProperty('seed');
});
test('missing required references, gaps, duplicates and invalid seeds cannot submit',()=>{
  expect(()=>referenceEditPayload(qwen,[image('a.png')],'Combine',768,1024,'')).toThrow(/first 2/);
  expect(()=>referenceEditPayload(klein,[],'Edit',768,1024,'')).toThrow(/first 1/);
  expect(()=>referenceEditPayload(klein,[image('a.png'),null,image('c.png')],'Edit',768,1024,'')).toThrow(/image 2/);
  expect(()=>referenceEditPayload(qwen,[image('a.png'),image('a.png')],'Combine',768,1024,'')).toThrow(/different/);
  expect(()=>referenceEditPayload(klein,[image('a.png')],'Edit',768,1024,'-1')).toThrow(/seed/);
});
let container,root;
beforeEach(()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;mockState={};jest.clearAllMocks();
  URL.createObjectURL=jest.fn(file=>'blob:'+file.name);URL.revokeObjectURL=jest.fn();
  endpoints.dispatchRender.mockResolvedValue({status:'queued'});
  endpoints.uploadReferenceImage.mockImplementation(file=>Promise.resolve(image(file.name)));
  container=document.createElement('div');root=createRoot(container);
});
afterEach(()=>act(()=>root.unmount()));
const upload=async(index,name)=>{
  const input=container.querySelector(`[aria-label="Reference image ${index}"]`);
  Object.defineProperty(input,'files',{configurable:true,value:[new File(['png'],name,{type:'image/png'})]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
};
const enter=async text=>act(async()=>{
  const input=container.querySelector('textarea');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,text);
  input.dispatchEvent(new Event('input',{bubbles:true}));
});
const generate=()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Generate edit');
test('two uploads remain distinct and submit a composition',async()=>{
  await act(async()=>root.render(<ReferenceImageEditor workflow={qwen}/>));
  await enter('Combine image 1 and image 2 in a studio.');
  await upload(1,'a.png');expect(generate().disabled).toBe(true);
  await upload(2,'b.png');expect(generate().disabled).toBe(false);
  await act(async()=>generate().click());
  expect(endpoints.dispatchRender.mock.calls[0][0].reference_images).toEqual(['refs/a.png','refs/b.png']);
  expect(container.textContent).toContain('Queued.');
});
test('Gallery handoff supplies image 1 and a failed edit is shown as an error',async()=>{
  mockState={galleryReference:image('gallery.png'),previewUrl:'/gallery.png'};
  endpoints.dispatchRender.mockResolvedValue({status:'failed',error:'Missing model'});
  await act(async()=>root.render(<ReferenceImageEditor workflow={klein}/>));
  await enter('Change the background to blue.');
  await act(async()=>generate().click());
  expect(endpoints.dispatchRender.mock.calls[0][0].reference_images).toEqual(['refs/gallery.png']);
  expect(container.querySelector('[role="alert"]').textContent).toContain('Missing model');
  expect(container.textContent).not.toContain('Queued.');
});
test('removing a reference disables composition and revokes its preview',async()=>{
  await act(async()=>root.render(<ReferenceImageEditor workflow={qwen}/>));
  await enter('Combine');await upload(1,'a.png');await upload(2,'b.png');
  await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Remove image 2').click());
  expect(generate().disabled).toBe(true);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:b.png');
});
