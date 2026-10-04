import { act } from "react";
import { createRoot } from "react-dom/client";
import Settings from "./Settings";

const mockWorkflows = [
  { id: "base", name: "Krea 2 Turbo", kind: "image", prompt_style: "krea2", json_str: "{}" },
  { id: "style", name: "Krea 2 Turbo · Private Magazine", kind: "krea_style", prompt_style: "krea2", json_str: "{}" },
  { id: "pose", name: "Pose Assist foundation", kind: "pose", prompt_style: "flux", json_str: "{}" },
];
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[0] === "workflows" ? mockWorkflows
      : queryKey[0] === "settings" ? { default_workflow_id: "base", comfyui_url: "http://localhost:8188", ai_provider: "ollama" }
        : {},
    refetch: jest.fn(),
  }),
  useMutation: () => ({ mutate: jest.fn() }),
  useQueryClient: () => ({ invalidateQueries: jest.fn(), setQueryData: jest.fn() }),
}));

test("Settings keeps the main catalog clean and can reveal retained legacy presets and internal stages", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<Settings />));
  expect(container.textContent).toContain("1 standalone workflow");
  expect(container.textContent).not.toContain("Pose Assist foundation");
  expect(container.textContent).not.toContain("Krea 2 Turbo · Private Magazine");
  act(() => container.querySelector('[data-testid="btn-show-supporting-workflows"]').click());
  expect(container.textContent).toContain("Pose Assist foundation");
  expect(container.textContent).toContain("Krea 2 Turbo · Private Magazine");
  expect(container.textContent).toContain("select the Private Magazine LoRA");
  act(() => root.unmount());
});
