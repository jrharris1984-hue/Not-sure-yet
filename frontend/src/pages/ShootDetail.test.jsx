import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import Shoots from "./Shoots";
import ShootDetail from "./ShootDetail";

jest.mock("@/lib/api", () => ({ API_BASE: "/api", endpoints: {
  listShoots: jest.fn(), getShoot: jest.fn(),
} }));
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("react-router-dom", () => ({
  useParams: () => ({ shootId: "shoot-a" }),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
jest.mock("@/components/LivePreview", () => () => null);

const shoot = {
  id: "shoot-a", name: "Studio shoot", status: "done", count: 3, rendered_count: 2,
  frames: [{ status: "failed" }, { status: "done", pose_action: "standing" }, { status: "done", pose_action: "seated" }],
  renders: [null, { id: "one", output_files: ["http://comfy:8188/view?filename=one.png&type=output"] },
    { id: "two", output_files: ["two.png"] }],
};
let container, root, client;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  endpoints.listShoots.mockResolvedValue([shoot]);
  endpoints.getShoot.mockResolvedValue(shoot);
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); });
async function render(Page) {
  await act(async () => {
    root.render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
    await new Promise(resolve => setTimeout(resolve, 20));
  });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
}
test("completed shoot card links to its detail route", async () => {
  await render(Shoots);
  expect(container.querySelector('[data-testid="shoot-card-0"]').getAttribute("href")).toBe("/shoot/shoot-a");
});
test("View photos opens completed frames and supports next, previous and thumbnail entry", async () => {
  await render(ShootDetail);
  expect(endpoints.getShoot).toHaveBeenCalledWith("shoot-a");
  act(() => container.querySelector('[data-testid="btn-view-shoot-photos"]').click());
  expect(container.querySelector('[data-testid="shoot-gallery-image"]').getAttribute("src")).toBe("/api/comfyui/media?filename=one.png&subfolder=&type=output");
  act(() => container.querySelector('[data-testid="btn-shoot-gallery-next"]').click());
  expect(container.querySelector('[data-testid="shoot-gallery-image"]').getAttribute("src")).toBe("two.png");
  act(() => container.querySelector('[data-testid="btn-shoot-gallery-previous"]').click());
  expect(container.querySelector('[data-testid="shoot-gallery-image"]').getAttribute("alt")).toBe("Photo shoot frame 2");
  act(() => container.querySelector('[aria-label="Close photo shoot gallery"]').click());
  act(() => container.querySelector('[data-testid="btn-open-shoot-frame-2"]').click());
  expect(container.querySelector('[data-testid="shoot-gallery-image"]').getAttribute("src")).toBe("two.png");
});
test("failed shoot load displays retry and retry opens the photos", async () => {
  endpoints.getShoot.mockRejectedValueOnce(new Error("offline"));
  await render(ShootDetail);
  expect(container.querySelector('[role="alert"]').textContent).toContain("Could not load this shoot");
  await act(async () => {
    [...container.querySelectorAll("button")].find(button => button.textContent === "Try again").click();
    await new Promise(resolve => setTimeout(resolve, 20));
  });
  expect(container.querySelector('[data-testid="btn-view-shoot-photos"]')).not.toBeNull();
});
