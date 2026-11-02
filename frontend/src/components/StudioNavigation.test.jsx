import { act } from "react";
import { createRoot } from "react-dom/client";
import MobileStudioNavigation, { StudioNavLinks } from "./StudioNavigation";

let mockPath = "/gallery";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mockPath }),
  Link: ({ to, state, children, onClick, ...props }) => (
    <a href={to} {...props} onClick={event => { event.preventDefault(); onClick?.(event); mockNavigate(to, state); }}>{children}</a>
  ),
  NavLink: ({ to, state, end, className, children, onClick, ...props }) => (
    <a href={to} className={className} {...props}
      onClick={event => { event.preventDefault(); onClick?.(event); mockNavigate(to, state); }}>
      {children}
    </a>
  ),
}), { virtual: true });

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockPath = "/gallery";
  mockNavigate.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (component = <MobileStudioNavigation />) => act(() => root.render(component));

test("desktop exposes six workspaces and secondary More destinations", () => {
  render(<StudioNavLinks returnTo="/character/new" compact />);
  for (const id of ["home", "create", "characters", "shoots", "projects", "library"]) {
    expect(container.querySelector(`[data-testid="nav-${id}"]`)).not.toBeNull();
  }
  expect(container.querySelector('[data-testid="nav-more-desktop"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="nav-tools"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="nav-library"]').getAttribute("aria-current")).toBe("page");
  expect(container.querySelector('[data-testid="nav-home"]').getAttribute("aria-current")).toBeNull();
});

test("mobile keeps four destinations and More visible", () => {
  render();
  expect(container.querySelectorAll("a").length).toBe(4);
  for (const id of ["home", "create", "projects", "library"]) {
    expect(container.querySelector(`[data-testid="nav-${id}-mobile"]`)).not.toBeNull();
  }
  expect(container.querySelector('[data-testid="nav-more-mobile"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="nav-tools-mobile"]')).toBeNull();
});

test("mobile Create goes to the unified creation workspace", () => {
  render();
  act(() => container.querySelector('[data-testid="nav-create-mobile"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/create", undefined);
});

test("Gallery retains the return path to an unsaved editor", () => {
  render(<MobileStudioNavigation returnTo="/character/new/s/pose" />);
  act(() => container.querySelector('[data-testid="nav-library-mobile"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/gallery", { returnTo: "/character/new/s/pose" });
});

test("image tools highlight Tools in the desktop More menu", () => {
  mockPath = "/image-tools/repair";
  render(<StudioNavLinks />);
  expect(container.querySelector('[data-testid="nav-tools"]').className).toContain("studio-nav-link-active");
});

test("builder compact header keeps Gallery return navigation", () => {
  mockPath = "/character/new/s/pose";
  render(<MobileStudioNavigation compactHeader returnTo="/character/new/s/pose" />);
  act(() => container.querySelector('[data-testid="nav-gallery-mobile"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/gallery", { returnTo: "/character/new/s/pose" });
});
