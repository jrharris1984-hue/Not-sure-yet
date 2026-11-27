import { act } from 'react';
import { createRoot } from 'react-dom/client';
import WorkspacePreview from './WorkspacePreview';
import { previewPerson, previewCanContinue, previewOptions } from '@/lib/workspacePreview';
import { endpoints } from '@/lib/api';

jest.setTimeout(15000);

jest.mock('react-router-dom', () => ({ Link: ({to, children, ...props}) => <a href={to} {...props}>{children}</a> }), {virtual:true});
jest.mock('@/lib/api', () => ({endpoints:{listCharacters:jest.fn(),listWorkflows:jest.fn(),settings:jest.fn(),createCharacter:jest.fn()}}));
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  container=document.createElement('div');document.body.appendChild(container);
  root=createRoot(container);jest.clearAllMocks();endpoints.settings.mockResolvedValue({});endpoints.listWorkflows.mockResolvedValue([{id:'image',name:'Image',kind:'image',prompt_style:'krea2'}]);
  endpoints.createCharacter.mockResolvedValue({id:'new-character',name:'New character'});
});
afterEach(() => {act(()=>root.unmount());container.remove();});
const paint=async()=>{await act(async()=>root.render(<WorkspacePreview/>));};
const click=async text=>{await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text)).click());};
test('start screen offers four distinct tasks without loading the character library',async()=>{
  await paint();expect(container.querySelectorAll('main button')).toHaveLength(4);
  expect(container.querySelector('footer')).toBeNull();
  expect(container.querySelector('header a[href="/create"]')).not.toBeNull();
  expect(endpoints.listCharacters).not.toHaveBeenCalled();
});
test('gallery shortcut stays visible and opens separately to preserve the wizard draft',async()=>{
  await paint();
  const link=container.querySelector('header a[href="/gallery"]');
  expect(link?.textContent).toContain('Gallery');
  expect(link?.target).toBe('_blank');
});
test('saving a wizard character offers the next photoshoot step',async()=>{
  await paint();await click('Create a new character');
  await click('Next');await click('Next');await click('Next');await click('Review image');
  await click('Save as new character');
  expect(container.querySelector('a[href="/shoot/new/new-character"]')?.textContent).toContain('Plan this character’s photoshoot');
  expect(container.querySelector('a[href="/character/new-character"]')?.textContent).toContain('Open full character editor');
});
test('relationship controls appear only for multiple people and disappear when removed',async()=>{
  await paint();await click('Create a new character');
  expect(container.textContent).toContain('One person');expect([...container.querySelectorAll('label')].some(label=>label.textContent.startsWith('Relationship'))).toBe(false);
  await click('Add another person');expect(container.textContent).toContain('Relationship');
  expect(container.querySelector('[aria-label="Choose subject to edit"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Edit Subject A"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Edit Subject B"]')).not.toBeNull();
  const pairing=container.querySelector('[aria-label="Relationship / cast pairing"]');
  expect([...pairing.options].some(option=>option.value==='sisters')).toBe(true);
  expect([...pairing.options].some(option=>option.value==='mother and daughter')).toBe(true);
  act(()=>{pairing.value='mother and daughter';pairing.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.textContent).toContain('family pairings can suggest related adult features and ages');
  await click('Remove this person');expect([...container.querySelectorAll('label')].some(label=>label.textContent.startsWith('Relationship'))).toBe(false);
});
test('random starter creates a multi-person lingerie shoot with distinct outfits and shared pose controls',async()=>{
  await paint();await click('Create a new character');
  const category=document.querySelector('select[aria-label="Wardrobe category"]');expect(category).not.toBeNull();
  act(()=>{category.value='Lingerie sets';category.dispatchEvent(new Event('change',{bubbles:true}));});
  const cast=document.querySelector('select[aria-label="Random cast size"]');act(()=>{cast.value='3';cast.dispatchEvent(new Event('change',{bubbles:true}));});
  await click('Create random 3-person shoot');
  expect(container.querySelector('[role="status"]').textContent).toContain('Subjects have randomized looks from Lingerie sets');
  expect(container.querySelector('[aria-label="Edit Subject C"]')).not.toBeNull();
  await click('Body build');expect(container.textContent).toContain('Intimate details');await click('Next');
  const selectedOutfit=()=>container.querySelector('.wp-block .wp-selection')?.textContent;
  const outfits=[selectedOutfit()];
  for(const name of ['Subject B','Subject C']){await click(name);outfits.push(selectedOutfit());}
  expect(new Set(outfits).size).toBe(3);expect(outfits.every(value=>/lingerie|bra|briefs|stockings|boudoir|slip|robe/i.test(value))).toBe(true);
  await click('Next');
  expect(container.querySelector('[data-testid="cast-aware-poses"]')).not.toBeNull();
  const groupPose=[...container.querySelectorAll('[data-testid="cast-aware-poses"] button')].find(button=>button.textContent.includes('three or four adults walking together across one studio set'));
  expect(groupPose).toBeDefined();await act(async()=>groupPose.click());
  expect(container.querySelector('[data-testid="cast-aware-poses"] button[aria-pressed="true"]')?.textContent).toContain('three or four adults walking together');
  const pose=()=>[...container.querySelectorAll('.wp-detail-row')].find(row=>row.querySelector('span')?.textContent==='Pose')?.querySelector('strong')?.textContent;
  const sharedPose=pose();for(const name of ['Subject B','Subject C']){await click(name);expect(pose()).toBe(sharedPose);expect(container.querySelector('[data-testid="cast-aware-poses"] button[aria-pressed="true"]')?.textContent).toContain('three or four adults walking together');}
  await click('Review image');expect(container.querySelector('h1').textContent).toBe('Everything look right?');
});
test('Quick Start can assign one exact Wardrobe outfit to every subject',async()=>{
  await paint();await click('Create a new character');
  const category=document.querySelector('select[aria-label="Wardrobe category"]');
  act(()=>{category.value='Lingerie sets';category.dispatchEvent(new Event('change',{bubbles:true}));});
  const outfit=document.querySelector('select[aria-label="Specific outfit"]');
  const exactOutfit=outfit.options[1].value;
  act(()=>{outfit.value=exactOutfit;outfit.dispatchEvent(new Event('change',{bubbles:true}));});
  const cast=document.querySelector('select[aria-label="Random cast size"]');act(()=>{cast.value='2';cast.dispatchEvent(new Event('change',{bubbles:true}));});
  await click('Create random 2-person shoot');
  expect(container.querySelector('[role="status"]').textContent).toContain(`All subjects are wearing “${exactOutfit}.”`);
  await click('Next');
  const selectedOutfit=()=>container.querySelector('.wp-block .wp-selection')?.textContent;
  expect(selectedOutfit()).toContain(exactOutfit);
  await click('Subject B');expect(selectedOutfit()).toContain(exactOutfit);
});
test('image settings allow twenty outputs and expose seed, group pose, and camera controls',async()=>{
  await paint();await click('Create a new character');await click('Add another person');
  await click('Next');await click('Next');await click('Next');await click('Next');
  await click('Image settings');
  const settings=document.querySelector('.wp-settings');
  expect(settings.querySelectorAll('[aria-label="Images to generate"] option')).toHaveLength(20);
  const imageCount=settings.querySelector('[aria-label="Images to generate"]');
  act(()=>{imageCount.value='20';imageCount.dispatchEvent(new Event('change',{bubbles:true}));});
  const advanced=settings.querySelector('summary');act(()=>advanced.click());
  expect(settings.querySelector('[aria-label="Seed"]')).not.toBeNull();
  expect(settings.querySelector('[data-testid="cast-aware-poses"]')).not.toBeNull();
  const camera=settings.querySelector('[aria-label="Horizontal camera direction"]');
  expect(camera).not.toBeNull();
  const back=[...camera.querySelectorAll('button')].find(button=>button.textContent==='Back');
  await act(async()=>back.click());
  expect(settings.querySelector('.camera-orbit-picker [aria-live="polite"]')?.textContent).toContain('Selected: back');
  await click('Done');
  expect(container.querySelector('.wp-review-settings')?.textContent).toContain('20 images');
  expect([...container.querySelectorAll('.wp-review-settings')].some(row=>row.textContent.includes('20 images'))).toBe(true);
});
test('Smart Shoot lives in Image Settings and previews editable per-image directions',async()=>{
  await paint();await click('Create a new character');
  await click('Next');await click('Next');await click('Next');await click('Next');
  await click('Image settings');
  const settings=document.querySelector('.wp-settings');
  act(()=>settings.querySelector('summary').click());
  const enable=settings.querySelector('[aria-label="Enable Smart Shoot"]');
  expect(enable).not.toBeNull();
  act(()=>enable.click());
  expect(settings.querySelector('[aria-label="Smart Shoot style"]')).not.toBeNull();
  expect(settings.querySelector('[aria-label="Smart Shoot style"]').value).toBe('boudoir');
  expect(settings.querySelector('[aria-label="Smart Shoot variation strength"]')).not.toBeNull();
  expect(settings.querySelectorAll('[data-testid="wizard-smart-shoot-plan"] li')).toHaveLength(1);
  const count=settings.querySelector('[aria-label="Images to generate"]');
  act(()=>{count.value='6';count.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(settings.querySelectorAll('[data-testid="wizard-smart-shoot-plan"] li')).toHaveLength(6);
  expect(settings.querySelector('[data-testid="wizard-smart-shoot-plan"]').textContent).toContain('seed varies');
  await click('Done');
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

test('body categories expose size sliders through the expanded glute maximum',async()=>{
  await paint();await click('Create a new character');await click('Next');await click('Body build');await click('Glutes');
  await click('Glute size (slider)');expect(document.querySelector('input[type="range"]').max).toBe('2000');await click('Done');
  await click('Waist & hips');expect(container.textContent).toContain('Hip width (slider)');
  await click('Bust');expect(container.textContent).toContain('Bust shape');
});
test('body build includes grouped intimate details and saves selections to the intimate section',async()=>{
  await paint();await click('Create a new character');await click('Next');await click('Body build');await click('Intimate details');
  expect(container.textContent).toContain('Grooming');expect(container.textContent).toContain('Body hair');expect(container.textContent).toContain('Pubic hair');
  await click('Pubic hair');await click('landing strip');expect(container.textContent).toContain('landing strip');
  await click('Chest anatomy');expect(container.textContent).toContain('Nipple size');expect(container.textContent).toContain('Areola detail');
  await click('Body jewelry');expect(container.textContent).toContain('Piercings');
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
