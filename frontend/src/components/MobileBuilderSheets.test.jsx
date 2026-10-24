import fs from 'fs';
import path from 'path';
import CharacterHistoryControls from './CharacterHistoryControls';
import PinnedSectionControls from './PinnedSectionControls';
import ReviewEditBanner from './ReviewEditBanner';
import CreateRenderOutcome from './CreateRenderOutcome';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MobileBuilderSheets from './MobileBuilderSheets';

let root, container;
beforeEach(() => { jest.useFakeTimers(); global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
const sections = [{ key: 'hair', title: 'Hair', fields: [{ key: 'color', label: 'Color' }] }, { key: 'scenario', title: 'Scenario', fields: [] }];
const defaults = { sections, section: sections[0], subjects: [{ id: 'a', label: 'A' }], activeId: 'a', values: { color: 'black' },
  renderControls: field => <button type="button">Edit {field}</button>, outputControls: <div>Workflow settings</div>, imageCount: 2, canGenerate: true };
const paint = props => act(() => root.render(<MobileBuilderSheets {...defaults} {...props} />));
const click = text => act(() => Array.from(container.querySelectorAll('button')).find(button => button.textContent === text).click());
test('two-person poses are reachable in a nested panel and disappear for one person', () => {
  const section={key:'pose',title:'Pose & framing',fields:[]};
  paint({section,subjects:[{id:'a',label:'A'},{id:'b',label:'B'}],castPoseControls:<button>Back to back</button>});
  click('Poses for 2 peopleShared poses & composition');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Back to back');
  paint({section,subjects:[{id:'a',label:'A'}],castPoseControls:null});
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).not.toContain('Shared poses & composition');
});
test('opens a scoped detail sheet and returns to the unchanged category selection', () => {
  paint(); click('Colorblack');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Edit color');
  expect(container.querySelector('.sheet-scoped-scrim').parentElement).toBe(container.querySelector('[data-testid="primary-creation-sheet"]'));
  expect(container.querySelector('.sheet-primary-content').getAttribute('aria-hidden')).toBe('true');
  click('Done');
  act(() => jest.advanceTimersByTime(320));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).toContain('Colorblack');
});
test('exposes scenario, people, subject switching and generation without changing the cast', () => {
  const onSection = jest.fn(), onPeople = jest.fn(), onSubject = jest.fn(), onGenerate = jest.fn();
  paint({ onSection, onPeople, onSubject, onGenerate });
  click('Scenario'); click('People · 1'); click('Edit A'); click('Generate (2)');
  expect(onSection).toHaveBeenCalledWith('scenario'); expect(onPeople).toHaveBeenCalledTimes(1);
  expect(onSubject).toHaveBeenCalledWith('a'); expect(onGenerate).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('1 person');
});
test('generation settings, Escape dismissal, and More tools remain reachable', () => {
  const onTools = jest.fn(); paint({ onTools }); click('Generation');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Workflow settings');
  act(() => container.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  act(() => jest.advanceTimersByTime(320));
  expect(container.querySelector('[role="dialog"]')).toBeNull(); click('More tools'); expect(onTools).toHaveBeenCalledTimes(1);
});
test('category changes close stale detail controls and generation respects readiness', () => {
  paint(); click('Colorblack'); paint({ section: sections[1], canGenerate: false });
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Generate (2)').disabled).toBe(true);
});

function pointer(target, type, y, time) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, { pointerId: { value: 1 }, clientY: { value: y }, timeStamp: { value: time }, button: { value: 0 } });
  act(() => target.dispatchEvent(event));
}
test('primary sheet follows the finger before release and settles to an expanded stop', () => {
  paint(); const sheet = container.querySelector('[data-testid="primary-creation-sheet"]');
  sheet.getBoundingClientRect = () => ({ height: 400 });
  sheet.parentElement.getBoundingClientRect = () => ({ height: 800 });
  const handle = sheet.querySelector('.sheet-handle');
  pointer(handle, 'pointerdown', 400, 0); pointer(handle, 'pointermove', 240, 100);
  expect(sheet.style.height).toBe('560px'); expect(sheet.style.transition).toBe('none');
  pointer(handle, 'pointerup', 240, 200);
  expect(sheet.className).toContain('sheet-expanded'); expect(sheet.style.height).toBe('');
});
test('detail drag tracks movement, returns on cancellation, and animates dismissal', () => {
  paint(); click('Colorblack'); let sheet = container.querySelector('[role="dialog"]');
  let handle = sheet.querySelector('.sheet-handle');
  pointer(handle, 'pointerdown', 200, 0); pointer(handle, 'pointermove', 260, 100);
  expect(sheet.style.transform).toContain('60px');
  pointer(handle, 'pointercancel', 260, 200);
  expect(sheet.style.transform).toContain('0px');
  pointer(handle, 'pointerdown', 200, 300); pointer(handle, 'pointermove', 350, 500); pointer(handle, 'pointerup', 350, 600);
  expect(sheet.className).toContain('sheet-closing');
  act(() => jest.advanceTimersByTime(320)); expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('switching categories preserves the expanded sheet height', () => {
  const onSection = jest.fn(); paint({ onSection });
  const sheet = container.querySelector('[data-testid="primary-creation-sheet"]');
  expect(sheet.className).toContain('sheet-expanded');
  click('Scenario'); expect(onSection).toHaveBeenCalledWith('scenario');
  paint({ onSection, section: sections[1] });
  expect(sheet.className).toContain('sheet-expanded');
});

test('selected options review opens the selected category and person accents follow the active subject', () => {
  const onSection = jest.fn();
  paint({ onSection, subjects: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], activeId: 'b',
    selectedItems: [{ section: 'hair', field: 'color', category: 'Hair', label: 'Color', value: 'black' }] });
  expect(container.querySelector('[data-testid="mobile-sheet-builder"]').style.getPropertyValue('--person-accent')).toBe('#93c5fd');
  expect(container.querySelectorAll('.studio-person-badge')).toHaveLength(2);
  click('Selected · 1');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Hair · Color');
  act(() => container.querySelector('.studio-selected-option').click());
  expect(onSection).toHaveBeenCalledWith('hair');
});

test('Reset beside Save calls the full character reset action', () => {
  const onReset = jest.fn(); paint({ onReset }); click('Reset');
  expect(onReset).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="Reset character setup"]')).not.toBeNull();
});

test('Reset closes detailed options and returns to the expanded category sheet', () => {
  const onReset = jest.fn(); paint({ onReset }); click('Colorblack');
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  click('Reset');
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.querySelector('[data-testid="primary-creation-sheet"]').className).toContain('sheet-expanded');
  expect(onReset).toHaveBeenCalledTimes(1);
});

test('Scenario places character presets beside the person controls and other categories hide them', () => {
  const onPresets = jest.fn();
  const presetsControl = <button type="button" onClick={onPresets}>Character presets</button>;
  paint({ section: sections[1], presetsControl });
  const edit = [...container.querySelectorAll('button')].find(button => button.textContent === 'Edit A');
  const presets = [...container.querySelectorAll('button')].find(button => button.textContent === 'Character presets');
  expect(presets.parentElement).toBe(edit.parentElement);
  expect(edit.nextElementSibling).toBe(presets);
  click('Character presets'); expect(onPresets).toHaveBeenCalledTimes(1);
  paint({ section: sections[0], presetsControl });
  expect([...container.querySelectorAll('button')].some(button => button.textContent === 'Character presets')).toBe(false);
});


test('bust card shows the active preset, slider or implant value without duplicate zero cards', () => {
  const section = { key: 'physique', title: 'Physique', fields: [
    { key: 'bust', label: 'Bust size', optionLabels: { custom_bust: 'Full bust' } },
    { key: 'bust_scale', label: 'Bust size' },
    { key: 'implant_volume', label: 'Implant visual size' },
    { key: 'bust_shape', label: 'Bust shape' },
  ] };
  paint({ section, values: { bust: 'custom_bust', bust_scale: 0, implant_volume: 0 } });
  expect(container.querySelectorAll('.sheet-field-card')).toHaveLength(2);
  expect(container.textContent).toContain('Preset · Full bust');
  click('Bust sizePreset · Full bust');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Edit bust');
  paint({ section, values: { bust: 'small', bust_scale: 85, implant_volume: 0 } });
  expect(container.textContent).toContain('Size slider · 85');
  paint({ section, values: { bust: 'small', bust_scale: 85, implant_volume: 1500 } });
  expect(container.textContent).toContain('Implant size · 1500 cc');
  expect(container.querySelectorAll('.sheet-field-card')).toHaveLength(2);
});

test('workspace features stay inside the visible sheet under the actual mobile hiding rule', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');
  const rule = css.match(/\.nested-mobile-builder > :not\(\.mobile-sheet-builder\) \{[^}]+\}/)[0];
  const style = document.createElement('style'); style.textContent = rule; document.head.appendChild(style);
  container.className = 'nested-mobile-builder';
  const onUndo = jest.fn(), onSection = jest.fn();
  try {
    paint({ workspaceControls: ({close}) => <div>
      <CharacterHistoryControls canUndo onUndo={onUndo} />
      <PinnedSectionControls sections={sections} pinned={['hair']} currentSection="hair" onSection={key => { onSection(key); close(); }} />
    </div> });
    const hiddenSibling = document.createElement('div'); container.appendChild(hiddenSibling);
    expect(window.getComputedStyle(hiddenSibling).display).toBe('none');
    click('Quick tools');
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.closest('.mobile-sheet-builder')).not.toBeNull();
    let node = dialog;
    while (node && node !== container) { expect(window.getComputedStyle(node).display).not.toBe('none'); node = node.parentElement; }
    act(() => dialog.querySelector('[aria-label="Undo character edit"]').click());
    expect(onUndo).toHaveBeenCalledTimes(1);
    act(() => dialog.querySelector('[aria-label="Quick access sections"] button').click());
    expect(onSection).toHaveBeenCalledWith('hair');
    act(() => jest.advanceTimersByTime(320));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  } finally { style.remove(); container.className = ''; }
});

test('result actions are reachable and cleared results show an empty state', () => {
  const onNewSeed = jest.fn();
  paint({resultControls:<CreateRenderOutcome render={{id:'done',status:'done',output_files:['/result.png']}} onNewSeed={onNewSeed} />});
  click('Results & actions');
  const dialog = container.querySelector('[role="dialog"]');
  expect(dialog.closest('.mobile-sheet-builder')).not.toBeNull();
  click('Try a new seed'); expect(onNewSeed).toHaveBeenCalledTimes(1);
  paint({resultControls:null});
  expect(container.querySelector('[role="dialog"]').textContent).toContain('No results yet');
});

test('return to review opens generation settings in the actual sheet interface', () => {
  const onReturn = jest.fn();
  paint({reviewControls:({openOutput})=><ReviewEditBanner sectionTitle="Hair" onReturn={()=>{onReturn();openOutput();}} />});
  click('Return to review'); expect(onReturn).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Workflow settings');
});
test('Simple sheets show essential fields and preserve access to all options', () => {
  const section = { key:'hair',title:'Hair',fields:[{key:'color',label:'Color'},{key:'texture',label:'Texture'}] };
  const onMode = jest.fn();
  paint({section,mode:'simple',simpleFieldKeys:['color'],onMode});
  expect(container.textContent).toContain('Colorblack');
  expect(container.textContent).not.toContain('TextureChoose');
  click('Show all hair controls');
  expect(onMode).toHaveBeenCalledWith('advanced');
  paint({section,mode:'advanced',simpleFieldKeys:['color'],onMode});
  expect(container.textContent).toContain('TextureChoose');
});
test('category navigation advances and ends at generation settings', () => {
  const onSection = jest.fn(), onMode=jest.fn();
  paint({onSection,onMode,mode:'simple'});
  click('Next category'); expect(onSection).toHaveBeenCalledWith('scenario');
  paint({onSection,onMode,mode:'simple',section:sections[1]});
  click('Review & create');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Workflow settings');
});
test('guided Simple moves between stages and reviews before exposing generation', () => {
  const onSection=jest.fn(), onGenerate=jest.fn();
  const stages=[{id:'start',title:'People',sections:['hair'],simpleSections:['hair']},{id:'wardrobe',title:'Wardrobe',sections:['scenario'],simpleSections:['scenario']},{id:'create',title:'Create',sections:[]}];
  paint({mode:'simple',stages,onSection,onGenerate,canGenerate:false});
  expect(container.textContent).toContain('Step 1 of 3');
  expect([...container.querySelectorAll('button')].some(b=>b.textContent==='Generate (2)')).toBe(false);
  click('Continue');expect(onSection).toHaveBeenCalledWith('scenario');expect(onGenerate).not.toHaveBeenCalled();
  paint({mode:'simple',stages,onSection,onGenerate,section:sections[1],canGenerate:false});
  const action=container.querySelector('.sheet-generate-button');act(()=>action.click());
  expect(container.querySelector('[role="dialog"]').textContent).toContain('Workflow settings');
  expect(container.querySelector('.sheet-generate-button').textContent).toBe('Generate (2)');expect(container.querySelector('.sheet-generate-button').disabled).toBe(true);
  expect(onGenerate).not.toHaveBeenCalled();
});
test('guided first step exposes presets without requiring a category hunt', () => {
  const stages=[{id:'start',title:'People',sections:['hair'],simpleSections:['hair']},{id:'create',title:'Create',sections:[]}];
  paint({mode:'simple',stages,presetsControl:<button type="button">Choose a preset</button>});
  expect([...container.querySelectorAll('button')].some(button=>button.textContent==='Choose a preset')).toBe(true);
});

test('workspace navigation preserves editing selections and explains empty results', () => {
  paint();
  const nav = container.querySelector('[aria-label="Workspace views"]');
  const choose = name => act(() => [...nav.querySelectorAll('button')].find(button => button.textContent === name).click());
  choose('Preview');
  expect(container.querySelector('[data-testid="primary-creation-sheet"]').className).toContain('sheet-peek');
  choose('Results');
  expect(container.querySelector('[role="dialog"]').textContent).toContain('No results yet');
  choose('Edit');
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(container.textContent).toContain('Colorblack');
  expect(container.querySelector('[data-testid="primary-creation-sheet"]').className).toContain('sheet-expanded');
});
