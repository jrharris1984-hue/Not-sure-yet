import { act } from "react";
import { createRoot } from "react-dom/client";
import StudioModePicker from "./StudioModePicker";

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("Studio modes are presented as one Builder choice instead of separate apps", () => {
  const onChange = jest.fn();
  act(() => root.render(<StudioModePicker value="standard" onChange={onChange} />));
  expect(container.querySelectorAll('[data-testid^="studio-mode-"]')).toHaveLength(3);
  expect(container.querySelector('[data-testid="studio-mode-standard"]').getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector('[data-testid="studio-mode-feet"]').getAttribute("aria-pressed")).toBe("false");

  act(() => container.querySelector('[data-testid="studio-mode-feet"]').click());
  expect(onChange).toHaveBeenCalledWith("feet");
});

test("focused mode remains a UI preference and can switch back to Standard", () => {
  const onChange = jest.fn();
  act(() => root.render(<StudioModePicker value="watersports" onChange={onChange} />));
  expect(container.textContent).toContain("Watersports");
  expect(container.querySelector('[data-testid="studio-mode-watersports"]').getAttribute("aria-pressed")).toBe("true");
  act(() => container.querySelector('[data-testid="studio-mode-standard"]').click());
  expect(onChange).toHaveBeenCalledWith("standard");
});
