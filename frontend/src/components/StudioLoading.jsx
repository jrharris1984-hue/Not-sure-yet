export default function StudioLoading({ label = "Loading studio…", cards = 6 }) {
  const count = Math.max(0, Math.min(12, Number.isFinite(Number(cards)) ? Math.floor(Number(cards)) : 6));
  return <div role="status" aria-busy="true" aria-live="polite" className="studio-loading space-y-4" data-testid="studio-loading">
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <span className="studio-loading-dot h-2 w-2 rounded-full" aria-hidden="true" />
      <span>{label}</span>
    </div>
    {count > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <div key={index} className="studio-skeleton pane aspect-[4/3]" />)}
    </div>}
  </div>;
}
