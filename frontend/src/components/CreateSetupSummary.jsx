function selectedFields(dna, section) {
  return (section.fields || []).flatMap((field) => {
    const value = dna[section.key]?.[field.key];
    if (value == null || value === "" || value === "none" || value === false || value === 0) return [];
    const values = (Array.isArray(value) ? value : [value]).filter((item) =>
      ["string", "number"].includes(typeof item) && item !== "none" && item !== "");
    if (!values.length) return [];
    return [`${field.label}: ${values.map((item) => field.optionLabels?.[item] || String(item)).join(", ")}`];
  });
}

export default function CreateSetupSummary({ dna = {}, stages = [], sections = [], onSection }) {
  const sectionMap = Object.fromEntries(sections.map((section) => [section.key, section]));
  return <section className="pane p-4 sm:p-5" aria-label="Your setup" data-testid="create-setup-summary">
    <h2 className="font-display text-base font-bold text-white">Your setup</h2>
    <p className="mt-1 text-xs text-zinc-400">Review the current subject. Open a group and choose a section to edit.</p>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      {stages.filter((stage) => stage.sections.length).map((stage) => {
        const rows = stage.sections.map((key) => sectionMap[key]).filter(Boolean).map((section) => ({
          ...section, selected: selectedFields(dna, section),
        }));
        const preview = rows.flatMap((row) => row.selected);
        return <details key={stage.key} className="rounded-xl border hairline bg-black/15 p-3">
          <summary className="cursor-pointer rounded-lg text-sm font-semibold text-zinc-100 focus-visible:outline focus-visible:outline-cyan-400">
            {stage.title}
            <span className="mt-1 block truncate text-xs font-normal text-zinc-400">{preview.slice(0, 2).join(" · ") || "Use defaults or add details"}</span>
          </summary>
          <div className="mt-3 space-y-2">
            {rows.map((row) => <button key={row.key} type="button" onClick={() => onSection(row.key)}
              aria-label={`Edit ${row.title.toLowerCase()} from your setup`}
              className="flex min-h-11 w-full items-start justify-between gap-3 rounded-lg border hairline px-3 py-2 text-left hover:border-cyan-400/50 focus-visible:outline focus-visible:outline-cyan-400">
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-zinc-200">{row.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-400">{row.selected.slice(0, 3).join(" · ") || "Use defaults or add details"}</span>
                {row.selected.length > 3 && <span className="mt-1 block text-[11px] text-zinc-500">+{row.selected.length - 3} more selected details</span>}
              </span>
              <span className="shrink-0 text-xs font-semibold text-cyan-300">Edit</span>
            </button>)}
          </div>
        </details>;
      })}
    </div>
  </section>;
}
