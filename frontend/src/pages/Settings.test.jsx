import { act } from "react";
import { createRoot } from "react-dom/client";
import { endpoints } from "@/lib/api";
import Settings from "./Settings";
jest.mock('react-router-dom', () => ({Link: ({to, children, ...props}) => <a href={to} {...props}>{children}</a>}), {virtual: true});
jest.mock('@/components/WebResearchSettings', () => () => <div>Optional web research</div>);
jest.mock('@/lib/api', () => ({ endpoints: { validateWorkflow: jest.fn() } }));

const mockMutate = jest.fn();
let mockOllamaModels = [];
let mockComfyResources = {
  devices: [{ index: 0, name: "RTX 4070 SUPER", type: "cuda", vram_total: 12 * 1024 ** 3,
    vram_free: 8 * 1024 ** 3, vram_used: 4 * 1024 ** 3, vram_used_percent: 33.3, pressure: "normal" }],
  queue: { active_jobs: 1, queued_jobs: 2 },
};
const mockWorkflows = [
  { id: "base", name: "Krea 2 Turbo", kind: "image", prompt_style: "krea2", json_str: "{}" },
  { id: "style", name: "Krea 2 Turbo · Private Magazine", kind: "krea_style", prompt_style: "krea2", json_str: "{}" },
  { id: "pose", name: "Pose Assist foundation", kind: "pose", prompt_style: "flux", json_str: "{}" },
];
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[0] === "workflows" ? mockWorkflows
      : queryKey[0] === "comfy-resources" ? mockComfyResources
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

test("Settings exposes a compact navigator for the major configuration areas", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<Settings />));
  const nav = container.querySelector('[data-testid="settings-section-nav"]');
  expect(nav).not.toBeNull();
  for (const id of ["appearance", "prompts", "comfyui", "media-library", "workflows", "ai-assist"]) {
    expect(nav.querySelector(`a[href="#${id}"]`)).not.toBeNull();
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  }
  act(() => root.unmount());
});

test("saved workflow can be checked against the connected ComfyUI schema", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  endpoints.validateWorkflow.mockResolvedValueOnce({
    compatible: true,
    checked_nodes: 4,
    issues: [],
    schema_source: "connected ComfyUI /object_info",
  });
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<Settings />));
  act(() => container.querySelector('[data-testid="workflow-row-base"] button.flex-1').click());
  await act(async () => {
    container.querySelector('[data-testid="btn-workflow-validate-base"]').click();
    await Promise.resolve();
  });
  expect(endpoints.validateWorkflow).toHaveBeenCalledWith("base");
  expect(container.querySelector('[data-testid="workflow-validation-base"]').textContent).toContain("Graph compatible · 4 nodes checked");
  act(() => root.unmount());
});

test("Settings reports GPU memory and serialized queue status from ComfyUI", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<Settings />));
  expect(container.querySelector('[data-testid="comfy-resource-panel"]').textContent).toContain("RTX 4070 SUPER");
  expect(container.querySelector('[data-testid="comfy-resource-panel"]').textContent).toContain("8.0 GB free");
  expect(container.querySelector('[data-testid="comfy-resource-panel"]').textContent).toContain("1 active · 2 waiting");
  act(() => root.unmount());
});

