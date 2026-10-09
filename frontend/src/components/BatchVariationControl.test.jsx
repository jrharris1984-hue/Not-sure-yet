import { act } from "react";
import { createRoot } from "react-dom/client";
import BatchVariationControl from "./BatchVariationControl";

jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });

jest.mock('@/lib/media', () => ({ mediaUrl: url => url }));

const props = {
  value: "smart",
  onChange: jest.fn(),
  smartOptions: { pose: true, camera: true, framing: true, expression: false },
  onSmartOptionsChange: jest.fn(),
  smartPreset: "editorial",
  onSmartPresetChange: jest.fn(),
  smartPlan: [
    { title: "Hero", framing: "full body", pose: { label: "Standing quarter turn" }, camera: { label: "3/4 · eye-level" } },
    { title: "Portrait", framing: "waist-up", pose: { label: "Relaxed lean" }, camera: { label: "front · eye-level" } },
  ],
  onRegeneratePlan: jest.fn(),
  smartStrength: "balanced",
  onSmartStrengthChange: jest.fn(),
  customPresets: [],
  onSavePreset: jest.fn(),
  onDeletePreset: jest.fn(),
};

test('selection summary reacts to controls, direct generate uses shared dispatch, and pending shoots cannot be repeated', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const onGenerate = jest.fn();
  act(() => root.render(<BatchVariationControl {...props} onGenerate={onGenerate} />));
  expect(container.querySelector('[data-testid="smart-shoot-ready"]').textContent).toContain('Selected: Editorial · 2 images · balanced');
  const generate = () => [...container.querySelectorAll('button')].find(button => button.textContent.includes('Generate photoshoot'));
  act(() => generate().click()); expect(onGenerate).toHaveBeenCalledTimes(1);
  act(() => root.render(<BatchVariationControl {...props} onGenerate={onGenerate} smartOptions={{ expression: true }} smartStrength="subtle" />));
  expect(container.querySelector('[data-testid="smart-shoot-ready"]').textContent).toContain('Vary: Expression');
  expect(container.querySelector('[data-testid="smart-shoot-ready"]').textContent).toContain('subtle');
  act(() => root.render(<BatchVariationControl {...props} onGenerate={onGenerate} generateBlockedReason="Choose a workflow." />));
  expect(generate().disabled).toBe(true); expect(container.textContent).toContain('Choose a workflow.');
  const shootRun = { label: 'Earlier shoot', shots: [{ title: 'Original submitted shot' }], requests: [{ id: 'r', status: 'queued' }], queuing: false };
  act(() => root.render(<BatchVariationControl {...props} onGenerate={onGenerate} shootRun={shootRun} />));
  expect(container.textContent).toContain('Original submitted shot');
  const pending = [...container.querySelectorAll('button')].find(button => button.textContent === 'Photoshoot in progress…');
  expect(pending.disabled).toBe(true);
  act(() => root.unmount());
});

test("mobile Smart Photoshoot keeps primary controls and planned shots accessible", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<BatchVariationControl {...props} />));

  expect(container.querySelector('[aria-label="Batch variety"]')).toBeTruthy();
  expect(container.querySelector('[aria-label="Smart photoshoot style"]')).toBeTruthy();
  expect(container.querySelector('[aria-label="Smart photoshoot variation strength"]')).toBeTruthy();
  expect(container.textContent).toContain("Customize");
  expect(container.textContent).toContain("New plan");
  expect(container.textContent).toContain("Hero");
  expect(container.textContent).toContain("Portrait");

  const toggle = container.querySelector('[aria-expanded="true"]');
  expect(toggle).toBeTruthy();
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("false");

  act(() => root.unmount());
});


test("shot controls call the shared planner and kept shots cannot be redone", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  const onToggleKeepShot = jest.fn();
  const onRegenerateShot = jest.fn();
  const nextProps = { ...props, onToggleKeepShot, onRegenerateShot };
  act(() => root.render(<BatchVariationControl {...nextProps} />));
  act(() => container.querySelector('[aria-label="Keep shot 1"]').click());
  expect(onToggleKeepShot).toHaveBeenCalledWith(0);
  act(() => container.querySelector('[aria-label="Redo shot 2"]').click());
  expect(onRegenerateShot).toHaveBeenCalledWith(1);
  act(() => root.render(<BatchVariationControl {...nextProps} smartPlan={[{ ...props.smartPlan[0], kept: true }]} />));
  expect(container.querySelector('[aria-label="Release shot 1"]').getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector('[aria-label="Redo shot 1"]').disabled).toBe(true);
  act(() => root.unmount());
});


test('save current plan opens an editable snapshot and saves the actual choices', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const onSavePreset = jest.fn().mockResolvedValue();
  const smartPlan = [{ title: 'Hero', framing: 'full body', expression: 'smile',
    pose: { value: 'standing with arms folded', label: 'Folded arms' },
    camera: { poseAngle: 'profile', cameraAngle: 'low', label: 'profile · low' } }];
  act(() => root.render(<BatchVariationControl {...props} smartPlan={smartPlan} onSavePreset={onSavePreset} />));
  expect(container.querySelector('a').getAttribute('href')).toBe('/#smart-photoshoot-library');
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Save plan to Library').click());
  expect(container.querySelector('[aria-label="Exact pose prompt for shot 1"]').value).toBe('standing with arms folded');
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Save custom preset').click());
  expect(onSavePreset.mock.calls[0][0].sequence[0]).toMatchObject({ pose_prompt: 'standing with arms folded', camera_pose_angle: 'profile', camera_angle: 'low', framing: 'full body' });
  act(() => root.unmount());
});

test('restoring a built-in style keeps that style selected in the director', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const onSmartPresetChange = jest.fn();
  const customPresets = [{ key: 'boudoir', label: 'Edited boudoir', category: 'Glamour', sequence: [{ title: 'Hero', framing: 'full body' }] }];
  act(() => root.render(<BatchVariationControl {...props} smartPreset="boudoir" customPresets={customPresets} onSmartPresetChange={onSmartPresetChange} />));
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent === 'Edit').click());
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Restore built-in style').click());
  expect(onSmartPresetChange).toHaveBeenCalledWith('boudoir');
  act(() => root.unmount());
});
