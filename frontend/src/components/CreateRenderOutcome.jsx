import RenderSetupDetails from '@/components/RenderSetupDetails';
import { galleryIsVideo } from "@/lib/galleryBrowse";

const failedStatuses = ["failed", "offline", "cancelled"];
const statusMessages = {
  queued: "Waiting for ComfyUI to start this render.",
  running: "ComfyUI is creating your result. It will appear here when ready.",
  rendering: "ComfyUI is creating your result. It will appear here when ready.",
  done: "Saved in Gallery. Choose what to do next.",
  failed: "This render could not finish. Check the error below before trying again.",
  offline: "ComfyUI is offline. Reconnect it before trying again.",
  cancelled: "This render was cancelled.",
};

export default function CreateRenderOutcome({ render, batch = [], mediaUrl = (url) => url,
  onSelect, onNewSeed, onEdit, onAnimate, onGallery, onDownload, showMedia=true,
  canEdit = false, canAnimate = false, busy = "" }) {
  if (!render) return null;
  const output = render.output_files?.[0];
  const done = render.status === "done" && !!output;
  const isVideo = galleryIsVideo(output || "");
  const pending = !["done", ...failedStatuses].includes(render.status);
  const completed = batch.filter((item) => item.status === "done" && item.output_files?.[0]);
  const buttonClass = "min-h-11 rounded-lg border hairline px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40";
  return <section className="space-y-3 border-t hairline pt-4" data-testid="create-render-outcome" aria-label="Latest render">
    <div role="status" aria-live="polite" aria-atomic="true">
      <h3 className="text-sm font-bold text-zinc-100">{done ? "Your result is ready" : `Render · ${render.status || "pending"}`}</h3>
      <p className="mt-1 text-xs text-zinc-400">{statusMessages[render.status] || "Checking render status…"}</p>
      {pending && render.queue_position > 0 && <p className="mt-1 text-xs text-cyan-300">Queue position #{render.queue_position}</p>}
      {render.status === "done" && !output && <p className="mt-1 text-xs text-amber-300">No output file was returned. Check the render in Gallery.</p>}
    </div>
    {render.error && <p className="break-words text-xs text-rose-300">{render.error}</p>}
    {batch.length > 1 && <p className="text-xs text-zinc-400">{completed.length} of {batch.length} results ready{batch.some((item) => failedStatuses.includes(item.status)) ? ` · ${batch.filter((item) => failedStatuses.includes(item.status)).length} failed or stopped` : ""}</p>}
    {done && <>
      {showMedia && <div className="overflow-hidden rounded-xl border hairline bg-black/25">
        {isVideo ? <video src={mediaUrl(output)} controls playsInline className="max-h-96 w-full object-contain" />
          : <img src={mediaUrl(output)} alt="Latest finished render" className="max-h-96 w-full object-contain" />}
      </div>}
      {completed.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Finished batch results">
        {completed.map((item, index) => <button type="button" key={item.id || item.render_id}
          onClick={() => onSelect(item)} disabled={!!busy} aria-label={`Select result ${index + 1}`}
          aria-pressed={(item.id || item.render_id) === (render.id || render.render_id)}
          className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border disabled:opacity-40 ${(item.id || item.render_id) === (render.id || render.render_id) ? "border-cyan-400 ring-1 ring-cyan-400" : "hairline"}`}>
          {galleryIsVideo(item.output_files[0]) ? <span className="text-xs">Video {index + 1}</span>
            : <img src={mediaUrl(item.output_files[0])} alt={`Result ${index + 1}`} className="h-full w-full object-cover" />}
        </button>)}
      </div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={onNewSeed} disabled={!!busy}>{busy === "variation" ? "Queueing…" : "Try a new seed"}</button>
        {!isVideo && <>
          <button type="button" className={buttonClass} onClick={onEdit} disabled={!!busy || !canEdit}>{busy === "edit" ? "Loading…" : "Edit image"}</button>
          <button type="button" className={buttonClass} onClick={onAnimate} disabled={!!busy || !canAnimate}>{busy === "animate" ? "Loading…" : "Animate"}</button>
        </>}
        <button type="button" className={buttonClass} onClick={() => onDownload(output)} disabled={!!busy}>Download</button>
      </div>
      <RenderSetupDetails key={render.id || render.render_id} render={render} compare={!isVideo} />
      <p className="text-xs text-zinc-500">New seed reuses this render’s saved recipe with a different seed.</p>
      {!isVideo && (!canEdit || !canAnimate) && <p className="text-xs text-zinc-500">Add {!canEdit && !canAnimate ? "image-edit and image-to-video workflows" : !canEdit ? "an image-edit workflow" : "an image-to-video workflow"} in Settings to enable more actions.</p>}
    </>}
    <button type="button" className={buttonClass} onClick={onGallery} disabled={!!busy}>Open in Gallery</button>
  </section>;
}
