import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DesktopDnaEditor from './DesktopDnaEditor';
import DesktopEditingDock from './DesktopEditingDock';
import { SECTIONS } from '@/lib/dna';
import { desktopEditingGroups, desktopNavigationSections } from '@/lib/desktopEditingGroups';
let container, root;
const originalResizeObserver = global.ResizeObserver;
beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; });
afterAll(() => { global.ResizeObserver = originalResizeObserver; });
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = component => act(() => root.render(component));
const click = label => act(() => [...container.querySelectorAll('button')].find(button => button.textContent === label).click());
function Editor({ section = 'physique', enabled = true }) {
  const [value,setValue] = useState({ height:'tall',body_type:'athletic',waist:'slim',hair:'brown',outfit_mode:'full',outfit_set:'pantsuit',outfit_set_color:'ivory' });
  return <DesktopDnaEditor enabled={enabled} section={SECTIONS.find(item => item.key === section)} value={value} onChange={setValue} />;
}
test('desktop appearance opens one detail, keeps selected summaries, and retains choices across groups', () => {
  render(<Editor />);
  expect(container.querySelector('[data-testid="chip-physique-height-tall"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="chip-physique-body_type-athletic"]')).toBeNull();
  act(() => container.querySelector('[data-testid="chip-physique-height-short"]').click());
  act(() => container.querySelector('[data-testid="desktop-edit-body_type"]').click());
  expect(container.querySelector('[data-testid="chip-physique-height-tall"]')).toBeNull();
  expect(container.querySelector('[data-testid="chip-physique-body_type-athletic"]').getAttribute('aria-pressed')).toBe('true');
  click('Waist & hips'); click('Frame & build');
  expect(container.querySelector('[data-testid="desktop-edit-height"]').textContent).toContain('short');
  expect(container.querySelector('[data-testid="desktop-edit-body_type"]').textContent).toContain('athletic');
});
test('the desktop wrapper falls back to existing controls when disabled', () => {
  render(<Editor enabled={false} />);
  expect(container.querySelector('[data-testid="desktop-focused-editor"]')).toBeNull();
  expect(container.querySelector('[data-testid="chip-physique-height-tall"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="chip-physique-body_type-athletic"]')).not.toBeNull();
});
test('every appearance and wardrobe field, including custom library fields, remains in a group', () => {
  for (const key of ['physique','face','hair','skin','wardrobe']) {
    const source = SECTIONS.find(section => section.key === key);
    const section = { ...source, fields:[...source.fields,{key:'custom_added',label:'Extra',type:'text'}] };
    const grouped = desktopEditingGroups(section).flatMap(group => group.fields.map(field => field.key));
    expect(grouped.slice().sort()).toEqual(section.fields.map(field => field.key).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  }
});
test('wardrobe retains group navigation and outfit-mode availability messages', () => {
  render(<Editor section="wardrobe" />);
  expect(container.querySelector('[data-testid="desktop-edit-top"]').textContent).toContain('Controlled by outfit mode');
  click('Underneath layers');
  expect(container.querySelector('[data-testid="desktop-edit-underwear"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="desktop-edit-top"]')).toBeNull();
});
test('persistent desktop navigation moves between sections and finishes once', () => {
  const sections=[{key:'a',title:'Appearance'},{key:'w',title:'Wardrobe'}], onSection=jest.fn(), onFinish=jest.fn();
  render(<DesktopEditingDock sections={sections} activeSection="a" onSection={onSection} onFinish={onFinish} />);
  expect([...container.querySelectorAll('button')][0].disabled).toBe(true);
  click('Next: Wardrobe'); expect(onSection).toHaveBeenCalledWith('w');
  render(<DesktopEditingDock sections={sections} activeSection="w" onSection={onSection} onFinish={onFinish} />);
  click('Back: Appearance'); expect(onSection).toHaveBeenLastCalledWith('a');
  click('Review'); expect(onFinish).toHaveBeenCalledTimes(1);
});

test('simple desktop navigation skips optional details while allowing them to be opened', () => {
  const stages = [{ sections:['physique','feet','intimate','face'], simpleSections:['physique','face'] }];
  const sections = ['physique','feet','intimate','face'].map(key => ({key,title:key}));
  expect(desktopNavigationSections(stages,sections,'physique').map(section => section.key)).toEqual(['physique','face']);
  expect(desktopNavigationSections(stages,sections,'feet').map(section => section.key)).toEqual(['physique','feet','face']);
});
