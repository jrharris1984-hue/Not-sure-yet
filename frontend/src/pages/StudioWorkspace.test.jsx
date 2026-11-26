import {act} from 'react';
import {createRoot} from 'react-dom/client';
import StudioWorkspace from './StudioWorkspace';
import {endpoints} from '@/lib/api';
import {previewPerson} from '@/lib/workspacePreview';

jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>}),{virtual:true});
jest.mock('@/lib/api',()=>({endpoints:{settings:jest.fn(),listWorkflows:jest.fn(),listCharacters:jest.fn(),createCharacter:jest.fn(),dispatchRender:jest.fn(),pollRender:jest.fn(),uploadReferenceImage:jest.fn(),comfyLoras:jest.fn()}}));
let root,container;
const buttons=()=>[...document.querySelectorAll('button')];
const click=async text=>{await act(async()=>{const button=buttons().find(item=>item.textContent===text);if(!button)throw new Error(`Missing button ${text}`);button.click();});};
const paint=async({fresh=false,resume=!fresh}={})=>{if(!fresh && !sessionStorage.getItem('ultra-studio-canvas-draft-v1'))sessionStorage.setItem('ultra-studio-canvas-draft-v1',JSON.stringify({version:1,mode:'character',people:[previewPerson()],relationship:'Choose later',description:'',instruction:'',count:1,shape:'Portrait',sceneOverrides:{}}));await act(async()=>root.render(<StudioWorkspace/>));if(resume && !fresh)await click('Resume your saved draft');};
const input=(selector,value)=>act(()=>{const element=document.querySelector(selector);Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});
beforeEach(()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();
  endpoints.settings.mockResolvedValue({default_workflow_id:'image'});endpoints.listWorkflows.mockResolvedValue([{id:'image',name:'Krea 2',kind:'image',prompt_style:'krea2'},{id:'edit',name:'Image Edit',kind:'edit',prompt_style:'qwen_edit'}]);
  endpoints.comfyLoras.mockResolvedValue({loras:[]});
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('first launch offers one Create hub for image, editing, shoots and video',async()=>{
  await paint({fresh:true});expect(container.querySelector('.cs-start-hub')).not.toBeNull();expect(container.querySelector('.cs-inspector')).toBeNull();expect(container.querySelector('.cs-generate-bar')).toBeNull();
  expect(container.textContent).toContain('What are you creating?');expect(container.querySelectorAll('.cs-start-card')).toHaveLength(6);
  expect(container.querySelector('a[href="/create/guided?start=build"]')).not.toBeNull();
  expect(container.querySelector('a[href="/create/text-video"]')).not.toBeNull();expect(container.querySelector('a[href="/create/video"]')).not.toBeNull();
  expect(container.querySelector('a[href="/character/new"]')).not.toBeNull();await click('Text to image');expect(container.querySelector('.cs-start-hub')).toBeNull();expect(container.querySelector('.cs-inspector')).not.toBeNull();
});
test('Create opens the workflow hub first and offers saved draft resume',async()=>{
  await paint({fresh:false,resume:false});
  expect(container.querySelector('.cs-start-hub')).not.toBeNull();
  expect(buttons().some(button=>button.textContent.includes('Resume your saved draft'))).toBe(true);
  await click('Resume your saved draft');expect(container.querySelector('.cs-inspector')).not.toBeNull();
});
test('a saved draft opens the canvas workspace with app navigation and one inspector',async()=>{
  await paint();expect(container.querySelector('.cs-stage')).not.toBeNull();expect(container.querySelector('.cs-inspector')).not.toBeNull();
  expect(container.querySelector('nav[aria-label="Studio navigation"] a[href="/gallery"]')).not.toBeNull();
  expect(container.textContent).not.toContain('Continue');expect(container.textContent).not.toContain('Step 1');
  expect(container.querySelector('nav[aria-label="Studio navigation"] a[href="/create"] span').textContent).toBe('Create');
});
test('all body and outfit collections remain accessible through the inspector',async()=>{
  await paint();await click('Physical features');await click('Glutes');
  const glutes=buttons().find(button=>button.textContent.includes('Glute size · slider'));await act(async()=>glutes.click());
  expect(document.querySelector('input[type="range"]').max).toBe('2000');await click('Done');
  await click('Outfit');
  await act(async()=>buttons().find(button=>button.textContent.includes('Choose an outfit')).click());
  await act(async()=>buttons().find(button=>button.textContent.includes('Complete outfit set')).click());
  expect(document.querySelector('[aria-label="Option collection"]').textContent).toContain('Costume sets');
});
test('switches to prompt creation and queues the reviewed text through the selected workflow',async()=>{
  endpoints.dispatchRender.mockResolvedValue({id:'done',status:'done',output_files:['result.png']});
  await paint();await click('Text to image');expect(buttons().find(b=>b.textContent==='Generate').disabled).toBe(true);
  input('textarea[aria-label="Image description"]','A bright studio portrait');await click('Generate');
  expect(endpoints.dispatchRender).toHaveBeenCalledTimes(1);expect(endpoints.dispatchRender.mock.calls[0][0].workflow_id).toBe('image');
  expect(container.querySelector('img[alt="Generated result"]').getAttribute('src')).toBe('result.png');
});
test('loads saved characters without updating the original and saves explicit copies',async()=>{
  endpoints.listCharacters.mockResolvedValue([{id:'source',name:'Alex',dna:previewPerson().dna}]);endpoints.createCharacter.mockResolvedValue({id:'copy',name:'Alex'});
  await paint();await click('Use saved character');await click('Alex');await click('Save a copy');
  expect(endpoints.createCharacter.mock.calls[0][0].name).toBe('Alex');expect(container.querySelector('a[href="/character/copy"]')).not.toBeNull();
});
test('mobile inspector detail choices return to the sheet rather than losing the editing panel',async()=>{
  await paint();await act(async()=>container.querySelector('.cs-mobile-panels button').click());
  let dialog=document.querySelector('[role="dialog"]');expect(dialog.className).toContain('cs-sheet');
  await act(async()=>[...dialog.querySelectorAll('button')].find(button=>button.textContent.includes('Gender')).click());
  expect(document.querySelector('[aria-label="Find an option"]')).not.toBeNull();await click('male');
  dialog=document.querySelector('[role="dialog"]');expect(dialog.className).toContain('cs-sheet');expect(dialog.textContent).toContain('Your character');
});
test('invalid source files never upload and leave a clear error',async()=>{
  await paint();await click('Image edit');const upload=document.querySelector('input[type="file"]');
  Object.defineProperty(upload,'files',{value:[new File(['bad'],'bad.txt',{type:'text/plain'})]});
  await act(async()=>upload.dispatchEvent(new Event('change',{bubbles:true})));
  expect(container.querySelector('[role="alert"]').textContent).toContain('JPG');expect(endpoints.uploadReferenceImage).not.toHaveBeenCalled();
});
test('restores a draft after leaving the workspace',async()=>{
  await paint();input('.cs-label input','My new character');await act(async()=>root.unmount());
  root=createRoot(container);await paint();expect(container.querySelector('h1').textContent).toBe('My new character');
});
test('explicit scene changes are included in text generation and can be cleared',async()=>{
  endpoints.dispatchRender.mockResolvedValue({id:'scene-result',status:'done'});await paint();await click('Text to image');input('textarea[aria-label="Image description"]','A portrait');await click('Scene');
  await act(async()=>buttons().find(button=>button.textContent.includes('Environment')).click());await click('beach');await click('Generate');
  expect(endpoints.dispatchRender.mock.calls[0][0].prompt_positive).toContain('beach');
  await click('Use prompt only');await click('Generate');expect(endpoints.dispatchRender.mock.calls[1][0].prompt_positive).not.toContain('beach');
});
test('image edit uploads the chosen reference and uses the edit workflow',async()=>{
  endpoints.uploadReferenceImage.mockResolvedValue({name:'uploaded.png',subfolder:'input'});endpoints.dispatchRender.mockResolvedValue({id:'edit-job',status:'done'});
  const createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL;URL.createObjectURL=jest.fn(()=> 'blob:reference');URL.revokeObjectURL=jest.fn();
  try {
    await paint();await click('Image edit');const upload=document.querySelector('input[type="file"]');
    expect(container.querySelector('.cs-preserve-toggle input').checked).toBe(true);
    Object.defineProperty(upload,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});
    await act(async()=>upload.dispatchEvent(new Event('change',{bubbles:true})));input('textarea[aria-label="Image description"]','Change the jacket to navy');await click('Generate');
    expect(endpoints.dispatchRender.mock.calls[0][0]).toMatchObject({workflow_id:'edit',reference_image:'input/uploaded.png',preserve_unmentioned:true});
    expect(endpoints.dispatchRender.mock.calls[0][0].edit_instruction).toContain('face, identity, hair, expression, and camera framing unchanged');
    await act(async()=>root.unmount());root=createRoot(container);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reference');
  } finally {URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;}
});
test('physical and intimate detail categories are visible and their controls can be edited',async()=>{
  await paint();await click('Physical features');expect(container.textContent).toContain('Waist & hips');await click('Bust');expect(container.textContent).toContain('Bust shape');
  await click('Intimate details');expect(container.textContent).toContain('Grooming');await click('Chest anatomy');
  await act(async()=>buttons().find(button=>button.textContent.includes('Nipple size')).click());
  expect(document.querySelector('[role="dialog"]').textContent).toContain('small nipple tips');await click('small nipple tips');
  expect(container.querySelector('.cs-field-list').textContent).toContain('small nipple tips');
});
test('category directory can jump directly from character controls to photography controls',async()=>{
  await paint();await act(async()=>buttons().find(button=>button.textContent.includes('Browse all categories')).click());
  const dialog=document.querySelector('[role="dialog"]');expect(dialog.textContent).toContain('People & casting');
  await act(async()=>[...dialog.querySelectorAll('button')].find(button=>button.textContent.includes('Lighting')).click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();expect(container.querySelector('.cs-inspector h2').textContent).toBe('Build the scene');
  expect(container.querySelector('.cs-field-list').textContent).toContain('Color temp');
});
