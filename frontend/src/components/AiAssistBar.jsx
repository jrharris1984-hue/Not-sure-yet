import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";

export default function AiAssistBar({ dna, onApplyDna }) {
  const [text, setText] = useState("");
  const [refineText, setRefineText] = useState("");
  const [busy, setBusy] = useState("");

  const freeform = async () => {
    if (!text.trim()) return;
    setBusy("freeform");
    try {
      const res = await endpoints.aiFreeform(text.trim());
      onApplyDna(res.dna);
      toast.success("DNA filled from description");
      setText("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI freeform failed — check Venice API key in backend/.env");
    } finally {
      setBusy("");
    }
  };

  const refine = async () => {
    if (!refineText.trim()) return;
    setBusy("refine");
    try {
      const res = await endpoints.aiRefine(dna, refineText.trim());
      onApplyDna(res.dna);
      toast.success("DNA refined");
      setRefineText("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI refine failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="pane p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <div className="section-label">AI Assist · Venice</div>
      </div>

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
    </div>
  );
}
