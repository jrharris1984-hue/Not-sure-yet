import { SECTIONS } from '@/lib/dna';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MobilePromptDashboard from './MobilePromptDashboard';
import { clearUnlockedChoices, fieldGroups, selectedOptions } from '@/lib/mobilePromptGrid';

const sections = [
  { key: 'face', title: 'Face', fields: [
    { key: 'expression', label: 'Expression', type: 'chips', options: ['smile', 'smirk'] },
    { key: 'eyes', label: 'Eyes', type: 'chips', options: ['blue', 'brown'] },
  ] },
  { key: 'wardrobe', title: 'Wardrobe', fields: [
    { key: 'tops', label: 'Tops', type: 'chips_multi', options: ['cotton shirt', 'leather jacket'] },
  ] },
];
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function Harness({ locks = {}, fieldLocks = {} }) {
  const [dna, setDna] = useState({ face: { expression: 'smile', eyes: 'blue' }, wardrobe: { tops: [] } });
  const [sectionKey, onSection] = useState('face');
  return <MobilePromptDashboard sections={sections} dna={dna} sectionKey={sectionKey} onSection={onSection}
    onChange={(section, value) => setDna(current => ({ ...current, [section]: value }))}
    locks={locks} fieldLocks={fieldLocks} onToggleFieldLock={() => {}}
    name="Test character" workflows={[]} subjects={[]} onName={() => {}} onSave={() => {}}
    onClearAll={() => setDna(current => clearUnlockedChoices(sections, current, locks, fieldLocks))} />;
}
function click(selector) { act(() => container.querySelector(selector).click()); }
function search(value) {
  act(() => { const input=container.querySelector('[aria-label="Search all choices"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true})); });
}

test('shows one subcategory and preserves selections across category navigation', () => {
  act(() => root.render(<Harness />));
  expect(container.querySelector('[data-testid="tile-face-expression-smile"]').getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('[data-testid="tile-face-eyes-blue"]')).toBeNull();
  const tabs=container.querySelector('[aria-label="Subcategories"]').querySelectorAll('button');
  act(() => tabs[1].click());
  expect(container.querySelector('[data-testid="tile-face-eyes-blue"]').getAttribute('aria-pressed')).toBe('true');
  click('[aria-label="Main categories"] button:nth-child(2)');
  click('[data-testid="field-tile-wardrobe-tops"]');
  click('[data-testid="tile-wardrobe-tops-leather-jacket"]');
  click('[data-testid="tile-wardrobe-tops-cotton-shirt"]');
  expect(container.querySelectorAll('[aria-pressed="true"][data-testid^="tile-wardrobe"]')).toHaveLength(2);
  click('[aria-label="Main categories"] button:first-child');
  click('[data-testid="field-tile-face-expression"]');
  expect(container.querySelector('[data-testid="tile-face-expression-smile"]').getAttribute('aria-pressed')).toBe('true');
});

test('global search reaches matching choices in another category and hides unrelated tiles', () => {
  act(() => root.render(<Harness />)); click('[aria-label="Search choices"]'); search('leather');
  expect(container.querySelector('[data-testid="tile-wardrobe-tops-leather-jacket"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="tile-face-expression-smile"]')).toBeNull();
  expect(container.querySelector('[data-testid="tile-wardrobe-tops-cotton-shirt"]')).toBeNull();
  click('[data-testid="tile-wardrobe-tops-leather-jacket"]');
  click('[aria-label="Search choices"]');
  click('[aria-label="Main categories"] button:nth-child(2)');
  click('[data-testid="field-tile-wardrobe-tops"]');
  expect(container.querySelector('[data-testid="tile-wardrobe-tops-leather-jacket"]').getAttribute('aria-pressed')).toBe('true');
});

test('selected dock removes choices while respecting locks, and Escape closes it', () => {
  act(() => root.render(<Harness fieldLocks={{face:{eyes:true}}} />));
  click('footer button:first-child');
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Remove Eyes: blue"]').disabled).toBe(true);
  click('[aria-label="Remove Expression: smile"]');
  expect(container.querySelector('[aria-label="Remove Expression: smile"]')).toBeNull();
  act(() => document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('locked category blocks edits and clear all retains locked choices', () => {
  act(() => root.render(<Harness locks={{face:true}} />));
  expect(container.querySelector('[data-testid="tile-face-expression-smirk"]').disabled).toBe(true);
  click('footer button:first-child');
  expect(container.querySelector('[aria-label="Remove Expression: smile"]').disabled).toBe(true);
  const result=clearUnlockedChoices(sections,{face:{expression:'smile'},wardrobe:{tops:['leather jacket']}},{face:true});
  expect(result.face.expression).toBe('smile');expect(result.wardrobe.tops).toEqual([]);
});


test('size presets and sliders stay together without duplicate subcategories', () => {
  const section={key:'physique',fields:[{key:'bust',label:'Bust'},{key:'bust_scale',label:'Size'},{key:'implant_volume',label:'Implants'},{key:'height',label:'Height'}]};
  const groups=fieldGroups(section);
  expect(groups.map(group=>group.key)).toEqual(['bust','height']);
  expect(groups[0].fields.map(field=>field.key)).toEqual(['bust','bust_scale','implant_volume']);
});

test('single-choice legacy arrays show only the active value in the dock', () => {
  const selected=selectedOptions(sections,{face:{expression:['smile','smirk']}});
  expect(selected.map(item=>item.value)).toEqual(['smirk']);
});


test('category tile index exposes scenario and custom categories in organized groups', () => {
  const catalog=[...sections,{key:'scenario',title:'Scenario',fields:[{key:'cast_size',label:'People',type:'chips',options:['solo','duo']}]},{key:'custom_outfits',title:'My outfits',fields:[{key:'coat',label:'Coat',type:'chips',options:['raincoat']}]}];
  const onSection=jest.fn();const onTwoPeople=jest.fn();
  act(()=>root.render(<MobilePromptDashboard sections={catalog} dna={{}} sectionKey="face" onSection={onSection} onChange={()=>{}} onToggleFieldLock={()=>{}} onTwoPeople={onTwoPeople} />));
  act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent.trim()==='All categories').click());
  expect(container.querySelector('[data-testid="category-tile-scenario"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="category-tile-custom_outfits"]')).not.toBeNull();
  click('[data-testid="category-tile-scenario"]');expect(onSection).toHaveBeenCalledWith('scenario');
  act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent.includes('2 people')).click());
  expect(onTwoPeople).toHaveBeenCalledTimes(1);
});


test('all catalog controls are reachable through subcategory tiles', () => {
  for (const section of SECTIONS) {
    expect(new Set(fieldGroups(section).flatMap(group=>group.fields.map(field=>field.key)))).toEqual(new Set(section.fields.map(field=>field.key)));
  }
});

test('scenario person tiles switch the edited subject and pose tiles apply a shared composition', () => {
  const people=[{id:'a',label:'A'},{id:'b',label:'B'}];
  const catalog=[...sections,{key:'scenario',title:'Scenario',fields:[{key:'cast_size',label:'Cast size',type:'chips',options:['solo','duo']}]},{key:'pose',title:'Pose',fields:[{key:'action',label:'Action',type:'chips',options:['standing']}]}];
  const onSubject=jest.fn(), onSharedPose=jest.fn();
  const props={sections:catalog,dna:{},subjects:people,activeSubjectId:'a',onSubject,onSharedPose,onSection:()=>{},onChange:()=>{},onToggleFieldLock:()=>{}};
  act(()=>root.render(<MobilePromptDashboard {...props} sectionKey="scenario" />));
  act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent.includes('All scenario controls')).click());
  act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent.includes('Edit Subject B')).click());
  expect(onSubject).toHaveBeenCalledWith('b');
  act(()=>root.render(<MobilePromptDashboard {...props} sectionKey="pose" />));
  act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='side by side').click());
  expect(onSharedPose).toHaveBeenCalledWith('side by side');
});
