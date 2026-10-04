export const galleryOutput = (render) => render?.output_variants?.enhanced?.[0] || render?.output_files?.[0] || "";

export function galleryIsVideo(url = "") {
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* Malformed URLs must not break browsing. */ }
  return /\.(webm|mp4|mov)(?:[?&]|$)/i.test(decoded);
}

export const galleryModel = (render) => render.workflow_name || render.workflow_type || "Unknown model";

export function browseGallery(renders, { search = "", model = "all", media = "all", sort = "newest", album = "all", showQc = true } = {}) {
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = renders.filter((render) => {
    const output = galleryOutput(render);
    if (!output || (!showQc && render.anatomy_guard_status === "failed")) return false;
    if (album !== "all" && (album === "unfiled" ? !!render.album : render.album !== album)) return false;
    if (model !== "all" && galleryModel(render) !== model) return false;
    if (media !== "all" && (media === "video") !== galleryIsVideo(output)) return false;
    const text = [render.id, render.prompt_positive, render.album, galleryModel(render), render.character_name,
      render.character_id, render.shoot_id, render.seed_used, render.operation].filter((value) => value != null).join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
  const timestamp = (render) => Date.parse(render.created_at) || 0;
  return filtered.sort((a, b) => {
    if (sort === "model") return galleryModel(a).localeCompare(galleryModel(b)) || timestamp(b) - timestamp(a) || String(b.id).localeCompare(String(a.id));
    const order = timestamp(a) - timestamp(b) || String(a.id).localeCompare(String(b.id));
    return sort === "oldest" ? order : -order;
  });
}

export function galleryRefreshInterval(renders = []) {
  return renders.some((render) => ["queued", "dispatching", "running"].includes(render.status)) ? 2000 : 5000;
}
