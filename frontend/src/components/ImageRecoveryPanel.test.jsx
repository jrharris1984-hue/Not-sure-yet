import { act } from "react";
import { createRoot } from "react-dom/client";
import ImageRecoveryPanel from "./ImageRecoveryPanel";

let container, root, onRecover;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onRecover = jest.fn();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (props = {}) => act(() => root.render(<ImageRecoveryPanel onRecover={onRecover} {...props} />));
const choose = (mode) => act(() => container.querySelector(`[data-testid="recovery-${mode}"]`).click());
const submit = () => act(() => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

test("selecting source variation does not generate until the user submits", () => {
  render();
  choose("small_variation");
  expect(onRecover).not.toHaveBeenCalled();
  submit();
  expect(onRecover).toHaveBeenCalledWith({ mode: "small_variation", strength: 0.22, targets: [], instruction: "" });
});

test("repair requires a selected region and supplies conservative repair settings", () => {
  render();
  choose("anatomy_repair");
  submit();
  expect(onRecover).toHaveBeenCalledWith({ mode: "anatomy_repair", strength: 0.35, targets: ["hands"], instruction: "" });
  onRecover.mockClear();
  act(() => Array.from(container.querySelectorAll('input[type="checkbox"]')).find((input) => input.checked).click());
  expect(container.querySelector('[data-testid="recovery-submit"]').disabled).toBe(true);
  submit();
  expect(onRecover).not.toHaveBeenCalled();
});

test("pending preparation prevents duplicate requests", () => {
  render();
  choose("small_variation");
  render({ busy: true });
  submit();
  expect(onRecover).not.toHaveBeenCalled();
});

test("switching tools resets strength to the matching default", () => {
  render();
  choose("anatomy_repair");
  choose("small_variation");
  expect(container.querySelector('input[type="range"]').value).toBe("0.22");
  expect(container.querySelector('input[type="range"]').max).toBe("0.35");
});
