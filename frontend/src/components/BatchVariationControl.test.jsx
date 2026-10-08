import { act } from "react";
import { createRoot } from "react-dom/client";
import BatchVariationControl from "./BatchVariationControl";

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
