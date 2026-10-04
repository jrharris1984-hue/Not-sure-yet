import { act } from 'react';
import { createRoot } from 'react-dom/client';
import DnaSection from './DnaSection';
import { SECTIONS } from '@/lib/dna';

const originalResizeObserver = global.ResizeObserver;
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
