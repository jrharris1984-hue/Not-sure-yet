import { act } from "react";
import { createRoot } from "react-dom/client";
import PostGenerationActions from "./PostGenerationActions";

test("post-generation actions keep image operations in one shared panel", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const handlers = {
    edit: jest.fn(), pose: jest.fn(), animate: jest.fn(), reference: jest.fn(), body: jest.fn(), tools: jest.fn(),
  };
  act(() => root.render(<PostGenerationActions
    onEdit={handlers.edit}
    onPose={handlers.pose}
    onAnimate={handlers.animate}
    onReference={handlers.reference}
    onBody={handlers.body}
    onTools={handlers.tools}
  />));

  for (const [testId, handler] of [
    ["post-action-edit", handlers.edit],
    ["post-action-pose", handlers.pose],
    ["post-action-animate", handlers.animate],
    ["post-action-reference", handlers.reference],
    ["post-action-body", handlers.body],
    ["post-action-tools", handlers.tools],
  ]) {
    const button = container.querySelector(`[data-testid="${testId}"]`);
    expect(button).not.toBeNull();
    act(() => button.click());
    expect(handler).toHaveBeenCalledTimes(1);
  }

  act(() => root.unmount());
  container.remove();
});

test("compact panel hides descriptions but keeps the same actions", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<PostGenerationActions compact onEdit={() => {}} onAnimate={() => {}} />));
  expect(container.querySelector('[data-testid="post-action-edit"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="post-action-animate"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Creation is finished");
  act(() => root.unmount());
  container.remove();
});
