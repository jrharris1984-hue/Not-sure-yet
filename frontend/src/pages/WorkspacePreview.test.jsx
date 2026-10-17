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
test('start screen offers only three tasks without loading the character library',async()=>{
  await paint();expect(container.querySelectorAll('main button')).toHaveLength(3);
  expect(container.querySelector('footer')).toBeNull();
  expect(endpoints.listCharacters).not.toHaveBeenCalled();
});
test('relationship controls appear only for multiple people and disappear when removed',async()=>{
  await paint();await click('Choose a character');
  expect(container.textContent).toContain('One person');expect(container.querySelector('select')).toBeNull();
  await click('Add another person');expect(container.textContent).toContain('Relationship');
  await click('Remove this person');expect(container.querySelector('select')).toBeNull();
});
test('description is required and survives step navigation; generation becomes available after review',async()=>{
  await paint();await click('Describe an image');
  const next=()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Continue');
  expect(next().disabled).toBe(true);
  act(()=>{const input=container.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'A bright studio portrait');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(next().disabled).toBe(false);await click('Continue');await click('Back');
  expect(container.querySelector('textarea').value).toBe('A bright studio portrait');
  await click('Continue');await click('Review image');
  expect([...container.querySelectorAll('button')].find(b=>b.textContent.includes('Generate')).disabled).toBe(false);
});
test('saved character locks disable editing and source DNA is copied',async()=>{
  const source={id:'a',name:'Alex',dna:{identity:{age:36},hair:{style:'bob',color:'black'},face:{eye_color:'brown'}},locks:{hair:true}};
  endpoints.listCharacters.mockResolvedValue([source]);await paint();await click('Choose a character');await click('Choose character');await click('Alex');
  await click('Continue');expect([...container.querySelectorAll('button')].find(b=>b.textContent.includes('Hair style')).disabled).toBe(true);
  const copy=previewPerson(source);copy.dna.identity.age=40;expect(source.dna.identity.age).toBe(36);
});
test('flow requirements and option data use existing editor choices',()=>{
  expect(previewCanContinue('instruction',{instruction:'   '})).toBe(false);
  expect(previewCanContinue('source',{image:''})).toBe(false);
  expect(previewCanContinue('source',{image:'blob:local'})).toBe(true);
  expect(previewOptions('hair','style').length).toBeGreaterThan(0);
  expect(previewPerson().dna.identity.age).toBe(30);
});
