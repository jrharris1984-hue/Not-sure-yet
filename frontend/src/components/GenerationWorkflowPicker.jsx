import { useId, useRef, useState } from "react";

const KIND_LABELS = { image: "Create an image", edit: "Edit an image", variation: "Image variations", video: "Image to video", text_video: "Text to video", enhance: "Enhance an image" };
const normalize = (value) => String(value || "").toLowerCase().replace(/[_-]+/g, " ").trim();

export default function GenerationWorkflowPicker({ workflows = [], value, onChange, busy = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelId = useId();
  const trigger = useRef(null);
  const selected = workflows.find((workflow) => workflow.id === value);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = workflows.filter((workflow) => {
    const text = normalize([workflow.name, KIND_LABELS[workflow.kind], workflow.description, workflow.notes].filter(Boolean).join(" "));
    return terms.every((term) => text.includes(term));
  });
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="min-w-0" data-testid="generation-workflow-picker">
    <div className="text-xs text-zinc-400">Model</div>
    <button type="button" ref={trigger} aria-label="Choose generation model" aria-expanded={open} aria-controls={panelId}
      disabled={busy} onClick={() => setOpen((current) => !current)}
      className="mt-1 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border hairline bg-elevated px-3 py-2 text-left text-sm text-white disabled:opacity-40">
      <span className="min-w-0 break-words">{selected?.name || (value ? "Current workflow is outside this list" : "Choose a model")}</span>
      <span className="shrink-0 text-xs text-cyan-300">{open ? "Close" : "Browse"}</span>
    </button>
    {selected && <p className="mt-1 text-[11px] text-zinc-500">{KIND_LABELS[selected.kind] || "Custom workflow"}</p>}
    {open && <div id={panelId} className="mt-2 space-y-2 rounded-xl border hairline bg-black/20 p-3"
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(); } }}>
      <input type="search" autoFocus aria-label="Search generation models" placeholder="Search models or workflow notes…"
        value={query} disabled={busy} onChange={(event) => setQuery(event.target.value)}
        className="min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-40" />
      <p role="status" className="text-xs text-zinc-400">{!workflows.length ? "No visible workflows. Choose which workflows to show in Settings." : !matches.length ? "No workflows match. Try another name or clear your search." : `${matches.length} available workflow${matches.length === 1 ? "" : "s"}`}</p>
      <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2" aria-label="Available generation models">
        {matches.map((workflow) => <button key={workflow.id} type="button" disabled={busy}
          aria-pressed={workflow.id === value} onClick={() => { onChange(workflow.id); close(); }}
          className={`min-h-16 rounded-xl border px-3 py-2 text-left disabled:opacity-40 ${workflow.id === value ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "hairline text-zinc-200 hover:border-cyan-400/40"}`}>
          <span className="block break-words text-xs font-semibold">{workflow.name}</span>
          <span className="mt-1 block text-[11px] text-zinc-400">{KIND_LABELS[workflow.kind] || "Custom workflow"}{workflow.id === value ? " · Selected" : ""}</span>
          {workflow.description && <span className="mt-1 block line-clamp-2 text-[11px] text-zinc-500">{workflow.description}</span>}
        </button>)}
      </div>
    </div>}
    {(selected?.description || selected?.notes) && <details className="mt-2 text-xs text-zinc-400">
      <summary className="min-h-8 cursor-pointer py-1 text-cyan-300">About this workflow</summary>
      <p className="mt-1 break-words leading-relaxed">{selected.description || selected.notes}</p>
    </details>}
  </div>;
}
