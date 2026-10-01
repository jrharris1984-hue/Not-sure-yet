import { API_BASE } from "@/lib/api";

export function mediaUrl(url = "") {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.endsWith("/view") && parsed.searchParams.has("filename")) {
      const params = new URLSearchParams({
        filename: parsed.searchParams.get("filename"),
        subfolder: parsed.searchParams.get("subfolder") || "",
        type: parsed.searchParams.get("type") || "output",
      });
      return `${API_BASE}/comfyui/media?${params}`;
    }
  } catch { /* Keep local or non-ComfyUI URLs. */ }
  return url;
}
