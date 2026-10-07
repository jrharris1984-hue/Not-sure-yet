import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateHub from "./CreateHub";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

test("Create hub keeps new-work paths together and separate from post-generation Tools", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<CreateHub />));

  for (const path of ["/character/new", "/create/image", "/create/video", "/create/text-video"]) {
    expect(container.querySelector(`a[href="${path}"]`)).not.toBeNull();
  }
  expect(container.textContent).toContain("Start new work here");
  expect(container.querySelector('a[href="/tools"]')).toBeNull();

  act(() => root.unmount());
  container.remove();
});
