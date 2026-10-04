import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import Gallery from "./Gallery";

jest.mock("@/lib/api", () => ({ API_BASE: "/api", endpoints: {
  aiEditPrompt: jest.fn(), prepareRenderReference: jest.fn(), recoverRenderImage: jest.fn(), listRenders: jest.fn(), getRender: jest.fn(), getRenderVersions: jest.fn(), getRenderRecipe: jest.fn(),
} }));
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

let mockUrl = "/gallery";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
  useSearchParams: () => [new URLSearchParams(mockUrl.split("?")[1] || "")],
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

let container, root, client;
const records = [
  { id: "a", workflow_name: "Chroma", status: "done", prompt_positive: "Blue dress", output_files: ["a.png"], created_at: "2026-10-04T12:00:00Z" },
  { id: "b", workflow_name: "Krea2", status: "done", prompt_positive: "Red coat", output_files: ["b.png"], created_at: "2026-10-03T12:00:00Z" },
];
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  endpoints.listRenders.mockResolvedValue(records);
  endpoints.getRender.mockImplementation(async (id) => records.find((record) => record.id === id));
  endpoints.getRenderVersions.mockResolvedValue([]);
  endpoints.getRenderRecipe.mockResolvedValue({ recipe: {} });
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); });
async function render(url = "/gallery") {
  mockUrl = url;
  await act(async () => {
    root.render(<QueryClientProvider client={client}><Gallery /></QueryClientProvider>);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
}
function inputSearch(value) {
  act(() => {
    const input = container.querySelector('[aria-label="Search Gallery"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
test("search narrows cards and offers a useful no-match state", async () => {
  await render();
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(2);
  inputSearch("blue");
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(1);
  inputSearch("unmatched");
  expect(container.textContent).toContain("No images match these filters");
  act(() => Array.from(container.querySelectorAll("button")).find((node) => node.textContent === "Clear search & filters").click());
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(2);
});
test("model filtering combines with search and sorting", async () => {
  await render();
  act(() => {
    const select = container.querySelector('[aria-label="Filter Gallery model"]');
    select.value = "Krea2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.querySelector('[data-testid="gallery-use-recipe-a"]')).toBeNull();
  expect(container.querySelector('[data-testid="gallery-use-recipe-b"]')).not.toBeNull();
  inputSearch("blue");
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(0);
});
test("using a card recipe retrieves the saved recipe without dispatching a render", async () => {
  await render();
  await act(async () => { container.querySelector('[data-testid="gallery-use-recipe-a"]').click(); });
  expect(endpoints.getRenderRecipe).toHaveBeenCalledWith("a");
  expect(mockNavigate).toHaveBeenCalledWith("/character/new", { state: { renderRecipe: { recipe: {} }, renderRecipeMode: "exact" } });
});
test("direct Gallery links retrieve a render absent from the current list", async () => {
  endpoints.getRender.mockResolvedValue({ ...records[0], id: "older" });
  await render("/gallery?render=older");
  expect(endpoints.getRender).toHaveBeenCalledWith("older");
  expect(container.querySelector('[data-testid="gallery-lightbox"]')).not.toBeNull();
});
test("backend failure is shown as an error rather than an empty gallery", async () => {
  endpoints.listRenders.mockRejectedValue(new Error("offline"));
  await render();
  expect(container.textContent).toContain("Could not refresh Gallery");
  expect(container.textContent).not.toContain("No renders yet");
});
test("newly completed renders appear after a refresh without reopening Gallery", async () => {
  endpoints.listRenders.mockResolvedValueOnce([{ ...records[0], status: "running", output_files: [] }]);
  await render();
  expect(container.querySelector('[data-testid="gallery-inflight"]')).not.toBeNull();
  await act(async () => { await client.refetchQueries({ queryKey: ["renders"] }); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(2);
  expect(container.querySelector('[data-testid="gallery-inflight"]')).toBeNull();
});
test("a failed refresh keeps previously loaded images available", async () => {
  await render();
  endpoints.listRenders.mockRejectedValue(new Error("offline"));
  await act(async () => { await client.refetchQueries({ queryKey: ["renders"] }); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  expect(container.textContent).toContain("Your last loaded images remain available");
  expect(container.querySelectorAll('[data-testid^="gallery-thumb-"]').length).toBe(2);
});

test("lightbox puts image changes first and collapses secondary tools", async () => {
  await render("/gallery?render=a");
  const tools = container.querySelector('[data-testid="gallery-other-tools"]');
  expect(tools.open).toBe(false);
  expect(tools.querySelector('[data-testid="gallery-improve-render"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="image-recovery-panel"]').closest("details")).toBeNull();
  expect(container.querySelector('[data-testid="btn-lightbox-download"]').closest("details")).toBeNull();
  act(() => tools.querySelector("summary").click());
  expect(tools.open).toBe(true);
});
test("Gallery clarifies the change and carries reviewed wording into Qwen Edit", async () => {
  endpoints.aiEditPrompt.mockResolvedValue({ prompt: "Change the dress to blue; preserve unmentioned details." });
  endpoints.prepareRenderReference.mockResolvedValue({ name: "a.png" });
  await render("/gallery?render=a");
  act(() => container.querySelector('[data-testid="recovery-small_variation"]').click());
  act(() => {
    const textarea = container.querySelector('[data-testid="recovery-instruction"]');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(textarea, "blue dress");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => container.querySelector('[data-testid="recovery-improve-instruction"]').click());
  expect(endpoints.aiEditPrompt).toHaveBeenCalledWith("blue dress", true, "variation");
  expect(endpoints.recoverRenderImage).not.toHaveBeenCalled();
  await act(async () => container.querySelector('[data-testid="recovery-open-edit"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/character/new", { state: expect.objectContaining({
    targetKind: "edit", editInstruction: "Change the dress to blue; preserve unmentioned details.",
  }) });
});
