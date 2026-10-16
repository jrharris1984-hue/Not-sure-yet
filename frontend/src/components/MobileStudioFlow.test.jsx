import { act } from "react";
import { createRoot } from "react-dom/client";
import MobileStudioFlow from "./MobileStudioFlow";
import MobileCreateReview from "./MobileCreateReview";
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

test("mobile categories open their own controls and follow a returned section", () => {
  const onSection = jest.fn();
  const props = { steps: CREATE_STAGES, currentStep: "character", activeSection: "physique",
    sections: SECTIONS, mode: "advanced", onSection, onStep: jest.fn(), onModeChange: jest.fn() };
  act(() => root.render(<MobileStudioFlow {...props} />));
  const categories = () => container.querySelector('[aria-label="Appearance categories"]');
  expect(categories().querySelector('[aria-expanded="true"]').textContent).toBe("Body");
  expect(container.querySelector('[data-testid="mobile-studio-section-hair"]')).toBeNull();
  act(() => categories().querySelectorAll("button")[1].click());
  expect(onSection).toHaveBeenCalledWith("face");
  expect(container.querySelector('[data-testid="mobile-studio-section-hair"]')).not.toBeNull();
  act(() => root.render(<MobileStudioFlow {...props} activeSection="feet" />));
  expect(categories().querySelector('[aria-expanded="true"]').textContent).toBe("Body");
  expect(container.querySelector('[data-testid="mobile-studio-section-feet"]').getAttribute("aria-pressed")).toBe("true");
});

test("final review returns directly to the selected setup area", () => {
  const onEditSection = jest.fn(), onRequestAdvanced = jest.fn(), onEditWorkflow = jest.fn();
  act(() => root.render(<MobileCreateReview qualityTier="balanced" summaries={{ character: "My character", scene: "Studio", fineTune: "Solo" }}
    onEditSection={onEditSection} onRequestAdvanced={onRequestAdvanced} onEditWorkflow={onEditWorkflow} />));
  act(() => container.querySelector('[aria-label="Edit character"]').click());
  expect(onEditSection).toHaveBeenCalledWith("identity");
  act(() => container.querySelector('[aria-label="Edit scene"]').click());
  expect(onEditSection).toHaveBeenCalledWith("scene");
  act(() => container.querySelector('[aria-label="Edit workflow"]').click());
  expect(onEditWorkflow).toHaveBeenCalledTimes(1);
  expect(onRequestAdvanced).not.toHaveBeenCalled();
  act(() => container.querySelector('[aria-label="Edit fine tune"]').click());
  expect(onEditSection).toHaveBeenCalledWith("scenario");
});

test("mobile search finds a hidden setting by field label and opens Advanced", () => {
  const onSection = jest.fn(), onModeChange = jest.fn();
  act(() => root.render(<MobileStudioFlow steps={CREATE_STAGES} currentStep="character" activeSection="hair"
    sections={SECTIONS} mode="simple" onSection={onSection} onModeChange={onModeChange} onStep={jest.fn()} />));
  act(() => container.querySelector('[data-testid="btn-mobile-section-finder"]').click());
  act(() => {
    const input = container.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "toe length");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const result = container.querySelector('[data-testid="mobile-jump-feet"]');
  expect(result).not.toBeNull();
  act(() => result.click());
  expect(onModeChange).toHaveBeenCalledWith("advanced");
  expect(onSection).toHaveBeenCalledWith("feet");
  expect(container.querySelector('[data-testid="mobile-section-finder"]')).toBeNull();
});
