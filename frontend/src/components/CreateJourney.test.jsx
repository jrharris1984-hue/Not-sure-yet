import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateJourney from "./CreateJourney";
import CreationOutputControls from "./CreationOutputControls";
import { CREATE_STAGES, CREATE_MOBILE_STEPS } from "@/lib/createJourney";
import { SECTIONS } from "@/lib/dna";
import { mobileStudioStepForSection } from "./MobileStudioFlow";

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (component) => act(() => root.render(component));
const button = (label) => Array.from(container.querySelectorAll("button")).find((node) => node.textContent === label);
const changeSelect = (label, value) => act(() => {
  const node = container.querySelector(`[aria-label="${label}"]`);
  node.value = value;
  node.dispatchEvent(new Event("change", { bubbles: true }));
});

test("three stages cover every DNA section once on desktop and mobile", () => {
  const sections = CREATE_STAGES.flatMap((stage) => stage.sections);
  expect(CREATE_STAGES.map((stage) => stage.title)).toEqual(["Design", "Compose", "Generate"]);
  expect(sections.slice().sort()).toEqual(SECTIONS.map((section) => section.key).sort());
  expect(new Set(sections).size).toBe(sections.length);
  expect(mobileStudioStepForSection("physique", CREATE_MOBILE_STEPS)).toBe("start");
  expect(mobileStudioStepForSection("camera", CREATE_MOBILE_STEPS)).toBe("scene");
});

test("category selection opens its controls and follows the active section on return", () => {
  const onSection = jest.fn(), onStage = jest.fn();
  const props = { stages: CREATE_STAGES, index: 0, activeSection: "identity", sections: SECTIONS, onSection, onStage };
  render(<CreateJourney {...props} />);
  act(() => button("Body").click());
  expect(onSection).toHaveBeenCalledWith("physique");
  expect(button("Body").getAttribute("aria-expanded")).toBe("true");
  render(<CreateJourney {...props} activeSection="hair" />);
  expect(button("Appearance").getAttribute("aria-expanded")).toBe("true");
  expect(button("Body").getAttribute("aria-expanded")).toBe("false");
  act(() => button("Compose").click());
  expect(onStage).toHaveBeenCalledWith(1);
});

const outputProps = () => ({ workflows: [{ id: "a", name: "Model A" }, { id: "b", name: "Model B" }],
  workflowId: "a", onWorkflow: jest.fn(), tier: "balanced", onTier: jest.fn(), count: 1,
  onCount: jest.fn(), settings: { width: 1024, height: 1024, steps: 20, cfg: 3.8, seed: "" }, onSettings: jest.fn() });

test("Generate controls forward the model, quality and numeric image count to dispatch state", () => {
  const props = outputProps();
  render(<CreationOutputControls {...props} />);
  changeSelect("Generation model", "b");
  changeSelect("Generation quality", "quality");
  changeSelect("Image count", "4");
  expect(props.onWorkflow).toHaveBeenCalledWith("b");
  expect(props.onTier).toHaveBeenCalledWith("quality");
  expect(props.onCount).toHaveBeenCalledWith(4);
});

test("canvas changes preserve prompt and sampling settings and stay aligned to eight pixels", () => {
  const props = outputProps();
  render(<CreationOutputControls {...props} />);
  changeSelect("Canvas format", "portrait");
  expect(props.onSettings).toHaveBeenCalledWith({ ...props.settings, width: 680, height: 1024 });
  render(<CreationOutputControls {...props} settings={{ ...props.settings, width: 256, height: 256 }} />);
  changeSelect("Canvas format", "landscape");
  expect(props.onSettings.mock.calls[1][0].height).toBe(256);
});

test("distilled models lock sampling while Pose Assist locks image count", () => {
  render(<CreationOutputControls {...outputProps()} fixedSampling countLocked />);
  expect(container.querySelector('[aria-label="Sampling steps"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="Sampling CFG"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="Generation seed"]').disabled).toBe(false);
  expect(container.querySelector('[aria-label="Image count"]').disabled).toBe(true);
});

test("non-image workflows omit image-specific settings", () => {
  render(<CreationOutputControls {...outputProps()} family="video" />);
  expect(container.querySelector('[aria-label="Image count"]')).toBeNull();
  expect(container.querySelector('[aria-label="Sampling steps"]')).toBeNull();
  expect(container.querySelector('[aria-label="Generation model"]')).not.toBeNull();
});
