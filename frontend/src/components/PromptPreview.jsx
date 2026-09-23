import { Copy, Check, ShieldCheck, Wand2, Undo2, AlertTriangle, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { analyzePromptQuality, estimatePromptTokens } from "@/lib/promptQuality";

export default function PromptPreview({ positive, negative, dna, workflow, context, optimized, improving, onImprove, onOptimize, onRestore }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tokens = useMemo(() => estimatePromptTokens(positive), [positive]);
  const quality = useMemo(
    () => analyzePromptQuality({ positive, dna, workflow, context }),
    [positive, dna, workflow, context]
  );
  const lengthIssue = quality.issues.find((item) => item.code === "length");
  const hasBlockingIssue = quality.blockers.length > 0;
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
              lengthIssue?.severity === "error" ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : lengthIssue ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
            }`}
            title={`Estimated length for ${quality.profileLabel}`}
          >
            ~{tokens} tok · {quality.profileLabel}
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
      <button type="button" onClick={() => setExpanded((value) => !value)}
        className="w-full rounded-lg border hairline bg-elevated p-3 text-left" data-testid="btn-toggle-prompt-details">
        <div className="flex items-start gap-2">
          <span className="flex-1 text-xs font-mono leading-relaxed text-amber-100/90 line-clamp-3">
            {positive || "— fill the DNA form to build a prompt —"}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
        <div className="mt-2 text-[10px] text-zinc-500">{expanded ? "Hide full prompts" : "Show and edit full prompts"}</div>
      </button>
      {expanded && (
        <div className="space-y-3" data-testid="prompt-expanded-details">
          <pre className="text-xs font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-amber-100/90 max-h-72 overflow-y-auto">
{positive}
          </pre>
          <div className="section-label">Negative</div>
          <pre className="text-[11px] font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-zinc-400 max-h-40 overflow-y-auto">
{negative}
          </pre>
        </div>
      )}
      <div className="rounded-lg border hairline bg-black/20 p-3 space-y-2" data-testid="prompt-quality-preflight">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasBlockingIssue || quality.issues.some((item) => item.severity === "error")
              ? <AlertTriangle className="h-4 w-4 text-red-300" />
              : <ShieldCheck className="h-4 w-4 text-emerald-300" />}
            <span className="text-xs font-semibold text-zinc-200">Generation preflight</span>
            <span className={`text-[10px] font-mono ${hasBlockingIssue ? "text-red-300" : "text-zinc-500"}`}>
              {hasBlockingIssue ? "Not ready" : `${quality.score}/100`} · {quality.profileLabel}
            </span>
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
            {quality.issues.slice(0, 6).map((item) => (
              <li key={item.code} className={`text-[10px] leading-relaxed ${item.severity === "error" ? "text-red-300" : item.severity === "warning" ? "text-amber-200" : "text-zinc-400"}`}>
                {item.message}
              </li>
            ))}
          </ul>
        ) : <div className="text-[10px] text-emerald-300">Ready to render. No obvious conflicts or missing requirements detected.</div>}
      </div>
    </div>
  );
}
