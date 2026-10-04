import { browseGallery, galleryIsVideo, galleryRefreshInterval } from "./galleryBrowse";

const renders = [
  { id: "a", workflow_name: "Chroma", prompt_positive: "Woman in a blue dress", seed_used: 0, album: "Studio", created_at: "2026-10-04T12:00:00Z", output_files: ["a.png"], status: "done" },
  { id: "b", workflow_name: "Krea2", prompt_positive: "Man outdoors", album: "Travel", created_at: "2026-10-03T12:00:00Z", output_files: ["b.png"], anatomy_guard_status: "failed" },
  { id: "c", workflow_name: "WAN", prompt_positive: "Blue sky", created_at: "2026-10-02T12:00:00Z", output_files: ["/view?filename=movie%2Emp4"], status: "done" },
  { id: "d", workflow_name: "Chroma", prompt_positive: "Blue dress", created_at: "2026-10-04T13:00:00Z", output_files: [], status: "running" },
];

test("search matches all words across prompt, album, model and seed including zero", () => {
  expect(browseGallery(renders, { search: " BLUE chroma 0 " }).map((render) => render.id)).toEqual(["a"]);
  expect(browseGallery(renders, { search: "travel" }).map((render) => render.id)).toEqual(["b"]);
  expect(browseGallery(renders, { search: "blue travel" })).toEqual([]);
});
test("model, media, album and QC filters combine without admitting empty renders", () => {
  expect(browseGallery(renders, { media: "video", album: "unfiled" }).map((render) => render.id)).toEqual(["c"]);
  expect(browseGallery(renders, { model: "Krea2", showQc: false })).toEqual([]);
  expect(browseGallery(renders, { media: "image", album: "Studio" }).map((render) => render.id)).toEqual(["a"]);
});
test("sorting is deterministic and never mutates the source collection", () => {
  const snapshot = renders.slice();
  expect(browseGallery(renders, { sort: "oldest" }).map((render) => render.id)).toEqual(["c", "b", "a"]);
  expect(browseGallery(renders).map((render) => render.id)).toEqual(["a", "b", "c"]);
  expect(renders).toEqual(snapshot);
});
test("enhanced-only output remains searchable and malformed URLs do not crash browsing", () => {
  const enhanced = { id: "e", output_variants: { enhanced: ["bad%image.png"] }, prompt_positive: "saved" };
  expect(browseGallery([enhanced], { search: "saved" })).toEqual([enhanced]);
  expect(galleryIsVideo("bad%image.png")).toBe(false);
  expect(galleryIsVideo("/view?filename=film%2Ewebm&type=output")).toBe(true);
});
test("refresh is fast during generation and continues while idle to discover new jobs", () => {
  expect(galleryRefreshInterval(renders)).toBe(2000);
  expect(galleryRefreshInterval([{ status: "queued" }])).toBe(2000);
  expect(galleryRefreshInterval([{ status: "done" }])).toBe(5000);
  expect(galleryRefreshInterval()).toBe(5000);
});
