import { Pin } from "lucide-react";
export default function PinnedSectionControls({ sections, pinned, currentSection, activeSection, onToggle, onSection, limit = 6 }) {
  const current = sections.find((section) => section.key === currentSection);
  const isPinned = pinned.includes(currentSection);
  const full = pinned.length >= limit;
  return <section className="pane space-y-2 px-3 py-2" aria-label="Pinned creation sections">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-semibold text-zinc-400">Quick access</span>
      {current && <button type="button" aria-pressed={isPinned} onClick={() => onToggle(currentSection)} disabled={full && !isPinned}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-cyan-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">
        <Pin className="h-3.5 w-3.5" />{isPinned ? "Unpin" : "Pin"} {current.title}
      </button>}
    </div>
    {!!pinned.length && <nav className="flex flex-wrap gap-2" aria-label="Quick access sections">
      {pinned.map((key) => {
        const section = sections.find((item) => item.key === key);
        if (!section) return null;
        return <button type="button" key={key} onClick={() => onSection(key)} aria-pressed={activeSection === key}
          className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold ${activeSection === key ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "hairline text-zinc-300 hover:border-cyan-400/40"}`}>
          {section.title}
        </button>;
      })}
    </nav>}
    {!pinned.length && <p className="text-[11px] text-zinc-500">Pin sections you use often for one-tap access.</p>}
    {full && current && !isPinned && <p className="text-[11px] text-zinc-500">All {limit} pin slots are in use. Open a pinned section and unpin it to make room.</p>}
  </section>;
}
