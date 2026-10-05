import { updateAssistantResearch } from '@/lib/assistantResearch';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import FreeformCreate from './FreeformCreate';
import { endpoints } from '@/lib/api';
jest.mock('react-router-dom', () => ({ Link: ({to,children,...props}) => <a href={to} {...props}>{children}</a> }), {virtual:true});
jest.mock('@/lib/api', () => ({ endpoints: {settings:jest.fn(),listWorkflows:jest.fn(),aiImproveGeneratedPrompt:jest.fn(),aiVideoPrompt:jest.fn(),dispatchRender:jest.fn(),uploadReferenceImage:jest.fn()} }));
let container, root;
beforeEach(() => {
  updateAssistantResearch({enabled:false,focus:'',result:null});
  global.IS_REACT_ACT_ENVIRONMENT=true; jest.clearAllMocks();
  endpoints.settings.mockResolvedValue({ai_provider:'ollama'});
  endpoints.listWorkflows.mockResolvedValue([{id:'image',name:'Image',kind:'image',prompt_style:'chroma'},{id:'video',name:'Animate',kind:'video'},{id:'text_video',name:'Video',kind:'text_video'}]);
  endpoints.dispatchRender.mockResolvedValue({id:'job',status:'queued'});
  container=document.createElement('div'); root=createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const button = text => [...container.querySelectorAll('button')].find(b => b.textContent===text);
const enter = async text => { await act(async () => {
  const input=container.querySelector('[aria-label="Your prompt"]');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,text);
  input.dispatchEvent(new Event('input',{bubbles:true}));
}); };
test('AI suggestion is reviewable and only applied explicitly; generation has no DNA', async () => {
  await act(async () => root.render(<FreeformCreate/>)); await enter('watercolor forest');
  endpoints.aiImproveGeneratedPrompt.mockResolvedValue({positive:'Watercolor forest at dawn',negative:'blur'});
  await act(async () => button('Refine with Ollama').click());
  expect(endpoints.aiImproveGeneratedPrompt).toHaveBeenCalledWith('watercolor forest','','chroma','Image',true);
  expect(container.querySelector('[aria-label="Your prompt"]').value).toBe('watercolor forest');
  expect(endpoints.dispatchRender).not.toHaveBeenCalled();
  await act(async () => button('Apply suggestion').click());
  await act(async () => button('Generate').click());
  expect(endpoints.dispatchRender.mock.calls[0][0]).toMatchObject({workflow_id:'image',prompt_positive:'Watercolor forest at dawn',prompt_negative:'blur'});
  expect(endpoints.dispatchRender.mock.calls[0][0]).not.toHaveProperty('dna');
  expect(container.textContent).toContain('Queued.');
});
test.each([['video','image'],['text_video','text']])('%s uses the correct AI mode and upload requirement', async (mode, aiMode) => {
  await act(async () => root.render(<FreeformCreate mode={mode}/>)); await enter('Camera moves left');
  endpoints.aiVideoPrompt.mockResolvedValue({prompt:'Slow camera pan left'});
  await act(async () => button('Refine with Ollama').click());
  expect(endpoints.aiVideoPrompt).toHaveBeenCalledWith('Camera moves left',aiMode);
  expect(!!container.querySelector('[aria-label="Starting image"]')).toBe(mode==='video');
  expect(button('Generate').disabled).toBe(mode==='video');
  if(mode==='text_video') {
    await act(async () => button('Generate').click());
    expect(endpoints.dispatchRender.mock.calls[0][0].video_instruction).toBe('Camera moves left');
    expect(endpoints.dispatchRender.mock.calls[0][0]).not.toHaveProperty('reference_image');
  }
});
test('AI failure preserves the user prompt', async () => {
  await act(async () => root.render(<FreeformCreate/>)); await enter('forest');
  endpoints.aiImproveGeneratedPrompt.mockRejectedValue(new Error('Assistant offline'));
  await act(async () => button('Refine with Ollama').click());
  expect(container.querySelector('[role="alert"]').textContent).toBe('Assistant offline');
  expect(container.querySelector('[aria-label="Your prompt"]').value).toBe('forest');
});
test('uploaded starting frame enables animation and is sent with the motion prompt', async () => {
  URL.createObjectURL=jest.fn(() => 'blob:preview'); URL.revokeObjectURL=jest.fn();
  endpoints.uploadReferenceImage.mockResolvedValue({name:'start.png',subfolder:'refs'});
  await act(async () => root.render(<FreeformCreate mode="video"/>)); await enter('Wind moves the trees');
  const input=container.querySelector('[aria-label="Starting image"]');
  const file=new File(['image'],'start.png',{type:'image/png'});
  Object.defineProperty(input,'files',{value:[file]});
  await act(async () => input.dispatchEvent(new Event('change',{bubbles:true})));
  expect(endpoints.uploadReferenceImage).toHaveBeenCalledWith(file);
  expect(button('Generate').disabled).toBe(false);
  await act(async () => button('Generate').click());
  expect(endpoints.dispatchRender.mock.calls[0][0]).toMatchObject({reference_image:'refs/start.png',video_instruction:'Wind moves the trees',workflow_id:'video'});
  act(() => button('Remove image').click());
  expect(button('Generate').disabled).toBe(true);
});

test.each([['image', 'image'], ['video', 'image'], ['text_video', 'text']])('%s web refinement is opt-in and sources are reviewed before applying', async (mode, aiMode) => {
  const reply = {positive:'Researched forest',prompt:'Researched forest',negative:'blur',changes:['Clarified lighting'],sources:[{id:'S1',title:'Official guide',url:'https://author.example/guide',cited:true}]};
  endpoints.aiImproveGeneratedPrompt.mockResolvedValue(reply);
  endpoints.aiVideoPrompt.mockResolvedValue(reply);
  await act(async () => root.render(<FreeformCreate mode={mode}/>)); await enter('forest');
  expect(container.querySelector('[aria-label="Use web research"]').checked).toBe(false);
  act(() => container.querySelector('[aria-label="Use web research"]').click());
  await act(async () => button('Refine with Ollama').click());
  const options={use_web_research:true,research_focus:''};
  if(mode==='image') expect(endpoints.aiImproveGeneratedPrompt).toHaveBeenCalledWith('forest','','chroma','Image',true,options);
  else expect(endpoints.aiVideoPrompt).toHaveBeenCalledWith('forest',aiMode,options);
  expect(container.querySelector('[aria-label="Your prompt"]').value).toBe('forest');
  expect(container.querySelector('[aria-label="Prompt research notes"]').textContent).toContain('Clarified lighting');
  expect(container.querySelector('a[href="https://author.example/guide"]')).not.toBeNull();
  expect(endpoints.dispatchRender).not.toHaveBeenCalled();
  await act(async () => button('Apply suggestion').click());
  expect(container.querySelector('[aria-label="Your prompt"]').value).toBe('Researched forest');
});

test.each(['video','text_video'])('%s offers both video modes with Ollama assistance', async mode => {
  await act(async () => root.render(<FreeformCreate mode={mode}/>));
  const nav=container.querySelector('[aria-label="Video creation mode"]');
  expect(nav.querySelector('a[href="/create/video"]')).not.toBeNull();
  expect(nav.querySelector('a[href="/create/text-video"]')).not.toBeNull();
  expect(nav.querySelector('[aria-current="page"]').textContent).toContain(mode==='video'?'Image to video':'Text to video');
  expect(button('Refine with Ollama')).not.toBeUndefined();
});
