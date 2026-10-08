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
