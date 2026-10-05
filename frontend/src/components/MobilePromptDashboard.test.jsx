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
  click('[data-testid="tile-wardrobe-tops-leather-jacket"]');
  click('[data-testid="tile-wardrobe-tops-cotton-shirt"]');
  expect(container.querySelectorAll('[aria-pressed="true"][data-testid^="tile-wardrobe"]')).toHaveLength(2);
  click('[aria-label="Main categories"] button:first-child');
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
