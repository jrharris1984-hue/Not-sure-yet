import { act } from "react";
import { createRoot } from "react-dom/client";
import PinnedSectionControls from "./PinnedSectionControls";
let container, root;
const sections = [{ key: "hair", title: "Hair" }, { key: "pose", title: "Pose" }];
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test("pin controls toggle the current section and pinned buttons navigate", () => {
  const onToggle = jest.fn(), onSection = jest.fn();
  act(() => root.render(<PinnedSectionControls sections={sections} currentSection="hair" activeSection="hair" pinned={["hair"]} onToggle={onToggle} onSection={onSection} />));
  act(() => [...container.querySelectorAll("button")].find((node) => node.textContent === "Unpin Hair").click());
  expect(onToggle).toHaveBeenCalledWith("hair");
  const pinned = container.querySelector('nav button');
  expect(pinned.getAttribute("aria-pressed")).toBe("true");
  act(() => pinned.click()); expect(onSection).toHaveBeenCalledWith("hair");
});

test("full pins explain how to make room and review offers navigation only", () => {
  act(() => root.render(<PinnedSectionControls sections={sections} currentSection="pose" pinned={["hair"]} limit={1} />));
  expect(container.querySelector("button").disabled).toBe(true);
  expect(container.textContent).toContain("unpin it to make room");
  act(() => root.render(<PinnedSectionControls sections={sections} currentSection={null} pinned={["hair"]} />));
  expect(container.querySelectorAll("button").length).toBe(1);
  expect(container.querySelector("button").textContent).toBe("Hair");
});
