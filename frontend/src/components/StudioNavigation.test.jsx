import { act } from "react";
import { createRoot } from "react-dom/client";
import MobileStudioNavigation, { StudioNavLinks } from "./StudioNavigation";

let mockPath = "/gallery";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mockPath }),
  Link: ({ to, state, children, onClick, ...props }) => <a href={to} {...props} onClick={(event) => { onClick?.(event); event.preventDefault(); mockNavigate(to, state); }}>{children}</a>,
  NavLink: ({ to, state, end, className, children, ...props }) => {
    const active = end ? mockPath === to : mockPath.startsWith(to);
    return <a href={to} aria-current={active ? "page" : undefined}
      className={typeof className === "function" ? className({ isActive: active }) : className}
      onClick={() => mockNavigate(to, state)} {...props}>{children}</a>;
  },
}), { virtual: true });

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockPath = "/gallery"; mockNavigate.mockClear();
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (component = <MobileStudioNavigation />) => act(() => root.render(component));
test("mobile keeps primary actions visible and moves secondary destinations into More", () => {
  render();
  expect(container.querySelectorAll("a").length).toBe(4);
  expect(document.querySelector('[data-testid="nav-settings-mobile"]')).toBeNull();
  expect(document.querySelector('[data-testid="nav-tools-mobile"]')).toBeNull();
  act(() => container.querySelector('[data-testid="nav-more-mobile"]').click());
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="nav-settings-mobile"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="nav-tools-mobile"]')).not.toBeNull();
  act(() => document.querySelector('[data-testid="nav-settings-mobile"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/settings", undefined);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
test("Gallery navigation retains the return path to an unsaved editor", () => {
  render(<MobileStudioNavigation returnTo="/character/new/s/pose" />);
  act(() => container.querySelector('[data-testid="nav-gallery-mobile"]').click());
  expect(mockNavigate).toHaveBeenCalledWith("/gallery", { returnTo: "/character/new/s/pose" });
});
test("desktop links keep all destinations and root is selected only at the root", () => {
  render(<StudioNavLinks returnTo="/character/new" />);
  expect(container.querySelectorAll("a").length).toBe(7);
  expect(container.querySelector('[data-testid="nav-library"]').getAttribute("aria-current")).toBeNull();
  expect(container.querySelector('[data-testid="nav-gallery"]').getAttribute("aria-current")).toBe("page");
  expect(container.querySelector('[data-testid="nav-tools"]')).not.toBeNull();
});
