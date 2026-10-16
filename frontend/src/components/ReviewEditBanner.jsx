export default function ReviewEditBanner({ sectionTitle, onReturn }) {
  return <section className="pane flex flex-wrap items-center justify-between gap-3 border-cyan-400/30 px-4 py-3" aria-label="Editing from review">
    <div>
      <p className="text-sm font-semibold text-cyan-100">Adjusting {sectionTitle || "your setup"}</p>
      <p className="mt-1 text-xs text-zinc-400">Your changes update the setup. Return to review when you’re ready.</p>
    </div>
    <button type="button" onClick={onReturn} className="min-h-11 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-300">
      Return to review
    </button>
  </section>;
}
