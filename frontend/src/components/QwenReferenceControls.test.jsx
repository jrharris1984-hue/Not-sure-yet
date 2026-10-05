import { act } from 'react';
import { createRoot } from 'react-dom/client';
import QwenReferenceControls from './QwenReferenceControls';
import { QWEN_CAMERA_DEFAULTS, QWEN_CAMERA_OPTIONS, qwenReferenceInstruction, cameraWarnings } from '@/lib/qwenReferenceEdit';
let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = props => act(() => root.render(<QwenReferenceControls camera={QWEN_CAMERA_DEFAULTS} notes="" {...props} />));
test('pose uploads the second reference independently and offers replacement', () => {
  const onUpload = jest.fn(), onRemove = jest.fn();
  render({ variant:'pose', onUpload });
  const file = new File(['pose'],'pose.png',{ type:'image/png' });
  const input = container.querySelector('input'); Object.defineProperty(input,'files',{ value:[file] });
  act(() => input.dispatchEvent(new Event('change',{ bubbles:true })));
  expect(onUpload).toHaveBeenCalledWith(file);
  render({ variant:'pose', poseSource:{ name:'pose.png' }, onRemove });
  act(() => container.querySelector('button').click()); expect(onRemove).toHaveBeenCalledTimes(1);
});
test('camera selection emits trained descriptors and keeps optional notes separate', () => {
  const onCamera=jest.fn(); render({ variant:'camera', onCamera });
  const select=container.querySelector('[aria-label="azimuth"]');
  act(() => { select.value='right side view'; select.dispatchEvent(new Event('change',{ bubbles:true })); });
  expect(onCamera).toHaveBeenCalledWith({ ...QWEN_CAMERA_DEFAULTS, azimuth:'right side view' });
  expect(container.querySelector('input[type=file]')).toBeNull();
  expect(container.querySelector('textarea').maxLength).toBe(1000);
});
test('all 96 camera choices generate the documented trigger order and preserve appearance', () => {
  for (const azimuth of QWEN_CAMERA_OPTIONS.azimuth) for (const elevation of QWEN_CAMERA_OPTIONS.elevation) for (const distance of QWEN_CAMERA_OPTIONS.distance) {
    const prompt=qwenReferenceInstruction('camera','',{ azimuth,elevation,distance });
    expect(prompt).toMatch(new RegExp(`^<sks> ${azimuth} ${elevation} ${distance}`));
    expect(prompt).toContain('Keep the original body pose');
    expect(prompt).toContain('exact clothing');
  }
});
test('presets expose distinct reconstruction settings without changing the chosen view', () => {
  const onCamera=jest.fn(), camera={...QWEN_CAMERA_DEFAULTS,azimuth:'right side view'};
  render({variant:'camera',camera,onCamera});
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent==='Full viewpoint change').click());
  expect(onCamera).toHaveBeenLastCalledWith({...camera,distance:'medium shot',denoise:1,loraStrength:0.9});
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent==='Subtle camera change').click());
  expect(onCamera).toHaveBeenLastCalledWith({...camera,distance:'close-up',denoise:0.75,loraStrength:0.9});
});
test('source framing check is advisory and warns about inventing missing areas', () => {
  const camera={...QWEN_CAMERA_DEFAULTS,sourceFraming:'close-up',distance:'wide shot',denoise:1};
  expect(cameraWarnings(camera)).toHaveLength(2);
  render({variant:'camera',camera});
  expect(container.querySelector('[aria-label="Camera render checks"]').textContent).toContain('inventing unseen areas');
  expect(container.querySelector('[aria-label="distance"]').disabled).toBe(false);
  expect(cameraWarnings(QWEN_CAMERA_DEFAULTS)).toEqual([]);
});
test('camera guidance and reconstruction sliders emit separate values', () => {
  const onCamera=jest.fn(); render({variant:'camera',onCamera});
  const slider=container.querySelector('[aria-label="Camera reconstruction amount"]');
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(slider,'0.6'); slider.dispatchEvent(new Event('input',{bubbles:true})); });
  expect(onCamera).toHaveBeenLastCalledWith({...QWEN_CAMERA_DEFAULTS,denoise:0.6});
  const lora=container.querySelector('[aria-label="Camera LoRA strength"]');
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(lora,'0.85'); lora.dispatchEvent(new Event('input',{bubbles:true})); });
  expect(onCamera).toHaveBeenLastCalledWith({...QWEN_CAMERA_DEFAULTS,loraStrength:0.85});
});
