import { act } from 'react';
import { createRoot } from 'react-dom/client';
import WorkspacePreview from './WorkspacePreview';
import { previewPerson, previewCanContinue, previewOptions } from '@/lib/workspacePreview';
import { endpoints } from '@/lib/api';

jest.mock('react-router-dom', () => ({ Link: ({to, children, ...props}) => <a href={to} {...props}>{children}</a> }), {virtual:true});
jest.mock('@/lib/api', () => ({endpoints:{listCharacters:jest.fn(),listWorkflows:jest.fn(),settings:jest.fn()}}));
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  container=document.createElement('div');document.body.appendChild(container);
  root=createRoot(container);jest.clearAllMocks();endpoints.settings.mockResolvedValue({});endpoints.listWorkflows.mockResolvedValue([{id:'image',name:'Image',kind:'image',prompt_style:'krea2'}]);
});
afterEach(() => {act(()=>root.unmount());container.remove();});
const paint=async()=>{await act(async()=>root.render(<WorkspacePreview/>));};
const click=async text=>{await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text)).click());};
test('start screen offers four distinct tasks without loading the character library',async()=>{
  await paint();expect(container.querySelectorAll('main button')).toHaveLength(4);
  expect(container.querySelector('footer')).toBeNull();
  expect(endpoints.listCharacters).not.toHaveBeenCalled();
});
test('relationship controls appear only for multiple people and disappear when removed',async()=>{
  await paint();await click('Create a new character');
  expect(container.textContent).toContain('One person');expect([...container.querySelectorAll('label')].some(label=>label.textContent.startsWith('Relationship'))).toBe(false);
  await click('Add another person');expect(container.textContent).toContain('Relationship');
  await click('Remove this person');expect([...container.querySelectorAll('label')].some(label=>label.textContent.startsWith('Relationship'))).toBe(false);
});
test('description is required and survives step navigation; generation becomes available after review',async()=>{
  await paint();await click('Describe an image');
  const next=()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Next');
  expect(next().disabled).toBe(true);
  act(()=>{const input=container.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'A bright studio portrait');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(next().disabled).toBe(false);await click('Next');await click('Previous');
  expect(container.querySelector('textarea').value).toBe('A bright studio portrait');
  await click('Next');await click('Review image');
  expect([...container.querySelectorAll('button')].find(b=>b.textContent.includes('Generate')).disabled).toBe(false);
});
test('saved character locks disable editing and source DNA is copied',async()=>{
  const source={id:'a',name:'Alex',dna:{identity:{age:36},hair:{style:'bob',color:'black'},face:{eye_color:'brown'}},locks:{hair:true}};
  endpoints.listCharacters.mockResolvedValue([source]);await paint();await click('Create a new character');await click('Choose character');await click('Alex');
  await click('Next');expect([...container.querySelectorAll('button')].find(b=>b.textContent.includes('Hair style')).disabled).toBe(true);
  const copy=previewPerson(source);copy.dna.identity.age=40;expect(source.dna.identity.age).toBe(36);
});
test('flow requirements and option data use existing editor choices',()=>{
  expect(previewCanContinue('instruction',{instruction:'   '})).toBe(false);
  expect(previewCanContinue('source',{image:''})).toBe(false);
  expect(previewCanContinue('source',{image:'blob:local'})).toBe(true);
  expect(previewOptions('hair','style').length).toBeGreaterThan(0);
  expect(previewPerson().dna.identity.age).toBe(30);
});

test('saved-character entry opens the library picker directly',async()=>{
  endpoints.listCharacters.mockResolvedValue([{id:'saved',name:'Saved person',dna:previewPerson().dna}]);
  await paint();await click('Use a saved character');
  expect(document.querySelector('[role="dialog"]').textContent).toContain('Saved person');
  await click('Saved person');expect(container.querySelector('input').value).toBe('Saved person');
});

test('new-character creation exposes identity choices and browsable appearance details',async()=>{
  await paint();await click('Create a new character');
  expect(container.textContent).toContain('Heritage');expect(container.textContent).toContain('Character theme');
  expect(endpoints.listCharacters).not.toHaveBeenCalled();
  await click('Next');await click('Face');expect(container.textContent).toContain('Eye shape');
  expect(container.textContent).toContain('Jawline');expect(container.textContent).not.toContain('Hair length');
  await click('Skin');await click('Tattoos');
  const input=document.querySelector('input[aria-label="Tattoos"]');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'small shoulder tattoo');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await click('Done');expect(container.textContent).toContain('small shoulder tattoo');
  await click('Body build');await click('Muscularity');
  const range=document.querySelector('input[type="range"]');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(range,'42');range.dispatchEvent(new Event('change',{bubbles:true}));});
  await click('Done');expect(container.textContent).toContain('42');
});

test('body categories expose size sliders and the original glute maximum',async()=>{
  await paint();await click('Create a new character');await click('Next');await click('Body build');await click('Glutes');
  await click('Glute size (slider)');expect(document.querySelector('input[type="range"]').max).toBe('300');await click('Done');
  await click('Waist & hips');expect(container.textContent).toContain('Hip width (slider)');
  await click('Bust');expect(container.textContent).toContain('Bust shape');
});
test('complete outfits are searchable beyond the heritage list and wardrobe has individual garment categories',async()=>{
  await paint();await click('Create a new character');await click('Next');await click('Next');await click('Browse outfit choices');
  const select=document.querySelector('select[aria-label="Option category"]');
  act(()=>{select.value='Costume sets';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(document.querySelector('[role="dialog"]').textContent).toContain('superheroine');
  await click('superheroine bodysuit');expect(container.textContent).toContain('Selected:');
  await click('Outfit mode');await click('Custom');await click('Accessories & nails');await click('Accessories (pick many)');
  const dialog=()=>document.querySelector('[role="dialog"]');const choices=()=>[...dialog().querySelectorAll('.wp-picker-list>button')].filter(b=>b.textContent!=='Done');
  await act(async()=>choices()[0].click());await act(async()=>choices()[1].click());
  expect(choices().filter(button=>button.getAttribute('aria-pressed')==='true')).toHaveLength(2);
  await click('Done');expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test('guided character flow opens the suite library and requires an explicit apply',async()=>{
  await paint();await click('Create a new character');await click('Randomize');
  expect(document.querySelector('[aria-label="Randomizer suites"]')).not.toBeNull();
  await click('Fresh character look');expect(document.querySelector('[aria-label="Randomizer preview"]')).not.toBeNull();
  await click('Apply these changes');expect(document.querySelector('[role="dialog"]').textContent).toContain('Applied. Review the character');
  await click('Undo last randomizer');expect(document.querySelector('[role="dialog"]').textContent).toContain('Randomizer undone.');
});

test('completed stages can be revisited without repeatedly clicking Continue',async()=>{
  await paint();await click('Create a new character');await click('Next');await click('Next');await click('Previous');await click('Previous');
  const select=container.querySelector('select[aria-label="Jump to a visited step"]');
  expect(select.options[2].disabled).toBe(false);expect(select.options[4].disabled).toBe(true);
  act(()=>{select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelector('h1').textContent).toBe('What are they wearing?');
});
test('detail search finds controls outside the current appearance category',async()=>{
  await paint();await click('Create a new character');await click('Next');
  const input=container.querySelector('input[aria-label="Find a character detail"]');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'hip');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(container.querySelector('.wp-search-results').textContent).toContain('Hip width');
  expect(container.querySelector('.wp-search-results').textContent).not.toContain('Hair color');
  expect(container.querySelector('nav[aria-label="Workspace navigation"] a[href="/gallery"]')).not.toBeNull();
});
