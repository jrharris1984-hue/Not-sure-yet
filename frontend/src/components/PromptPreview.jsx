import { Copy, Check, ShieldCheck, Wand2, Undo2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { analyzePromptQuality, estimatePromptTokens } from "@/lib/promptQuality";

// Rough CLIP tokenizer approximation: ~1 token per 4 chars, or per word split on punctuation.
export default function PromptPreview({ positive, negative, dna, workflow, optimized, improving, onImprove, onOptimize, onRestore }) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => estimatePromptTokens(positive), [positive]);
  const quality = useMemo(() => analyzePromptQuality({ positive, dna, workflow }), [positive, dna, workflow]);
  const overClip = tokens > 77;
  const overFlux = tokens > 512;
  const copy = () => {
    navigator.clipboard.writeText(positive || "");
    setCopied(true);
    toast.success("Prompt copied");
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="pane p-4 space-y-3" data-testid="prompt-string-preview">
      <div className="flex items-center justify-between">
        <div className="section-label">Prompt String</div>
        <div className="flex items-center gap-2">
          <span
            data-testid="prompt-token-count"
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              overFlux ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : overClip ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
            }`}
            title={overClip ? "Over CLIP 77-token limit — early tokens carry most weight" : "Within CLIP window"}
          >
            ~{tokens} tok {overFlux ? "· FLUX cap" : overClip ? "· CLIP+" : "· CLIP-fit"}
          </span>
          <button
            onClick={onImprove}
            disabled={improving || !positive}
            data-testid="btn-venice-improve-prompt"
            className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
            title="Ask Venice to improve the compiled positive and negative prompts without changing selected DNA"
          >
            {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{improving ? "Improving…" : "Improve with Venice"}</span>
            <span className="sm:hidden">Venice</span>
          </button>
          <button
            onClick={copy}
            data-testid="btn-copy-prompt"
            className="inline-flex items-center gap-1.5 rounded-md border hairline px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="text-xs font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-amber-100/90 min-h-[80px]">
{positive || "— fill the DNA form to build a prompt —"}
      </pre>
      <div className="rounded-lg border hairline bg-black/20 p-3 space-y-2" data-testid="prompt-quality-preflight">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {quality.issues.some((issue) => issue.severity === "error")
              ? <AlertTriangle className="h-4 w-4 text-red-300" />
              : <ShieldCheck className="h-4 w-4 text-emerald-300" />}
            <span className="text-xs font-semibold text-zinc-200">Prompt quality</span>
            <span className="text-[10px] font-mono text-zinc-500">{quality.score}/100 · {quality.profileLabel}</span>
          </div>
          {optimized ? (
            <button onClick={onRestore} className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white" data-testid="btn-restore-generated-prompt">
              <Undo2 className="h-3.5 w-3.5" /> Restore
            </button>
          ) : quality.canAutoFix ? (
            <button onClick={() => onOptimize?.(quality.cleaned)} className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20" data-testid="btn-optimize-prompt">
              <Wand2 className="h-3.5 w-3.5" /> Clean safely
            </button>
          ) : null}
        </div>
        {optimized && <div className="text-[10px] text-emerald-300">Safe cleanup is active and will be sent to ComfyUI.</div>}
        {quality.issues.length ? (
          <ul className="space-y-1">
            {quality.issues.slice(0, 4).map((issue) => (
              <li key={issue.code} className={`text-[10px] leading-relaxed ${issue.severity === "error" ? "text-red-300" : issue.severity === "warning" ? "text-amber-200" : "text-zinc-400"}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : <div className="text-[10px] text-emerald-300">No obvious prompt conflicts or dilution detected.</div>}
      </div>
      <div className="section-label">Negative</div>
      <pre className="text-[11px] font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-zinc-400 max-h-40 overflow-y-auto">
{negative}
      </pre>
    </div>
  );
}
