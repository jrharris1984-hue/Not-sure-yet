import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateSectionFinder from "./CreateSectionFinder";
import { matchesSection } from "@/lib/sectionSearch";
import { CREATE_STAGES } from "@/lib/createJourney";
import { SECTIONS } from "@/lib/dna";
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const search = (value) => act(() => {
  const input = container.querySelector("input");
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

test("search matches setting labels, options and all query words", () => {
  const hair = SECTIONS.find((section) => section.key === "hair");
  expect(matchesSection(hair, "hair color")).toBe(true);
  expect(matchesSection(hair, "  HAIR_color  ")).toBe(true);
  expect(matchesSection(hair, "hair missingword")).toBe(false);
  const custom = { key: "wardrobe", title: "Wardrobe", fields: [{ label: "Outfit", groups: [{ name: "Retro", options: ["pin up"] }], optionLabels: { option_a: "Evening dress" } }] };
  expect(matchesSection(custom, "retro pin")).toBe(true);
  expect(matchesSection(custom, "evening dress")).toBe(true);
});

test("finder filters, navigates across stages, and closes with Escape", () => {
  const onSection = jest.fn();
  act(() => root.render(<CreateSectionFinder sections={SECTIONS} stages={CREATE_STAGES} activeSection="identity" onSection={onSection} />));
  const trigger = container.querySelector("button");
  act(() => trigger.click());
  search("hair color");
  const result = [...container.querySelectorAll('button[aria-pressed]')].find((item) => item.textContent.startsWith("Hair"));
  expect(result).toBeDefined();
  act(() => result.click());
  expect(onSection).toHaveBeenCalledWith("hair");
  expect(container.querySelector("input")).toBeNull();
  act(() => trigger.click());
  search("xyz-nothing-matches");
  expect(container.querySelector('[role="status"]').textContent).toContain("No sections found");
  act(() => container.querySelector("input").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(container.querySelector("input")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
