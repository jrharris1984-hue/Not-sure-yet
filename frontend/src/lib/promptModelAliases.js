const ALIASES = {
  flux2_klein_edit: "flux2_klein", qwen_reference: "qwen_edit", wan5b_t2v: "wan_t2v",
  kroma: "krea2", krea2_aio: "krea2", krea2_test: "krea2",
  chroma_test: "chroma", chroma_turbo: "chroma", chroma_flash: "chroma",
  qwen_remix: "qwen_edit", ltx_t2v: "wan_t2v",
};
export function normalizePromptStyle(value = "") {
  const style = String(value || "").trim().toLowerCase();
  return ALIASES[style] || style;
}
