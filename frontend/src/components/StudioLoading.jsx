export default function StudioLoading({ label = "Loading studio…", cards = 6 }) {
  return <div role="status" aria-busy="true" className="space-y-4" data-testid="studio-loading">
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <span className="studio-loading-dot h-2 w-2 rounded-full bg-cyan-300" aria-hidden="true" />{label}
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => <div key={index} className="studio-skeleton pane aspect-[4/3]" />)}
    </div>
  </div>;
}
