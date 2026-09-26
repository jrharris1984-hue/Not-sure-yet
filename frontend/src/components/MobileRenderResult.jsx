import {
  Check,
  Download,
  Film,
  Images,
  Pencil,
  Shuffle,
  UserRound,
} from "lucide-react";

const renderId = (render) => render?.render_id || render?.id;
const isVideoOutput = (url = "") => /\.(webm|mp4|mov)(?:[?&]|$)/i.test(decodeURIComponent(url));

export default function MobileRenderResult({
  render,
  batch = [],
  selectedId,
  onSelect,
  onKeep,
  onVariation,
  onEdit,
  onAnimate,
  onBackCharacter,
  onGallery,
  onDownload,
  busy = "",
}) {
  const output = render?.output_files?.[0];
  if (!render || render.status !== "done" || !output) return null;

  const completedBatch = batch.filter((item) => item.status === "done" && item.output_files?.[0]);
  const showBatch = completedBatch.length > 1;
  const isVideo = isVideoOutput(output);

  return (
    <section className="md:hidden space-y-3" data-testid="mobile-render-result">
      <div className="pane overflow-hidden border border-emerald-500/25">
        <div className="flex items-center gap-3 border-b hairline bg-emerald-500/[0.06] px-3 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <Check className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold text-zinc-100">Render complete</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              It is already saved in Gallery. Choose what you want to do next.
            </div>
          </div>
        </div>

        <div className="bg-black/25">
          {isVideo ? (
            <video
              src={output}
              controls
              autoPlay
              playsInline
              loop
              className="max-h-[62dvh] w-full object-contain"
              data-testid="mobile-render-result-video"
            />
          ) : (
            <img
              src={output}
              alt="Finished render"
              className="max-h-[62dvh] w-full object-contain"
              data-testid="mobile-render-result-image"
            />
          )}
        </div>

        {showBatch && (
          <div className="border-t hairline px-3 py-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
              <Images className="h-3.5 w-3.5" /> Results
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-fade">
              {completedBatch.map((item, index) => {
                const id = renderId(item);
                const selected = item.id === selectedId || id === selectedId || renderId(render) === id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border ${
                      selected ? "border-emerald-400 ring-1 ring-emerald-400/60" : "hairline"
                    }`}
                    data-testid={`mobile-render-result-${index + 1}`}
                  >
                    {isVideoOutput(item.output_files[0])
                      ? <video src={item.output_files[0]} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      : <img src={item.output_files[0]} alt={`Result ${index + 1}`} className="h-full w-full object-cover" />}
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[8px] text-white">{index + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pane p-2.5 space-y-2" data-testid="mobile-render-next-actions">
        <button
          type="button"
          onClick={onKeep}
          disabled={!!busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-bold text-black disabled:opacity-40"
          data-testid="btn-mobile-result-keep"
        >
          <Check className="h-4 w-4" /> Keep this one
        </button>

        <div className={`grid ${isVideo ? "grid-cols-1" : "grid-cols-3"} gap-2`}>
          <button
            type="button"
            onClick={onVariation}
            disabled={!!busy}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] px-2 py-3 text-[10px] font-semibold text-violet-100 disabled:opacity-40"
            data-testid="btn-mobile-result-variation"
          >
            <Shuffle className="h-4 w-4" />
            {busy === "variation" ? "Queueing…" : "Variation"}
          </button>
          {!isVideo && <button
            type="button"
            onClick={onEdit}
            disabled={!!busy}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.06] px-2 py-3 text-[10px] font-semibold text-cyan-100 disabled:opacity-40"
            data-testid="btn-mobile-result-edit"
          >
            <Pencil className="h-4 w-4" />
            {busy === "edit" ? "Loading…" : "Edit"}
          </button>}
          {!isVideo && <button
            type="button"
            onClick={onAnimate}
            disabled={!!busy}
            className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-2 py-3 text-[10px] font-semibold text-amber-100 disabled:opacity-40"
            data-testid="btn-mobile-result-animate"
          >
            <Film className="h-4 w-4" />
            {busy === "animate" ? "Loading…" : "Animate"}
          </button>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onBackCharacter} disabled={!!busy}
            className="inline-flex items-center justify-center gap-1 rounded-lg border hairline px-2 py-2.5 text-[10px] font-semibold text-zinc-300 disabled:opacity-40"
            data-testid="btn-mobile-result-character">
            <UserRound className="h-3.5 w-3.5" /> Character
          </button>
          <button type="button" onClick={onGallery} disabled={!!busy}
            className="inline-flex items-center justify-center gap-1 rounded-lg border hairline px-2 py-2.5 text-[10px] font-semibold text-zinc-300 disabled:opacity-40"
            data-testid="btn-mobile-result-gallery">
            <Images className="h-3.5 w-3.5" /> Gallery
          </button>
          <button type="button" onClick={() => onDownload(output)} disabled={!!busy}
            className="inline-flex items-center justify-center gap-1 rounded-lg border hairline px-2 py-2.5 text-[10px] font-semibold text-zinc-300 disabled:opacity-40"
            data-testid="btn-mobile-result-download">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
    </section>
  );
}
