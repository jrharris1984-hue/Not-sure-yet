import { act } from "react";
import { createRoot } from "react-dom/client";
import Projects from "./Projects";

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

test("project dashboard brings creation, guided setup, storyboard, and libraries together", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<Projects />));
    expect(container.querySelector('[data-testid="projects-workspace"]')).not.toBeNull();
    expect(container.querySelector('a[href="/create"]')).not.toBeNull();
    expect(container.querySelector('a[href="/create/guided?start=build"]')).not.toBeNull();
    expect(container.querySelector('a[href="/shoots"]')).not.toBeNull();
    expect(container.querySelector('a[href="/gallery"]')).not.toBeNull();
    expect(container.querySelector('a[href="/settings/prompts"]')).not.toBeNull();
    expect(container.textContent).toContain("Project collections and saved project timelines are not yet available");
  } finally {
    act(() => root.unmount());
  }
});
