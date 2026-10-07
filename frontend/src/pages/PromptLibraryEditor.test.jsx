import {act} from 'react';
import {createRoot} from 'react-dom/client';
import PromptLibraryEditor from './PromptLibraryEditor';
import {endpoints} from '@/lib/api';
import {getPromptCatalog,setPromptCatalog,editableSection,promptLibrarySections} from '@/lib/promptCatalog';
import {SECTIONS} from '@/lib/dna';
import {expandPrompt} from '@/lib/promptMap';
jest.mock('react-router-dom',() => ({Link:({to,children,...props}) => <a href={to} {...props}>{children}</a>}),{virtual:true});
jest.mock('@/lib/api',() => ({endpoints:{settings:jest.fn(),updateSettings:jest.fn(),aiPromptLibrary:jest.fn()}}));
let root,container;
beforeEach(() => {global.IS_REACT_ACT_ENVIRONMENT=true; jest.clearAllMocks();setPromptCatalog({sections:[]});
  endpoints.settings.mockResolvedValue({ai_provider:'ollama',prompt_catalog:{sections:[]}});
  endpoints.updateSettings.mockImplementation(async body => body);
  container=document.createElement('div');root=createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const button=text => [...container.querySelectorAll('button')].find(item => item.textContent===text);
const enter=async(input,text) => {await act(async() => {Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,text);input.dispatchEvent(new Event('input',{bubbles:true}));});};
const setup=async() => {
  await act(async() => root.render(<PromptLibraryEditor/>));
  act(() => button('Add category').click());await enter(container.querySelector('[aria-label="Category name"]'),'Atmosphere');
  act(() => button('Add subcategory').click());await enter(container.querySelector('[aria-label="Subcategory name"]'),'Weather detail');
  act(() => button('Add choice').click());
  await enter(container.querySelector('[aria-label^="Display name custom_"]'),'Morning mist');
  await enter(container.querySelector('[aria-label^="Keywords custom_"]'),'gentle morning mist');
};
test('creates and saves a category, subcategory and choice only after explicit save; reload preserves it', async() => {
  await setup();
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  expect(getPromptCatalog().sections).toEqual([]);
  await act(async() => button('Save library').click());
  const saved=endpoints.updateSettings.mock.calls[0][0].prompt_catalog;
  expect(saved.sections[0]).toMatchObject({title:'Atmosphere',fields:[{label:'Weather detail',options:[{label:'Morning mist',keywords:'gentle morning mist'}]}]});
  expect(getPromptCatalog()).toEqual(saved);
  endpoints.settings.mockResolvedValue({ai_provider:'ollama',prompt_catalog:saved});
  act(() => root.unmount());root=createRoot(container);
  await act(async() => root.render(<PromptLibraryEditor/>));act(() => button('Atmosphere').click());
  expect(container.querySelector('[aria-label^="Keywords custom_"]').value).toBe('gentle morning mist');
});
test('Ollama suggestion is reviewed before applying and does not save automatically', async() => {
  await setup();endpoints.aiPromptLibrary.mockResolvedValue({keywords:'a thin layer of morning mist near the ground'});
  await act(async() => button('Improve keywords with Ollama').click());
  expect(endpoints.aiPromptLibrary).toHaveBeenCalledWith({category:'Atmosphere',subcategory:'Weather detail',label:'Morning mist',keywords:'gentle morning mist'});
  expect(container.querySelector('[aria-label^="Keywords custom_"]').value).toBe('gentle morning mist');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  const keywords=container.querySelector('[aria-label^="Keywords custom_"]');
  expect(keywords.closest('div').querySelector('[aria-label="AI keyword suggestion"]')).not.toBeNull();
  act(() => button('Apply suggestion').click());
  expect(container.querySelector('[aria-label^="Keywords custom_"]').value).toContain('a thin layer');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
});
test('failed save retains the draft and leaves the active catalog unchanged', async() => {
  await setup();endpoints.updateSettings.mockRejectedValue(new Error('offline'));
  await act(async() => button('Save library').click());
  expect(container.querySelector('[role="alert"]').textContent).toContain('Could not save');
  expect(container.querySelector('[aria-label="Category name"]').value).toBe('Atmosphere');
  expect(getPromptCatalog().sections).toEqual([]);
});
test('failed initial loading does not expose an editor that could overwrite saved data', async() => {
  endpoints.settings.mockRejectedValue(new Error('offline'));
  await act(async() => root.render(<PromptLibraryEditor/>));
  expect(container.querySelector('[role="alert"]').textContent).toContain('Could not load');
  expect(button('Save library')).toBeUndefined();
});
test('restoring defaults is a draft until explicitly saved', async() => {
  await setup();await act(async() => button('Save library').click());
  act(() => button('Restore defaults').click());
  expect(getPromptCatalog().sections[0].title).toBe('Atmosphere');
  expect(endpoints.updateSettings).toHaveBeenCalledTimes(1);
  await act(async() => button('Save library').click());
  expect(getPromptCatalog().sections).toEqual([]);
});

test('user prompt rule can be edited and toggled; category edits do not discard rules', async() => {
  await act(async() => root.render(<PromptLibraryEditor/>));
  act(() => button('Add rule').click());
  await enter(container.querySelector('[aria-label^="Rule name custom_"]'),'Avoid haze');
  await enter(container.querySelector('[aria-label^="Rule wording custom_"]'),'clear air without haze');
  act(() => button('Add category').click());
  await enter(container.querySelector('[aria-label="Category name"]'),'My lighting');
  await act(async() => button('Save library').click());
  expect(getPromptCatalog().rules[0]).toMatchObject({label:'Avoid haze',text:'clear air without haze',enabled:true});
  act(() => container.querySelector('[aria-label^="Enable rule custom_"]').click());
  await act(async() => button('Save library').click());
  expect(getPromptCatalog().rules[0].enabled).toBe(false);
});


test('folders expose every built-in category and one choice editor with its existing wording and Ollama assistance', async() => {
  await act(async() => root.render(<PromptLibraryEditor/>));
  SECTIONS.forEach(section => expect(button(section.title)).toBeDefined());
  expect(container.querySelector('aside').className).toContain('block');
  act(() => button('Hair').click());
  expect(container.querySelector('aside').className).toContain('hidden md:block');
  act(() => button('📁 Color').click());
  const color=editableSection(SECTIONS.find(section => section.key==='hair')).fields.find(field => field.key==='color');
  const choice=color.options[0];
  act(() => [...container.querySelector('[aria-label="Choice folders"]').querySelectorAll('button')][0].click());
  expect(container.querySelectorAll('[aria-label^="Display name "]')).toHaveLength(1);
  expect(container.querySelector(`[aria-label="Keywords ${choice.value}"]`).value).toBe(expandPrompt('hair','color',choice.value));
  endpoints.aiPromptLibrary.mockResolvedValue({keywords:'natural dark hair with subtle highlights'});
  await act(async() => button('Improve keywords with Ollama').click());
  expect(endpoints.aiPromptLibrary).toHaveBeenCalledWith(expect.objectContaining({keywords:expandPrompt('hair','color',choice.value)}));
  act(() => button('← Back').click());
  expect(container.querySelector('[aria-label="Choice folders"]').className).not.toContain('hidden');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
});

test('compiled preview uses draft keywords without saving and clears when the wording changes', async() => {
  await setup();
  act(() => button('Preview compiled prompt').click());
  expect(container.querySelector('[aria-label="Compiled positive preview"]').value).toContain('gentle morning mist');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  await enter(container.querySelector('[aria-label^="Keywords custom_"]'),'soft evening haze');
  expect(container.querySelector('[aria-label="Compiled positive preview"]')).toBeNull();
  act(() => button('Preview compiled prompt').click());
  expect(container.querySelector('[aria-label="Compiled positive preview"]').value).toContain('soft evening haze');
  expect(getPromptCatalog().sections).toEqual([]);
});


test('bulk choices review and apply multiple updates without saving automatically', async() => {
  await setup();
  const originalValue=container.querySelector('[aria-label^="Display name custom_"]').getAttribute('aria-label').replace('Display name ','');
  await enter(container.querySelector('[aria-label="Bulk choice entries"]'),'[Weather]\nMorning mist: exact revised mist wording\nEvening haze: exact evening haze wording');
  act(()=>button('Preview batch').click());
  expect(container.querySelector('[aria-label="Bulk batch preview"]').textContent).toContain('1 new · 1 updates');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  act(()=>button('Apply batch to draft').click());
  expect(getPromptCatalog().sections).toEqual([]);
  await act(async()=>button('Save library').click());
  const options=getPromptCatalog().sections[0].fields[0].options;
  expect(options).toHaveLength(2);
  expect(options[0]).toMatchObject({value:originalValue,label:'Morning mist',keywords:'exact revised mist wording',group:'Weather'});
  expect(options[1]).toMatchObject({label:'Evening haze',keywords:'exact evening haze wording',group:'Weather'});
});

test('bulk editing is available for built-in categories and can load existing entries', async() => {
  await act(async()=>root.render(<PromptLibraryEditor/>));
  for (const [category,field] of [['Hair','Color'],['Skin','Tone'],['Pose','Pose']]) {
    act(()=>button(category).click());
    act(()=>button(`📁 ${field}`).click());
    expect(container.querySelector('[data-testid="bulk-choice-editor"]')).not.toBeNull();
    act(()=>button('Load current entries for editing').click());
    expect(container.querySelector('[aria-label="Bulk choice entries"]').value).toContain(': ');
    expect(endpoints.updateSettings).not.toHaveBeenCalled();
  }
});

test('compact wording edits preview the draft and persist without replacing detailed keywords', async() => {
  await setup();
  await enter(container.querySelector('[aria-label^="Compact wording custom_"]'),'morning mist');
  await enter(container.querySelector('[aria-label^="Compact tags custom_"]'),'morning_mist');
  act(() => button('Preview compact prompt').click());
  expect(container.querySelector('[aria-label="Compiled positive preview"]').value).toContain('morning mist');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  await act(async() => button('Save library').click());
  const option = getPromptCatalog().sections[0].fields[0].options[0];
  expect(option.short).toBe('morning mist');
  expect(option.short_tags).toBe('morning_mist');
  expect(option.keywords).toBe('gentle morning mist');
});

test('Ollama compact suggestions require review and apply only to compact wording', async() => {
  await setup();
  endpoints.aiPromptLibrary.mockResolvedValue({keywords:'morning mist'});
  await act(async() => button('Suggest compact wording with Ollama').click());
  expect(endpoints.aiPromptLibrary).toHaveBeenCalledWith(expect.objectContaining({compact:true,keywords:'gentle morning mist'}));
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  act(() => button('Apply compact wording').click());
  expect(container.querySelector('[aria-label^="Compact wording custom_"]').value).toBe('morning mist');
  expect(container.querySelector('[aria-label^="Keywords custom_"]').value).toBe('gentle morning mist');
});


test('Prompt Library puts Scenario before Identity and exposes Shared Poses for two-person editing', async() => {
  await act(async() => root.render(<PromptLibraryEditor/>));
  const categoryButtons=[...container.querySelector('aside').querySelectorAll('button')].filter(button => button.textContent !== 'Add category');
  expect(categoryButtons[0].textContent).toBe('Scenario');
  expect(categoryButtons[1].textContent).toBe('Identity');
  expect(button('Shared Poses')).toBeDefined();
  act(() => button('Shared Poses').click());
  expect(button('📁 2 people')).toBeDefined();
  act(() => button('📁 2 people').click());
  expect(container.textContent).toContain('Portrait');
  expect(container.textContent).toContain('side by side');
});

test('Prompt Library section helper keeps Shared Poses out of the DNA schema order while adding it to the editor', () => {
  const sections=promptLibrarySections(SECTIONS);
  expect(sections[0].key).toBe('scenario');
  expect(sections[1].key).toBe('identity');
  expect(sections.find(section => section.key==='shared_poses')).toBeDefined();
});
