import { act } from "react";
import { createRoot } from "react-dom/client";
import Queue from "./Queue";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === "render-queue" ? [
    { id: "q", status: "queued", queue_position: 2, shoot_id: "s", shoot_frame_index: 3, workflow_name: "Qwen" },
  ] : { online: true } }),
  useQueryClient: () => ({}), useMutation: () => ({}),
}));
jest.mock("@/lib/api", () => ({ endpoints: {} }));
jest.mock("sonner", () => ({ toast: {} }));

test("waiting shoot jobs show a frame number and link to their shoot", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div"), root = createRoot(container);
  try {
    act(() => root.render(<Queue />));
    const job = container.querySelector('[data-testid="queue-job-q"]');
    expect(job.textContent).toContain("Waiting");
    expect(job.textContent).toContain("position #2");
    expect(job.querySelector('a[href="/shoot/s"]').textContent).toContain("frame 4");
  } finally { act(() => root.unmount()); }
});
