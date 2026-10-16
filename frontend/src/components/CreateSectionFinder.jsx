import { useMemo, useRef, useState } from "react";
import { matchesSection } from "@/lib/sectionSearch";

export default function CreateSectionFinder({ sections = [], stages = [], activeSection, onSection }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef(null);
  const results = useMemo(() => sections.filter((section) => {
    const stage = stages.find((item) => item.sections.includes(section.key));
    return matchesSection(section, query, stage?.title);
  }), [sections, stages, query]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="mt-4 rounded-xl border hairline bg-black/15" data-testid="create-section-finder">
    <button ref={trigger} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
      className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-semibold text-cyan-200">
      Find a setting <span className="text-zinc-400">{open ? "Close" : "Search all sections"}</span>
    </button>
    {open && <div className="border-t hairline p-3" onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
    }}>
      <input autoFocus type="search" aria-label="Find a creation setting" placeholder="Try hair color, lighting, or outfit…"
        value={query} onChange={(event) => setQuery(event.target.value)}
        className="min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-sm text-white focus:border-cyan-400 focus:outline-none" />
      <p className="mt-2 text-xs text-zinc-400" role="status">{results.length ? `${results.length} matching sections. Choose one to edit.` : "No sections found. Try a shorter setting name or clear your search."}</p>
      <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
        {results.map((section) => <button type="button" key={section.key} aria-pressed={activeSection === section.key}
          onClick={() => { setOpen(false); onSection(section.key); }}
          className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-semibold ${activeSection === section.key ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "hairline text-zinc-300 hover:border-cyan-400/40"}`}>
          {section.title}
          <span className="mt-1 block text-[11px] font-normal text-zinc-500">{stages.find((stage) => stage.sections.includes(section.key))?.title}</span>
        </button>)}
      </div>
    </div>}
  </div>;
}
