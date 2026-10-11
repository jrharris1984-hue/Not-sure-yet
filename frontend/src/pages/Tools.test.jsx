import { act } from "react";
import { createRoot } from "react-dom/client";
import Tools from "./Tools";
import { endpoints } from "@/lib/api";

const mockNavigate = jest.fn();
let mockRenderId = "r1";
const mockWorkflows = [
  { id: "repair", name: "Repair", kind: "enhance", prompt_style: "qwen_edit" },
  { id: "animate", name: "Animate", kind: "video", prompt_style: "wan" },
  { id: "text-video", name: "Text video", kind: "text_video", prompt_style: "wan" },
];
let mockRenders = [{ id: "r1", workflow_name: "Source", output_files: ["/source.png"] }];

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockRenderId ? `render=${mockRenderId}` : "")],
}), { virtual: true });

jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({
    data: queryKey[0] === "workflows" ? mockWorkflows : mockRenders,
    isLoading: false,
    isError: false,
  }),
  useMutation: (options) => ({
    isPending: false,
    mutate: (value) => Promise.resolve(options.mutationFn(value)).then((result) => options.onSuccess?.(result, value)),
  }),
}));

jest.mock("@/lib/api", () => ({
  endpoints: {
    listWorkflows: jest.fn(),
    listRenders: jest.fn(),
    prepareRenderReference: jest.fn(),
    getRenderRecipe: jest.fn(),
  },
}));

jest.mock("@/lib/bodyCreationRecipe", () => ({ loadBodyCreationRecipe: jest.fn() }));

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockNavigate.mockClear();
  endpoints.prepareRenderReference.mockReset();
  endpoints.prepareRenderReference.mockResolvedValue({ name: "source.png", source_render_id: "r1" });
  mockRenderId = "r1";
  mockRenders = [{ id: "r1", workflow_name: "Source", output_files: ["/source.png"] }];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("selected Gallery source stays attached when launching a specific workflow", async () => {
  await act(async () => root.render(<Tools />));
  const repair = Array.from(container.querySelectorAll("button")).find((button) => button.textContent.includes("Repair"));
  await act(async () => repair.click());
  expect(endpoints.prepareRenderReference).toHaveBeenCalledWith("r1", expect.stringContaining("/source.png"));
  expect(mockNavigate).toHaveBeenCalledWith("/image-tools/repair", expect.objectContaining({
    state: expect.objectContaining({ targetKind: "enhance", previewUrl: expect.stringContaining("/source.png") }),
  }));
});

test("post-generation Tools excludes text-only video creation", async () => {
  await act(async () => root.render(<Tools />));
  expect(container.textContent).toContain("Animate");
  expect(container.textContent).not.toContain("Text video");
  expect(container.querySelector('a[href="/create/text-video"]')).toBeNull();
});

test("video Gallery results render as video and do not show still-image actions", async () => {
  mockRenders = [{ id: "r1", workflow_name: "Video source", output_files: ["/source.mp4"] }];
  await act(async () => root.render(<Tools />));
  expect(container.querySelector("video")).not.toBeNull();
  expect(container.querySelector('[data-testid="post-generation-actions"]')).toBeNull();
  expect(container.textContent).toContain("Still-image edit");
});

 test('a filename containing a literal percent sign cannot crash the source view', async () => {
  mockRenders = [{id:'r1', output_files:['/100%portrait.png']}];
  await act(async () => root.render(<Tools/>));
  expect(container.querySelector('img')).not.toBeNull();
});
