import { act } from "react";
import { createRoot } from "react-dom/client";
import Settings from "./Settings";
jest.mock('react-router-dom', () => ({Link: ({to, children, ...props}) => <a href={to} {...props}>{children}</a>}), {virtual: true});
jest.mock('@/components/WebResearchSettings', () => () => <div>Optional web research</div>);

const mockMutate = jest.fn();
let mockOllamaModels = [];
const mockWorkflows = [
  { id: "base", name: "Krea 2 Turbo", kind: "image", prompt_style: "krea2", json_str: "{}" },
  { id: "style", name: "Krea 2 Turbo · Private Magazine", kind: "krea_style", prompt_style: "krea2", json_str: "{}" },
  { id: "pose", name: "Pose Assist foundation", kind: "pose", prompt_style: "flux", json_str: "{}" },
];
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[0] === "workflows" ? mockWorkflows
      : queryKey[0] === "settings" ? { default_workflow_id: "base", comfyui_url: "http://localhost:8188", ai_provider: "ollama" }
        : { online: true, models: mockOllamaModels },
    refetch: jest.fn(),
  }),
  useMutation: () => ({ mutate: mockMutate }),
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

 test("All assistant selections save the real model name and leaves image review independent", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockMutate.mockClear();
  mockOllamaModels = ["ultra-big-tiger-gemma:27b", "ultra-gemma3-abliterated:27b", "ultra-neuraldaredevil:8b", "ultra-dark-champion:18.4b", "qwen3-vl:8b"];
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<Settings />));
  const prompt = container.querySelector('select[aria-label="Prompt assistant model"]');
  const vision = container.querySelector('select[aria-label="Image review model"]');
  act(() => { vision.value = "qwen3-vl:8b"; vision.dispatchEvent(new Event("change", { bubbles: true })); });
  for (const model of mockOllamaModels.slice(0, 4)) {
    act(() => { prompt.value = model; prompt.dispatchEvent(new Event("change", { bubbles: true })); });
    act(() => container.querySelector('[data-testid="btn-save-settings"]').click());
    expect(mockMutate).toHaveBeenLastCalledWith(expect.objectContaining({
      ai_provider: "ollama", ollama_text_model: model, ollama_vision_model: "qwen3-vl:8b",
    }));
  }
  act(() => root.unmount());
  mockOllamaModels = [];
});


test("workflow visibility is a settings draft until saved and can be restored without deleting workflows", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockMutate.mockClear();
  const container=document.createElement("div");
  const root=createRoot(container);
  act(() => root.render(<Settings />));
  const checkbox=container.querySelector('[aria-label="Show Krea 2 Turbo in character builder"]');
  expect(checkbox.checked).toBe(true);
  act(() => checkbox.click());
  expect(checkbox.checked).toBe(false);
  expect(mockMutate).not.toHaveBeenCalled();
  act(() => container.querySelector('[data-testid="btn-save-builder-workflows"]').click());
  expect(mockMutate).toHaveBeenLastCalledWith(expect.objectContaining({builder_hidden_workflow_ids:["base"]}));
  act(() => [...container.querySelectorAll('button')].find(button => button.textContent==='Show all in builder').click());
  expect(checkbox.checked).toBe(true);
  act(() => container.querySelector('[data-testid="btn-save-builder-workflows"]').click());
  expect(mockMutate).toHaveBeenLastCalledWith(expect.objectContaining({builder_hidden_workflow_ids:[]}));
  expect(container.querySelector('[data-testid="workflow-row-base"]')).not.toBeNull();
  act(() => root.unmount());
});
