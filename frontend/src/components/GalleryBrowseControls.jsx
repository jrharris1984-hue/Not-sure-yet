export default function GalleryBrowseControls({ value, onChange, models, onRefresh, refreshing, matches, total }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const active = value.search || value.model !== "all" || value.media !== "all" || value.sort !== "newest";
  return <section className="pane p-3 sm:p-4 space-y-3" aria-label="Browse Gallery">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <label className="col-span-2 lg:col-span-1 text-xs text-zinc-400">Search
        <input type="search" aria-label="Search Gallery" value={value.search} onChange={(event) => set("search", event.target.value)}
          placeholder="Prompt, model, album, seed, or render ID"
          className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2.5 text-sm text-zinc-100" />
      </label>
      <label className="text-xs text-zinc-400">Model
        <select aria-label="Filter Gallery model" value={value.model} onChange={(event) => set("model", event.target.value)}
          className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2.5 text-sm text-zinc-100">
          <option value="all">All models</option>
          {models.map((model) => <option key={model} value={model}>{model}</option>)}
        </select>
      </label>
      <label className="text-xs text-zinc-400">Media
        <select aria-label="Filter Gallery media" value={value.media} onChange={(event) => set("media", event.target.value)}
          className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2.5 text-sm text-zinc-100">
          <option value="all">Images and videos</option><option value="image">Images</option><option value="video">Videos</option>
        </select>
      </label>
      <label className="text-xs text-zinc-400">Sort
        <select aria-label="Sort Gallery" value={value.sort} onChange={(event) => set("sort", event.target.value)}
          className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2.5 text-sm text-zinc-100">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="model">Model</option>
        </select>
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
      <span role="status">{matches} matching · {total} with media</span>
      {active && <button type="button" onClick={() => onChange({ search: "", model: "all", media: "all", sort: "newest" })}
        className="text-cyan-300">Clear search & filters</button>}
      <button type="button" onClick={onRefresh} disabled={refreshing}
        className="ml-auto rounded-lg border hairline px-3 py-2 text-zinc-200 disabled:opacity-40">
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  </section>;
}
