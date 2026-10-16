import { act } from "react";
import { createRoot } from "react-dom/client";
import CreateRenderOutcome from "./CreateRenderOutcome";
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (props) => act(() => root.render(<CreateRenderOutcome {...props} />));
const button = (text) => [...container.querySelectorAll("button")].find((item) => item.textContent === text);

test("queue and failure feedback use reported status without inventing progress", () => {
  render({ render: { id: "a", status: "queued", queue_position: 3 } });
  expect(container.querySelector('[role="status"]').textContent).toContain("Queue position #3");
  expect(container.querySelector("img")).toBeNull();
  render({ render: { id: "a", status: "failed", error: "Out of memory" } });
  expect(container.textContent).toContain("Out of memory");
  expect(button("Try a new seed")).toBeUndefined();
});

test("finished actions and batch selection use the selected result", () => {
  const a = { id: "a", status: "done", output_files: ["/a.png"] };
  const b = { id: "b", status: "done", output_files: ["/b.png"] };
  const props = { render: a, batch: [a, b], onSelect: jest.fn(), onNewSeed: jest.fn(), onEdit: jest.fn(), onAnimate: jest.fn(), onDownload: jest.fn(), canEdit: true, canAnimate: true };
  render(props);
  act(() => button("Try a new seed").click());
  expect(props.onNewSeed).toHaveBeenCalledTimes(1);
  act(() => button("Edit image").click());
  expect(props.onEdit).toHaveBeenCalledTimes(1);
  act(() => button("Animate").click());
  expect(props.onAnimate).toHaveBeenCalledTimes(1);
  act(() => button("Download").click());
  expect(props.onDownload).toHaveBeenCalledWith("/a.png");
  act(() => container.querySelector('[aria-label="Select result 2"]').click());
  expect(props.onSelect).toHaveBeenCalledWith(b);
  expect(container.querySelector('[aria-label="Select result 1"]').getAttribute("aria-pressed")).toBe("true");
  render({ ...props, busy: "variation" });
  expect([...container.querySelectorAll("button")].every((item) => item.disabled)).toBe(true);
});

test("unavailable workflows explain disabled actions and video has native playback", () => {
  render({ render: { id: "a", status: "done", output_files: ["/a.png"] } });
  expect(button("Edit image").disabled).toBe(true);
  expect(button("Animate").disabled).toBe(true);
  expect(container.textContent).toContain("in Settings");
  render({ render: { id: "v", status: "done", output_files: ["/v.mp4"] } });
  expect(container.querySelector("video").controls).toBe(true);
  expect(button("Edit image")).toBeUndefined();
});
