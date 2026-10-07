import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";

let mockPath = "/character/new/s/identity";
let mockHealth = { isLoading: true };
jest.mock("@tanstack/react-query", () => ({ useQuery: () => mockHealth }));
jest.mock("@/lib/api", () => ({ endpoints: { comfyHealth: jest.fn() } }));
jest.mock("./NowRenderingStrip", () => () => null);
jest.mock("./PwaInstallPrompt", () => () => null);
jest.mock("./StudioNavigation", () => ({ __esModule: true, default: () => null, StudioNavLinks: () => null }));
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mockPath }),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

let root, container;
function DraftEditor() {
  const [name, setName] = useState("Untitled");
  return <button onClick={() => setName("Saved in draft")}>{name}</button>;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockPath = "/character/new/s/identity"; mockHealth = { isLoading: true };
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = () => act(() => root.render(<AppShell><DraftEditor /></AppShell>));
test("section transitions preserve unsaved child state", () => {
  render();
  act(() => container.querySelector("main button").click());
  mockPath = "/character/new/s/pose";
  render();
  expect(container.querySelector("main button").textContent).toBe("Saved in draft");
});
test("health loading and failed checks are distinct from an offline result", () => {
  render();
  expect(container.querySelector('[data-testid="comfyui-ws-status-badge"]').textContent).toContain("checking");
  mockHealth = { isError: true, data: { online: true } }; render();
  expect(container.querySelector('[data-testid="comfyui-ws-status-badge"]').textContent).toContain("unavailable");
  mockHealth = { data: { online: false } }; render();
  expect(container.querySelector('[data-testid="comfyui-ws-status-badge"]').textContent).toContain("offline");
});

test("header Create opens the creation hub outside Builder", () => {
  mockPath = "/gallery";
  render();
  expect(container.querySelector('[data-testid="btn-new-character"]').getAttribute("href")).toBe("/create");
});

test("header does not offer another Create button inside an image-tool workspace", () => {
  mockPath = "/image-tools/repair";
  render();
  expect(container.querySelector('[data-testid="btn-new-character"]')).toBeNull();
});

