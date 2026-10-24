import { act } from 'react';
import { createRoot } from 'react-dom/client';
import DnaSection from './DnaSection';
import { SECTIONS } from '@/lib/dna';

const legacyWardrobe = () => {const section=SECTIONS.find(s=>s.key==='wardrobe');return {...section,fields:section.fields.map(field=>field.key==='exposure_mode'?{...field,options:[...field.options,'use selected outfit','open or shifted outfit','lingerie only','lingerie showing']}:field)};};
const originalResizeObserver = global.ResizeObserver;
test('source remains visible in a filtered tab and detail selections survive source changes',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container);
  const section={key:'watersports',title:'Controls',fields:[{key:'direction',label:'Detail',type:'chips_multi',options:['custom_detail']}]};
  let value={source:'none',direction:[]};
  const paint=()=>root.render(<DnaSection section={section} value={value} onChange={next=>{value=next;paint();}}/>);
  try{
    act(paint);act(()=>container.querySelector('[data-testid="chip-watersports-direction-custom_detail"]').click());
    expect(value.direction).toEqual(['custom_detail']);
    expect(container.querySelector('[data-testid="watersports-source-status"]').textContent).toContain('Source is Off');
    act(()=>container.querySelector('[data-testid="chip-watersports-source-self"]').click());
    expect(value).toEqual({source:'self',direction:['custom_detail']});
    expect(container.querySelector('[data-testid="chip-watersports-direction-custom_detail"]').getAttribute('aria-pressed')).toBe('true');
    act(()=>container.querySelector('[data-testid="chip-watersports-source-none"]').click());
    expect(value.direction).toEqual(['custom_detail']);
  }finally{act(()=>root.unmount());}
});
test('wardrobe groups keep all controls available and switch the visible panel',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container);
  const section=SECTIONS.find(s=>s.key==='wardrobe');
  try {
    act(()=>root.render(<DnaSection section={section} simpleMode simpleFieldKeys={['top']} value={{outfit_mode:'custom'}} onChange={()=>{}}/>));
    const navigation=container.querySelector('[aria-label="Wardrobe control groups"]');
    expect(navigation.querySelectorAll('button')).toHaveLength(7);
    const footwear=container.querySelector('[data-testid="chip-wardrobe-footwear-barefoot"]').closest('[style]');
    expect(footwear.style.display).toBe('none');
    act(()=>[...navigation.querySelectorAll('button')].find(b=>b.textContent==='Shoes & heels').click());
    expect(footwear.style.display).toBe('');
    expect(container.querySelector('[data-testid="chip-wardrobe-top-corset"]')).not.toBeNull();
  }finally{act(()=>root.unmount());}
});
beforeAll(() => { global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; });
afterAll(() => { global.ResizeObserver = originalResizeObserver; });

test('feet role explains crop ownership, preserves other edits, and shows each conflict once', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const section = SECTIONS.find(s => s.key === 'feet');
  const onChange = jest.fn();
  const value = { pedicure: 'painted red', composition_mode: 'supporting detail' };
  const note = 'Pose controls the crop.';
  try {
    act(() => root.render(<DnaSection section={{ ...section, fields: section.fields.filter(f => f.key === 'composition_mode') }} value={value} onChange={onChange} controlNotes={[note, note]} />));
    expect(container.textContent).toContain('Supporting detail keeps the crop and pose selected in Pose');
    expect(container.querySelectorAll('[data-testid="builder-control-notes"] p')).toHaveLength(1);
    act(() => container.querySelector('[data-testid="chip-feet-composition_mode-feet-focus"]').click());
    expect(onChange).toHaveBeenCalledWith({ pedicure: 'painted red', composition_mode: 'feet focus' });
    expect(value.composition_mode).toBe('supporting detail');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

test.each([['bust', 'bust_scale'], ['butt', 'butt_scale'], ['hips', 'hip_scale'], ['thighs', 'thigh_scale'], ['waist', 'waist_scale']])('%s offers only the chosen preset or size slider', (preset, slider) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  const section = SECTIONS.find(s => s.key === 'physique');
  let value = { [preset]: 'small', [slider]: 75 };
  const paint = () => root.render(<DnaSection section={{ ...section, fields: section.fields.filter(f => [preset, slider].includes(f.key)) }} value={value}
    onChange={next => { value = next; paint(); }} />);
  try {
    act(paint);
    expect(container.querySelector(`[data-testid="slider-physique-${slider}"]`)).not.toBeNull();
    expect(container.querySelector(`[data-testid^="chip-physique-${preset}-"]`)).toBeNull();
    act(() => container.querySelector(`[data-testid="size-mode-${preset}-preset"]`).click());
    expect(value[slider]).toBe(0);
    expect(container.querySelector(`[data-testid="slider-physique-${slider}"]`)).toBeNull();
    expect(container.querySelector(`[data-testid^="chip-physique-${preset}-"]`)).not.toBeNull();
    act(() => container.querySelector(`[data-testid="size-mode-${preset}-slider"]`).click());
    expect(value[slider]).toBeGreaterThan(0);
    expect(container.querySelector(`[data-testid^="chip-physique-${preset}-"]`)).toBeNull();
  } finally { act(() => root.unmount()); container.remove(); }
});

test('named exposure displays legacy state, removes the slider and clears old overrides on selection', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const section = legacyWardrobe();
  const value = { nudity_level: 100, nudity_outfit: 'keep lingerie', outfit_preset: 'playboy bunny' };
  const onChange = jest.fn();
  try {
    act(() => root.render(<DnaSection section={{ ...section, fields: section.fields.filter(f => f.key === 'exposure_mode') }} value={value} onChange={onChange} />));
    expect(container.querySelector('[data-testid="slider-wardrobe-nudity_level"]')).toBeNull();
    expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-open-or-shifted-outfit"]').getAttribute('aria-pressed')).toBe('true');
    act(() => container.querySelector('[data-testid="chip-wardrobe-exposure_mode-use-selected-outfit"]').click());
    expect(onChange).toHaveBeenCalledWith({ ...value, exposure_mode: 'use selected outfit', nudity_level: 0, nudity_outfit: '' });
    expect(value.nudity_level).toBe(100);
  } finally { act(() => root.unmount()); }
});


test('sheet field focus keeps the complete size-control family and excludes unrelated fields', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  const section = SECTIONS.find(s => s.key === 'physique');
  try {
    act(() => root.render(<DnaSection section={section} focusedField="bust_scale" value={{ bust_scale: 75 }} onChange={jest.fn()} />));
    expect(container.querySelector('[data-testid="size-mode-bust"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slider-physique-bust_scale"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="size-mode-waist"]')).toBeNull();
  } finally { act(() => root.unmount()); container.remove(); }
});

test('full-set mode disables separate garments and Custom reactivates saved choices', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  const section = SECTIONS.find(s => s.key === 'wardrobe');
  let value = { outfit_mode: 'full', outfit_set: 'matching satin set', top: 'corset' };
  const paint = () => root.render(<DnaSection section={{ ...section, fields: section.fields.filter(f => ['outfit_mode', 'top', 'outfit_set_color'].includes(f.key)) }} value={value} onChange={next => { value = next; paint(); }} />);
  try {
    act(paint);
    expect(container.querySelector('[data-testid="chip-wardrobe-top-corset"]').closest('fieldset').disabled).toBe(true);
    act(() => container.querySelector('[data-testid="wardrobe-mode-custom"]').click());
    expect(container.querySelector('[data-testid="chip-wardrobe-top-corset"]').closest('fieldset').disabled).toBe(false);
    expect(value.top).toBe('corset'); expect(value.outfit_mode).toBe('custom');
    act(() => container.querySelector('[data-testid="chip-wardrobe-top-tube-top"]').click());
    expect(value.top).toBe('tube top');
    expect(container.querySelector('[data-testid="chip-wardrobe-outfit_set_color-tab-Classic"]').closest('fieldset').disabled).toBe(true);
  } finally { act(() => root.unmount()); container.remove(); }
});

test('full set lingerie is optional and unavailable coverage choices disappear', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container=document.createElement('div');document.body.appendChild(container);
  const root=createRoot(container);
  const section=legacyWardrobe();
  let value={outfit_mode:'full',outfit_set:'tailored pantsuit',set_lingerie_mode:'matching',set_lingerie:'saved layer',exposure_mode:'lingerie showing'};
  const paint=()=>root.render(<DnaSection section={{...section,fields:section.fields.filter(f=>['set_lingerie_mode','set_lingerie','exposure_mode'].includes(f.key))}} value={value} onChange={next=>{value=next;paint();}}/>);
  try {
    act(paint);
    // Long lists are paged; expand before checking catalog availability.
    act(() => container.querySelectorAll('button').forEach(button => { if (button.textContent.startsWith('Show more choices')) button.click(); }));
    expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-lingerie-only"]')).not.toBeNull();
    act(()=>container.querySelector('[data-testid="chip-wardrobe-set_lingerie_mode-none"]').click());
    expect(value.exposure_mode).toBe('use selected outfit');
    expect(value.set_lingerie).toBe('saved layer');
    expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-lingerie-only"]')).toBeNull();
    expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-lingerie-showing"]')).toBeNull();
    expect(container.textContent).toContain('Choose Include lingerie');
    act(()=>container.querySelector('[data-testid="chip-wardrobe-set_lingerie_mode-matching"]').click());
    // Long lists are paged; expand before checking catalog availability.
    act(() => container.querySelectorAll('button').forEach(button => { if (button.textContent.startsWith('Show more choices')) button.click(); }));
    expect(container.querySelector('[data-testid="chip-wardrobe-exposure_mode-lingerie-only"]')).not.toBeNull();
  } finally {act(()=>root.unmount());container.remove();}
});

test('intimate details keep older saved presets accessible without duplicate default controls', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'), root = createRoot(container);
  const section = SECTIONS.find(item => item.key === 'intimate');
  const saved = { nipples: 'small', areolas: 'medium pink', nipple_size: 'large nipple tips' };
  const change = jest.fn();
  try {
    act(() => root.render(<DnaSection section={section} value={saved} onChange={change} simpleMode simpleFieldKeys={["nipple_size", "areola_color"]} />));
    expect(container.querySelector('[data-testid="chip-intimate-nipples-small"]')).toBeNull();
    expect(container.textContent).toContain('saved choices active');
    act(() => container.querySelector('[data-testid="toggle-legacy-anatomy"]').click());
    expect(container.querySelector('[data-testid="chip-intimate-nipples-small"]').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-testid="chip-intimate-nipples-small"]').closest('.hidden')).toBeNull();
    expect(change).not.toHaveBeenCalled();
    expect(saved.nipples).toBe('small');
  } finally { act(() => root.unmount()); }
});

test('reset is labeled in Simple mode and disabled for a locked section', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'), root = createRoot(container), onReset = jest.fn();
  const section = { key: 'hair', title: 'Hair', fields: [] };
  try {
    act(() => root.render(<DnaSection section={section} simpleMode onReset={onReset} />));
    const reset = container.querySelector('[aria-label="Reset hair section"]');
    expect(reset.textContent).toContain('Reset');
    expect(reset.className).not.toContain('hidden');
    act(() => reset.click()); expect(onReset).toHaveBeenCalledTimes(1);
    act(() => root.render(<DnaSection section={section} simpleMode onReset={onReset} locked />));
    expect(container.querySelector('[aria-label="Reset hair section"]').disabled).toBe(true);
    act(() => container.querySelector('[aria-label="Reset hair section"]').click());
    expect(onReset).toHaveBeenCalledTimes(1);
  } finally { act(() => root.unmount()); }
});
