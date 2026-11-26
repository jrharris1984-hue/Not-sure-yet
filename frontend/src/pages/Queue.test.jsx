import { act } from "react";
import { createRoot } from "react-dom/client";
import Queue from "./Queue";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }) => ({ data: queryKey[0] === "render-queue" ? [
    { id: "q", status: "queued", queue_position: 2, gpu_wait: true, gpu_wait_reason: "Waiting for GPU memory", shoot_id: "s", shoot_frame_index: 3, workflow_name: "Qwen", video_sequence_id: "seq-1", video_sequence_label: "Night editorial", video_clip_index: 1, video_clip_label: "Close-up", video_frames: 121, video_fps: 24, setup_notes: ["Original image only; optional face enhancement is unavailable"] },
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
    expect(job.textContent).toContain("Original image only");
    expect(job.textContent).toContain("Night editorial · clip 2: Close-up · 5.0 sec");
    expect(job.textContent).toContain("position #2");
    expect(job.textContent).toContain("Waiting for GPU memory");
    expect(job.querySelector('[data-testid="btn-dispatch-anyway-q"]').textContent).toContain("Dispatch anyway");
    expect(job.querySelector('a[href="/shoot/s"]').textContent).toContain("frame 4");
  } finally { act(() => root.unmount()); }
});
