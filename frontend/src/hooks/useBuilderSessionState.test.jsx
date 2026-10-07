import { act } from "react";
import { createRoot } from "react-dom/client";
import { useBuilderSessionState } from "./useBuilderSessionState";

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

function Probe({ studio = "standard" }) {
  api = useBuilderSessionState({ studio, queryClient: { setQueryData: jest.fn() } });
  return <div data-testid="state">{api.name}|{api.subjects.length}|{api.workflowId}|{api.renderCount}</div>;
}

test("session hook owns Builder defaults without changing them", () => {
  act(() => root.render(<Probe />));
  expect(container.textContent).toBe("Untitled|1||1");
  expect(api.qualityTier).toBe("balanced");
  expect(api.editMode).toBe("standard");
  expect(api.repairTargets).toEqual(["face", "hands"]);
});

test("foot studio keeps its focused initial DNA in extracted state", () => {
  act(() => root.render(<Probe studio="feet" />));
  expect(api.subjects[0].dna.feet.composition_mode).toBe("feet focus");
  expect(api.subjects[0].dna.pose.focus).toBe("feet");
  expect(api.subjects[0].dna.pose.distance).toBe("full body");
});

test("draft restoration remains centralized and preserves render session state", () => {
  act(() => root.render(<Probe />));
  act(() => {
    api.restoreDraft({
      name: "Restored",
      subjects: [{ id: "a", label: "A", dna: { identity: { age: 41 } }, field_locks: {} }],
      activeSubjectId: "a",
      workflowId: "workflow-1",
      qualityTier: "quality",
      renderCount: 4,
      activeRender: { id: "render-1", status: "done" },
      batchRenders: [{ id: "render-1", status: "done" }, { id: "render-2", status: "done" }],
      selectedBatchRenderId: "render-2",
      promptLanguage: "editorial",
    });
  });
  expect(api.name).toBe("Restored");
  expect(api.activeSubjectId).toBe("a");
  expect(api.workflowId).toBe("workflow-1");
  expect(api.qualityTier).toBe("quality");
  expect(api.renderCount).toBe(4);
  expect(api.activeRender.id).toBe("render-1");
  expect(api.selectedBatchRenderId).toBe("render-2");
});
