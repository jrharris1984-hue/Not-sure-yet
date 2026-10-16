import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import CanvasControls from "./CanvasControls";
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const settings = { width: 1024, height: 1024, seed: 42, steps: 26, cfg: 3.8, sampler: "euler" };
const input = (label, value) => act(() => {
  const node = container.querySelector(`[aria-label="${label}"]`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, value);
  node.dispatchEvent(new Event("input", { bubbles: true }));
});
const apply = () => act(() => [...container.querySelectorAll("button")].find((node) => node.textContent === "Apply dimensions").click());

test("custom dimensions match backend bounds and alignment while preserving sampling", () => {
  const onSettings = jest.fn();
  act(() => root.render(<CanvasControls settings={settings} onSettings={onSettings} />));
  input("Canvas width", "4096"); input("Canvas height", "257"); apply();
  expect(onSettings).toHaveBeenCalledWith({ ...settings, width: 2048, height: 256 });
});

test("empty dimensions remain editable and do not dispatch invalid values", () => {
  const onSettings = jest.fn();
  act(() => root.render(<CanvasControls settings={settings} onSettings={onSettings} />));
  input("Canvas width", ""); apply();
  expect(onSettings).not.toHaveBeenCalled();
  expect(container.querySelector('[role="status"]').textContent).toContain("Enter a number");
});

test("external presets refresh dimensions and orientation and busy blocks changes", () => {
  act(() => root.render(<CanvasControls settings={settings} onSettings={jest.fn()} />));
  input("Canvas width", "800");
  act(() => root.render(<CanvasControls settings={{ ...settings, width: 768, height: 1152 }} onSettings={jest.fn()} busy />));
  expect(container.querySelector('[aria-label="Canvas width"]').value).toBe("768");
  expect(container.querySelector('[aria-label="Canvas portrait"]').getAttribute("aria-pressed")).toBe("true");
  expect([...container.querySelectorAll("button, input")].every((node) => node.disabled)).toBe(true);
});

test("applying a portrait frame updates a controlled canvas without touching the seed", () => {
  function Host() {
    const [value, setValue] = useState(settings);
    return <><CanvasControls settings={value} onSettings={setValue} /><output>{value.width}x{value.height}:{value.seed}</output></>;
  }
  act(() => root.render(<Host />));
  act(() => container.querySelector('[aria-label="Canvas portrait"]').click());
  expect(container.querySelector("output").textContent).toBe("680x1024:42");
  input("Canvas width", "800");
  act(() => container.querySelector('[aria-label="Canvas portrait"]').click());
  expect(container.querySelector('[aria-label="Canvas width"]').value).toBe("680");
});
