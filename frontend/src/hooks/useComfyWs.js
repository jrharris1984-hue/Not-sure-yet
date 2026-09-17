import { useEffect, useRef, useState } from "react";

// Convert an HTTP(S) URL to WS(S)
function toWs(url) {
  if (url.startsWith("https://")) return "wss://" + url.slice(8);
  if (url.startsWith("http://")) return "ws://" + url.slice(7);
  return url;
}

// Decode ComfyUI binary preview frame: 4 bytes event type + 4 bytes image type + image bytes.
// Returns a data-URL string or null.
function decodePreview(buffer) {
  if (!buffer || buffer.byteLength < 8) return null;
  const view = new DataView(buffer);
  const eventType = view.getUint32(0, false);
  const imageType = view.getUint32(4, false); // 1 = JPEG, 2 = PNG
  if (eventType !== 1) return null;
  const mime = imageType === 2 ? "image/png" : "image/jpeg";
  const body = buffer.slice(8);
  const blob = new Blob([body], { type: mime });
  return URL.createObjectURL(blob);
}

/**
 * Subscribe to ComfyUI's live progress/preview stream for a given client_id
 * (which is the render.id you passed to /prompt).
 *
 * Returns { status, progress, previewUrl, node, error, connected }
 */
export function useComfyWs(clientId, { enabled = true } = {}) {
  const [state, setState] = useState({
    connected: false,
    progress: 0, // 0..1
    step: 0,
    max: 0,
    previewUrl: null,
    node: null,
    status: "idle",
    error: null,
  });
  const wsRef = useRef(null);
  const lastUrlRef = useRef(null);

  useEffect(() => {
    if (!enabled || !clientId) return undefined;
    const base = process.env.REACT_APP_BACKEND_URL || "";
    const wsUrl = `${toWs(base)}/api/ws/comfyui?client_id=${encodeURIComponent(clientId)}`;
    const socket = new WebSocket(wsUrl);
    socket.binaryType = "arraybuffer";
    wsRef.current = socket;

    socket.onopen = () => setState((s) => ({ ...s, connected: true, error: null }));

    socket.onmessage = (evt) => {
      if (evt.data instanceof ArrayBuffer) {
        const url = decodePreview(evt.data);
        if (url) {
          // Revoke the previous url on next frame to avoid memory leaks
          if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
          lastUrlRef.current = url;
          setState((s) => ({ ...s, previewUrl: url, status: "running" }));
        }
        return;
      }
      try {
        const msg = JSON.parse(evt.data);
        const type = msg.type;
        const data = msg.data || {};
        if (type === "progress") {
          const value = Number(data.value || 0);
          const max = Number(data.max || 0);
          setState((s) => ({
            ...s,
            progress: max ? value / max : 0,
            step: value,
            max,
            status: "running",
          }));
        } else if (type === "executing") {
          if (data.node) {
            setState((s) => ({ ...s, node: data.node, status: "running" }));
          } else {
            // executing.node == null => finished
            setState((s) => ({ ...s, status: "done", progress: 1 }));
          }
        } else if (type === "executed") {
          setState((s) => ({ ...s, status: "done", progress: 1, node: null }));
        } else if (type === "status") {
          // queue info — mostly ignore, but if queue_remaining == 0 flag idle
          const q = data.status?.exec_info?.queue_remaining;
          if (q === 0) setState((s) => (s.status === "running" ? s : { ...s, status: "idle" }));
        } else if (type === "proxy_error") {
          setState((s) => ({ ...s, error: data.message || "ComfyUI unreachable", status: "offline" }));
        }
      } catch {
        /* ignore */
      }
    };

    socket.onerror = () => setState((s) => ({ ...s, error: "socket error" }));
    socket.onclose = () => setState((s) => ({ ...s, connected: false }));

    return () => {
      try { socket.close(); } catch { /* ignore */ }
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, [clientId, enabled]);

  return state;
}
