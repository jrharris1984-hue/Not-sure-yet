import { act } from "react";
import { createRoot } from "react-dom/client";
import QueueConnectionStatus from "./QueueConnectionStatus";

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (props) => act(() => root.render(<QueueConnectionStatus {...props} />));
test("offline status explains saved jobs and exposes the configured address", () => {
  render({ health: { online: false, url: "http://server:8188" } });
  expect(container.textContent).toContain("waiting jobs and seeds are saved");
  expect(container.textContent).toContain("http://server:8188");
});
test("backend failure takes precedence over a cached online result", () => {
  render({ health: { online: true }, backendError: true });
  expect(container.textContent).toContain("backend is unreachable");
  expect(container.textContent).not.toContain("ComfyUI connected");
});
test("connection checks are explicit and blocked while checking", () => {
  const onReconnect = jest.fn();
  render({ health: { online: true }, onReconnect });
  act(() => container.querySelector("button").click());
  expect(onReconnect).toHaveBeenCalledTimes(1);
  render({ checking: true, onReconnect });
  expect(container.querySelector("button").disabled).toBe(true);
});


test("busy rendering is not presented as offline", () => {
  render({ health: { online: true, state: "busy", active_jobs: 1, url: "http://server:8188" } });
  expect(container.textContent).toContain("ComfyUI rendering");
  expect(container.textContent).toContain("1 active job");
  expect(container.textContent).not.toContain("ComfyUI unreachable");
});

test("slow response remains connected instead of offline", () => {
  render({ health: { online: true, state: "slow", last_response_at: "2026-10-07T16:00:00+00:00" } });
  expect(container.textContent).toContain("responding slowly");
  expect(container.textContent).not.toContain("ComfyUI unreachable");
});
