import { act } from "react";
import { createRoot } from "react-dom/client";
import { usePinnedSections, PINNED_SECTIONS_KEY } from "./usePinnedSections";
let container, root, api;
const sections = ["hair", "wardrobe", "lighting", "pose", "face", "skin", "feet"].map((key) => ({ key, title: key }));
function Host() { api = usePinnedSections(sections); return null; }
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
const render = () => act(() => root.render(<Host />));

test("pins persist, respect the limit and can be removed to make room", () => {
  render();
  for (const section of sections) act(() => api.toggle(section.key));
  expect(api.pinned.length).toBe(6);
  expect(JSON.parse(localStorage.getItem(PINNED_SECTIONS_KEY))).toEqual(api.pinned);
  act(() => api.toggle("hair")); act(() => api.toggle("feet"));
  expect(api.pinned).toContain("feet"); expect(api.pinned).not.toContain("hair");
  act(() => root.unmount()); root = createRoot(container); render();
  expect(api.pinned).toContain("feet");
});

test("stored duplicates and unknown sections are ignored", () => {
  localStorage.setItem(PINNED_SECTIONS_KEY, JSON.stringify(["hair", "hair", "missing", 12, "pose"]));
  render();
  expect(api.pinned).toEqual(["hair", "pose"]);
  act(() => api.toggle("missing"));
  expect(api.pinned).toEqual(["hair", "pose"]);
});

test("malformed and unavailable storage leave pins usable in the session", () => {
  localStorage.setItem(PINNED_SECTIONS_KEY, "broken JSON"); render();
  expect(api.pinned).toEqual([]);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
  act(() => api.toggle("hair"));
  expect(api.pinned).toEqual(["hair"]);
});

test("updates from another tab synchronize valid pins", () => {
  render();
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: PINNED_SECTIONS_KEY, newValue: '["lighting","missing"]' })));
  expect(api.pinned).toEqual(["lighting"]);
});
