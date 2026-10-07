import { Film, Pencil, PersonStanding, ScanFace, SlidersHorizontal, Wrench } from "lucide-react";

export default function PostGenerationActions({
  onEdit,
  onPose,
  onAnimate,
  onReference,
  onBody,
  onTools,
  busy = false,
  compact = false,
}) {
  const actions = [
    { key: "edit", label: "Edit image", description: "Change or repair this image.", icon: Pencil, onClick: onEdit, testId: "post-action-edit" },
    { key: "pose", label: "New pose", description: "Keep the source while changing pose.", icon: PersonStanding, onClick: onPose, testId: "post-action-pose" },
    { key: "animate", label: "Animate", description: "Use this image as a video starting frame.", icon: Film, onClick: onAnimate, testId: "post-action-animate" },
    { key: "reference", label: "Face reference", description: "Restore character details and preserve identity.", icon: ScanFace, onClick: onReference, testId: "post-action-reference" },
    { key: "body", label: "Change body setup", description: "Return to body controls with the original setup.", icon: SlidersHorizontal, onClick: onBody, testId: "post-action-body" },
  ].filter((item) => item.onClick);

  return <section className={compact ? "space-y-2" : "pane p-3 space-y-3"} data-testid="post-generation-actions">
    {!compact && <div>
      <div className="section-label">Work on this image</div>
      <p className="mt-1 text-xs text-zinc-400">Creation is finished. Choose a tool for the next operation.</p>
    </div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {actions.map((item) => <button key={item.key} type="button" onClick={item.onClick} disabled={busy}
        data-testid={item.testId}
        className="rounded-xl border hairline bg-black/15 p-3 text-left text-zinc-200 hover:border-cyan-400/40 hover:bg-cyan-500/5 disabled:opacity-40">
        <item.icon className="h-4 w-4 text-cyan-300" />
        <span className="mt-2 block text-xs font-semibold">{item.label}</span>
        {!compact && <span className="mt-1 block text-[10px] leading-relaxed text-zinc-500">{item.description}</span>}
      </button>)}
    </div>
    {onTools && <button type="button" onClick={onTools} disabled={busy}
      data-testid="post-action-tools"
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-40">
      <Wrench className="h-4 w-4" /> Open all image & video tools
    </button>}
  </section>;
}
