import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateJourney from "./CreateJourney";
import CreationOutputControls from "./CreationOutputControls";
import { CREATE_STAGES, CREATE_MOBILE_STEPS, createStagesForStudio } from "@/lib/createJourney";
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

test("one five-stage journey covers every DNA section once on desktop and mobile", () => {
  const sections = CREATE_STAGES.flatMap((stage) => stage.sections);
  expect(CREATE_STAGES.map((stage) => stage.title)).toEqual(["People", "Appearance", "Wardrobe", "Pose & Scene", "Create"]);
  expect(sections.slice().sort()).toEqual(SECTIONS.map((section) => section.key).sort());
  expect(new Set(sections).size).toBe(sections.length);
  expect(CREATE_MOBILE_STEPS).toBe(CREATE_STAGES);
  expect(mobileStudioStepForSection("identity", CREATE_MOBILE_STEPS)).toBe("start");
  expect(mobileStudioStepForSection("physique", CREATE_MOBILE_STEPS)).toBe("character");
  expect(mobileStudioStepForSection("wardrobe", CREATE_MOBILE_STEPS)).toBe("wardrobe");
  expect(mobileStudioStepForSection("camera", CREATE_MOBILE_STEPS)).toBe("scene");
});

test("specialty studios keep the shared stage IDs and only surface their focus in Simple mode", () => {
  const feet = createStagesForStudio("feet");
  const watersports = createStagesForStudio("watersports");
  expect(feet.map((stage) => stage.id)).toEqual(CREATE_STAGES.map((stage) => stage.id));
  expect(watersports.map((stage) => stage.id)).toEqual(CREATE_STAGES.map((stage) => stage.id));
  expect(feet.find((stage) => stage.id === "character").simpleSections).toContain("feet");
  expect(watersports.find((stage) => stage.id === "scene").simpleSections).toContain("watersports");
});

test("category selection opens its controls and follows the active section on return", () => {
  const onSection = jest.fn(), onStage = jest.fn();
  const props = { stages: CREATE_STAGES, index: 0, activeSection: "identity", sections: SECTIONS, onSection, onStage };
  render(<CreateJourney {...props} />);
  const peopleCategory = Array.from(container.querySelectorAll('button[aria-expanded]')).find((node) => node.textContent === "People");
  act(() => peopleCategory.click());
  expect(onSection).toHaveBeenCalledWith("scenario");
  expect(peopleCategory.getAttribute("aria-expanded")).toBe("true");
  render(<CreateJourney {...props} index={1} activeSection="hair" />);
  expect(button("Face & hair").getAttribute("aria-expanded")).toBe("true");
  expect(button("Body").getAttribute("aria-expanded")).toBe("false");
  act(() => container.querySelectorAll('[aria-label="Creation stages"] button')[3].click());
  expect(onStage).toHaveBeenCalledWith(3);
});

const outputProps = () => ({ workflows: [{ id: "a", name: "Model A" }, { id: "b", name: "Model B" }],
  workflowId: "a", onWorkflow: jest.fn(), tier: "balanced", onTier: jest.fn(), count: 1,
  onCount: jest.fn(), settings: { width: 1024, height: 1024, steps: 20, cfg: 3.8, seed: "" }, onSettings: jest.fn() });

test("Generate controls forward the model, quality and numeric image count to dispatch state", () => {
  const props = outputProps();
  render(<CreationOutputControls {...props} />);
  act(() => container.querySelector('[aria-label="Choose generation model"]').click());
  const model = [...container.querySelectorAll('[aria-label="Available generation models"] button')].find((node) => node.textContent.includes("Model B"));
  act(() => model.click());
  act(() => container.querySelector('[aria-label="Quality: Quality"]').click());
  act(() => container.querySelector('[aria-label="4 images"]').click());
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
  expect(container.querySelector('[aria-label="4 images"]').disabled).toBe(true);
});

test("non-image workflows omit image-specific settings", () => {
  render(<CreationOutputControls {...outputProps()} family="video" />);
  expect(container.querySelector('[aria-label="Image count"]')).toBeNull();
  expect(container.querySelector('[aria-label="Sampling steps"]')).toBeNull();
  expect(container.querySelector('[aria-label="Choose generation model"]')).not.toBeNull();
});

test("visual output choices show model recipes and block changes while busy", () => {
  render(<CreationOutputControls {...outputProps()} compiler="chroma" tier="balanced" count={4} busy />);
  expect(container.querySelector('[aria-label="Quality: Balanced"]').getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector('[aria-label="4 images"]').getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector('[aria-label="Quality: Quality"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="10 images"]').disabled).toBe(true);
  expect(container.querySelector('[aria-label="Quality: Balanced"]').textContent).toContain("26 steps");
});

test("Pose Assist explains its batch lock and edit presets describe change strength", () => {
  render(<CreationOutputControls {...outputProps()} countLocked />);
  expect(container.textContent).toContain("Pose Assist uses one image at a time");
  render(<CreationOutputControls {...outputProps()} compiler="qwen_edit" family="edit" />);
  expect(container.querySelector('[aria-label="Image count"]')).toBeNull();
  expect(container.querySelector('[aria-label="Quality: Quality"]').textContent).toContain("Stronger change");
  expect(container.querySelector('[aria-label="Quality: Quality"]').textContent).toContain("Edit strength 60%");
});
