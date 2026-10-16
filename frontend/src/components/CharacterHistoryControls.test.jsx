import { act } from "react";
import { createRoot } from "react-dom/client";
import CharacterHistoryControls from "./CharacterHistoryControls";

test("history buttons forward actions and disable while rendering", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container), onUndo = jest.fn(), onRedo = jest.fn();
  act(() => root.render(<CharacterHistoryControls canUndo canRedo onUndo={onUndo} onRedo={onRedo} />));
  act(() => container.querySelector('[aria-label="Undo character edit"]').click());
  act(() => container.querySelector('[aria-label="Redo character edit"]').click());
  expect(onUndo).toHaveBeenCalledTimes(1); expect(onRedo).toHaveBeenCalledTimes(1);
  act(() => root.render(<CharacterHistoryControls canUndo canRedo busy />));
  expect([...container.querySelectorAll("button")].every((button) => button.disabled)).toBe(true);
  act(() => root.unmount()); container.remove();
});
