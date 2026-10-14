export default function DesktopEditingDock({ sections, activeSection, onSection, onFinish, finishLabel = 'Review' }) {
  const index = sections.findIndex(section => section.key === activeSection);
  if (index < 0) return null;
  const previous = sections[index - 1], next = sections[index + 1];
  return <nav aria-label="Desktop editing navigation" data-testid="desktop-editing-dock"
    className="fixed inset-x-6 bottom-4 z-30 mx-auto hidden max-w-[900px] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#12141C]/95 p-3 shadow-2xl backdrop-blur md:flex">
    <button type="button" disabled={!previous} onClick={() => onSection(previous.key)}
      className="rounded-lg px-3 py-2 text-xs text-zinc-200 disabled:opacity-30">Back{previous ? `: ${previous.title}` : ''}</button>
    <span className="min-w-0 text-center text-xs text-zinc-400"><span className="block truncate font-semibold text-white">{sections[index].title}</span>{index + 1} of {sections.length}</span>
    <button type="button" onClick={() => next ? onSection(next.key) : onFinish()}
      className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-black">{next ? `Next: ${next.title}` : finishLabel}</button>
  </nav>;
}
