import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import CharacterDesignControls from "./CharacterDesignControls";
import { GLUTE_SHAPES, GLUTE_TEXTURES } from "../lib/gluteControls";

let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = props => act(() => root.render(<CharacterDesignControls onChange={() => {}} {...props} />));
const change = (element, value) => act(() => { element.value = value; element.dispatchEvent(new Event("change", { bubbles: true })); });

test("renders current exported catalogs and slider maximum", () => {
  render({});
  const selects = container.querySelectorAll("select");
  expect(Array.from(selects[0].options).slice(1).map(o => o.value)).toEqual(GLUTE_SHAPES);
  expect(Array.from(selects[1].options).slice(1).map(o => o.value)).toEqual(GLUTE_TEXTURES);
  expect(container.querySelector('input[type="range"]').max).toBe("300");
});

test("selection updates preserve other saved values", () => {
  const onChange = jest.fn();
  render({ value: { size: 40, shape: "naturally round", texture: "firm" }, onChange });
  change(container.querySelector("select"), "athletic round");
  expect(onChange).toHaveBeenCalledWith({ size: 40, shape: "athletic round", texture: "firm" });
});

test("slider edits update the stored number and preserve shape and texture", () => {
  const onChange = jest.fn();
  render({ value: { size: 40, shape: "athletic round", texture: "firm" }, onChange });
  const slider = container.querySelector('input[type="range"]');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(slider, "75");
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(onChange).toHaveBeenCalledWith({ size: 75, shape: "athletic round", texture: "firm" });
});

test("controlled selections remain visible after updates and reset", () => {
  function Harness() { const [value, setValue] = useState(); return <CharacterDesignControls value={value} onChange={setValue} />; }
  act(() => root.render(<Harness />));
  change(container.querySelectorAll("select")[1], "smooth");
  expect(container.querySelectorAll("select")[1].value).toBe("smooth");
  act(() => container.querySelector("button").click());
  expect(container.querySelectorAll("select")[1].value).toBe("");
});

test("reopening a subject displays its saved profile", () => {
  render({ subjectLabel: "B", value: { size: 40, shape: "athletic round", texture: "firm" } });
  expect(container.querySelector("h2").textContent).toContain("Subject B");
  expect(container.querySelector('input[type="range"]').value).toBe("40");
  expect(container.querySelectorAll("select")[0].value).toBe("athletic round");
  expect(container.querySelectorAll("select")[1].value).toBe("firm");
});
