import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateSetupSummary from "./CreateSetupSummary";
import { CREATE_STAGES } from "@/lib/createJourney";
import { SECTIONS } from "@/lib/dna";

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test("setup navigation covers every section and follows current character values", () => {
  const onSection = jest.fn();
  const render = (dna) => act(() => root.render(<CreateSetupSummary dna={dna} stages={CREATE_STAGES} sections={SECTIONS} onSection={onSection} />));
  render({ hair: { color: "black" } });
  expect(container.querySelectorAll("button").length).toBe(SECTIONS.length);
  const editHair = () => container.querySelector('[aria-label="Edit hair from your setup"]');
  expect(editHair().textContent).toContain("black");
  act(() => editHair().click());
  expect(onSection).toHaveBeenCalledWith("hair");
  render({ hair: { color: "red" } });
  expect(editHair().textContent).toContain("red");
  expect(editHair().textContent).not.toContain("black");
});

test("empty and structured values stay readable and extra details remain compact", () => {
  const sections = [{ key: "custom", title: "Custom", fields: [
    { key: "labels", label: "Labels", optionLabels: { a: "Friendly A" } },
    { key: "empty", label: "Empty" }, { key: "object", label: "Object" },
    ...[1, 2, 3, 4].map((n) => ({ key: `field${n}`, label: `Field ${n}` })),
  ] }];
  act(() => root.render(<CreateSetupSummary sections={sections}
    stages={[{ key: "custom", title: "Custom", sections: ["custom"] }, { key: "create", title: "Create", sections: [] }]}
    dna={{ custom: { labels: ["a", "none"], empty: "none", object: { internal: true }, field1: "one", field2: "two", field3: "three", field4: "four" } }} />));
  expect(container.textContent).toContain("Friendly A");
  expect(container.textContent).not.toContain("[object Object]");
  expect(container.textContent).not.toContain("Empty:");
  expect(container.textContent).toContain("+2 more selected details");
  expect(container.querySelectorAll("details").length).toBe(1);
});
