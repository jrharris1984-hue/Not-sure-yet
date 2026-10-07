import { act } from "react";
import { createRoot } from "react-dom/client";
import { createStagesForStudio } from "@/lib/createJourney";
import { useCreateShellState } from "./useCreateShellState";

let container, root, api;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  api = null;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Probe({ activeSection = "identity", studio = "standard", nav = jest.fn() }) {
  const studioSteps = createStagesForStudio(studio);
  api = useCreateShellState({
    activeSection,
    studioSteps,
    nav,
    sectionUrl: key => `/character/new/s/${key}`,
  });
  return <div>{api.mobileStudioStep}|{api.mobileStudioMode}|{String(api.quickReview)}</div>;
}

test("shared shell starts on the stage that owns the active section", () => {
  act(() => root.render(<Probe activeSection="wardrobe" />));
  expect(api.mobileStudioStep).toBe("wardrobe");
  expect(api.mobileStudioMode).toBe("simple");
  expect(api.quickReview).toBe(false);
});

test("opening a stage navigates through the shared section map", () => {
  const nav = jest.fn();
  act(() => root.render(<Probe nav={nav} />));
  act(() => api.openMobileStudioStep("scene"));
  expect(api.mobileStudioStep).toBe("scene");
  expect(nav).toHaveBeenCalledWith("/character/new/s/pose");
});

test("focused studios keep the same shell while exposing specialty sections", () => {
  const nav = jest.fn();
  act(() => root.render(<Probe studio="watersports" nav={nav} />));
  act(() => api.openMobileStudioStep("scene"));
  expect(nav).toHaveBeenCalledWith("/character/new/s/pose");
  act(() => api.changeMobileStudioMode("advanced"));
  expect(api.mobileStudioMode).toBe("advanced");
});
