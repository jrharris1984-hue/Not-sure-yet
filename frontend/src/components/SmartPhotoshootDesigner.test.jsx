import { act } from "react";
import { createRoot } from "react-dom/client";
import SmartPhotoshootDesigner from "./SmartPhotoshootDesigner";

test("mobile photoshoot designer exposes full-screen editing controls", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => root.render(
    <SmartPhotoshootDesigner
      open
      onClose={jest.fn()}
      sourcePreset="__blank__"
      customPresets={[]}
      onSave={jest.fn()}
      onDelete={jest.fn()}
    />
  ));

  const dialog = container.querySelector('[role="dialog"]');
  expect(dialog).toBeTruthy();
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(container.textContent).toContain("Create photoshoot preset");
  expect(container.textContent).toContain("+ Add shot");
  expect(container.textContent).toContain("Save custom preset");

  const inputs = container.querySelectorAll("input, select, textarea");
  expect(inputs.length).toBeGreaterThanOrEqual(7);

  act(() => root.unmount());
  container.remove();
});


test('bulk changes affect selected shots only and preserve captured choices until their family changes', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const sequence = Array.from({ length: 3 }, (_, index) => ({ title: `Shot ${index + 1}`, pose_group: '', camera_match: '', framing: 'full body', expression: 'neutral', pose_prompt: 'standing', pose_label: 'Standing', camera_pose_angle: 'profile', camera_angle: 'low' }));
  const customPresets = [{ key: 'custom_test', label: 'Test shoot', sequence }];
  const onSave = jest.fn().mockResolvedValue();
  const click = text => [...container.querySelectorAll('button')].find(button => button.textContent === text).click();
  act(() => root.render(<SmartPhotoshootDesigner open sourcePreset="custom_test" customPresets={customPresets} onSave={onSave} onClose={jest.fn()} />));
  act(() => { container.querySelector('[aria-label="Select shot 1"]').click(); container.querySelector('[aria-label="Select shot 3"]').click(); });
  act(() => { const control = container.querySelector('[aria-label="Bulk Framing"]'); control.value = 'waist-up'; control.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Apply to 2 shots'));
  await act(async () => click('Save changes'));
  let result = onSave.mock.calls[0][0].sequence;
  expect(result.map(shot => shot.framing)).toEqual(['waist-up', 'full body', 'waist-up']);
  expect(result[0].pose_prompt).toBe('standing'); expect(result[0].camera_angle).toBe('low');
  act(() => { const control = container.querySelector('[aria-label="Bulk Pose family"]'); control.value = 'portrait seated|seated'; control.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Apply to 2 shots'));
  await act(async () => click('Save changes'));
  result = onSave.mock.calls[1][0].sequence;
  expect(result[0].pose_prompt).toBeUndefined(); expect(result[2].pose_prompt).toBeUndefined();
  expect(result[1].pose_prompt).toBe('standing'); expect(result[0].camera_angle).toBe('low');
  expect(sequence[0].framing).toBe('full body');
  act(() => root.unmount());
});

test('failed save keeps the edit dialog open and shows a retryable error', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const onClose = jest.fn(); const presets = [];
  act(() => root.render(<SmartPhotoshootDesigner open sourcePreset="__blank__" customPresets={presets} onSave={jest.fn().mockRejectedValue(new Error('offline'))} onClose={onClose} />));
  await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Save custom preset').click());
  expect(onClose).not.toHaveBeenCalled(); expect(container.querySelector('[role="alert"]').textContent).toContain('Could not save');
  act(() => root.unmount());
});


test('bulk exact pose editing saves several prompts together and keeps unselected shots', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); const root = createRoot(container);
  const customPresets = [{ key: 'custom_bulk', label: 'Bulk shoot', sequence: [1, 2, 3].map(i => ({ title: `Shot ${i}`, framing: 'full body', pose_group: '', camera_match: '', expression: '' })) }];
  const onSave = jest.fn().mockResolvedValue();
  act(() => root.render(<SmartPhotoshootDesigner open sourcePreset="custom_bulk" customPresets={customPresets} onSave={onSave} />));
  act(() => { container.querySelector('[aria-label="Select shot 1"]').click(); container.querySelector('[aria-label="Select shot 2"]').click(); });
  act(() => container.querySelector('[data-testid="photoshoot-bulk-editor"] input[type="checkbox"]').click());
  act(() => {
    const input = container.querySelector('[aria-label="Bulk exact pose prompt"]');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'seated, hands resting in lap');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => [...container.querySelectorAll('button')].find(b => b.textContent === 'Apply to 2 shots').click());
  // A refreshed settings object must not erase the unsaved multi-shot edits.
  act(() => root.render(<SmartPhotoshootDesigner open sourcePreset="custom_bulk" customPresets={[...customPresets]} onSave={onSave} />));
  await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Save changes').click());
  const sequence = onSave.mock.calls[0][0].sequence;
  expect(sequence[0].pose_prompt).toBe('seated, hands resting in lap');
  expect(sequence[1].pose_prompt).toBe('seated, hands resting in lap');
  expect(sequence[2].pose_prompt).toBeUndefined();
  act(() => root.unmount());
});
