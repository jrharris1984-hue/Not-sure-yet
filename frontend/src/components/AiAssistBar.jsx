import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { DEFAULT_DNA } from "@/lib/dna";

export default function AiAssistBar({ dna, onApplyDna, aiProvider = "AI" }) {
  const [text, setText] = useState("");
  const [refineText, setRefineText] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(null);

  const previewDraft = (suggestion, source) => {
    const changes = Object.entries(suggestion || {}).flatMap(([section, values]) =>
      DEFAULT_DNA[section] && values && typeof values === "object" && !Array.isArray(values)
        ? Object.entries(values).filter(([field, value]) => field in DEFAULT_DNA[section] && value !== null && value !== "")
          .map(([field, value]) => ({ section, field, value: section === "identity" && field === "age" ? Math.max(21, Number(value) || 21) : value, previous: dna?.[section]?.[field] }))
        : []);
    if (!changes.length) throw new Error("AI did not suggest any usable settings");
    setDraft({ suggestion, changes, source });
  };

  const freeform = async () => {
    if (!text.trim()) return;
    setBusy("freeform");
    try {
      const res = await endpoints.aiFreeform(text.trim());
      previewDraft(res.dna, "description");
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || `${aiProvider} could not generate DNA`);
    } finally {
      setBusy("");
    }
  };

  const refine = async () => {
    if (!refineText.trim()) return;
    setBusy("refine");
    try {
      const res = await endpoints.aiRefine(dna, refineText.trim());
      previewDraft(res.dna, "refinement");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI refine failed");
    } finally {
      setBusy("");
    }
  };

  const applyDraft = () => {
    if (!draft) return;
    const next = { ...dna };
    for (const { section, field, value } of draft.changes) {
      next[section] = { ...(next[section] || {}), [field]: value };
    }
    onApplyDna(next);
    toast.success(`${draft.changes.length} setting${draft.changes.length === 1 ? "" : "s"} applied. Review the prompt before rendering.`);
    setDraft(null);
    if (draft.source === "description") setText("");
    else setRefineText("");
  };

  return (
    <div className="pane p-4 space-y-3" data-testid="ai-guided-create">
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <div className="section-label flex-1">Describe it with {aiProvider}</div>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className="space-y-3 ai-assist-reveal">
      <p className="text-xs text-zinc-400">Describe the image or a change. Review the proposed settings before applying them.</p>

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono">Freeform → DNA</div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder='e.g. "curvy redhead pirate on a beach at dusk, cinematic lighting"'
          className="bg-elevated border-hairline text-zinc-100 text-sm"
          data-testid="input-ai-freeform"
        />
        <button
          onClick={freeform}
          disabled={busy === "freeform" || !text.trim()}
          data-testid="btn-ai-freeform-generate"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold px-3 py-2 transition-colors"
        >
          {busy === "freeform" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Generate DNA
        </button>
      </div>

      <div className="h-px bg-hairline" />

      {draft && <div className="space-y-2 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3" data-testid="ai-dna-preview">
        <div className="text-xs font-semibold text-cyan-100">Review {draft.changes.length} proposed settings</div>
        <div className="max-h-48 space-y-1 overflow-y-auto text-xs text-zinc-300">
          {draft.changes.map(({ section, field, value, previous }) =>
            <div key={`${section}.${field}`} className="flex gap-2 border-b border-white/5 py-1">
              <span className="min-w-[110px] text-zinc-500">{section} · {field}</span>
              <span className="break-words">{previous ? `${String(previous)} → ` : ""}{Array.isArray(value) ? value.join(", ") : String(value)}</span>
            </div>)}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={applyDraft} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-black">Apply settings</button>
          <button type="button" onClick={() => setDraft(null)} className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-300">Discard</button>
        </div>
      </div>}

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono">Refine current DNA</div>
        <Textarea
          value={refineText}
          onChange={(e) => setRefineText(e.target.value)}
          rows={2}
          placeholder='e.g. "make her older, more athletic, harsher lighting"'
          className="bg-elevated border-hairline text-zinc-100 text-sm"
          data-testid="input-ai-refine"
        />
        <button
          onClick={refine}
          disabled={busy === "refine" || !refineText.trim()}
          data-testid="btn-ai-refine"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 text-sm font-semibold px-3 py-2 transition-colors"
        >
          {busy === "refine" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Apply Refine
        </button>
      </div>
      </div>}
    </div>
  );
}
