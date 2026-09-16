import { Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// Rough CLIP tokenizer approximation: ~1 token per 4 chars, or per word split on punctuation.
const estimateTokens = (s) => {
  if (!s) return 0;
  const words = s.split(/[\s,]+/).filter(Boolean);
  return Math.round(words.length * 1.35);
};

export default function PromptPreview({ positive, negative }) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => estimateTokens(positive), [positive]);
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
      <div className="section-label">Negative</div>
      <pre className="text-[11px] font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-zinc-400 max-h-40 overflow-y-auto">
{negative}
      </pre>
    </div>
  );
}
