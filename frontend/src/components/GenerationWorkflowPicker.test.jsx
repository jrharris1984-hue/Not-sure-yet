import { act } from "react";
import { createRoot } from "react-dom/client";
import GenerationWorkflowPicker from "./GenerationWorkflowPicker";
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const workflows = [{ id: "a", name: "Model A", kind: "image", notes: "Quick preview" }, { id: "b", name: "Model B", kind: "video", notes: "Animate a photograph" }];
const render = (props) => act(() => root.render(<GenerationWorkflowPicker workflows={workflows} value="a" {...props} />));
const open = () => act(() => container.querySelector('[aria-label="Choose generation model"]').click());
const search = (value) => act(() => {
  const input = container.querySelector("input");
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

test("search finds workflows by notes and selection returns the workflow ID", () => {
  const onChange = jest.fn();
  render({ onChange });
  expect(container.textContent).toContain("Quick preview");
  open();
  search("animate photograph");
  const options = container.querySelectorAll('[aria-label="Available generation models"] button');
  expect(options.length).toBe(1);
  expect(options[0].textContent).toContain("Model B");
  act(() => options[0].click());
  expect(onChange).toHaveBeenCalledWith("b");
  expect(container.querySelector("input")).toBeNull();
  expect(document.activeElement).toBe(container.querySelector('[aria-label="Choose generation model"]'));
});

test("empty lists and searches explain what to do without changing the selection", () => {
  const onChange = jest.fn();
  render({ onChange, workflows: [] });
  open();
  expect(container.querySelector('[role="status"]').textContent).toContain("Settings");
  render({ onChange });
  search("missing model");
  expect(container.querySelector('[role="status"]').textContent).toContain("No workflows match");
  expect(onChange).not.toHaveBeenCalled();
  act(() => container.querySelector("input").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(container.querySelector("input")).toBeNull();
});

test("selected state follows external model changes and busy blocks options", () => {
  render({});
  open();
  expect(container.querySelector('[aria-pressed="true"]').textContent).toContain("Model A");
  render({ value: "b", busy: true });
  expect(container.querySelector('[aria-pressed="true"]').textContent).toContain("Model B");
  expect([...container.querySelectorAll("button")].every((button) => button.disabled)).toBe(true);
  expect(container.querySelector("input").disabled).toBe(true);
});
