import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PromptPreview({ positive, negative }) {
  const [copied, setCopied] = useState(false);
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
        <button
          onClick={copy}
          data-testid="btn-copy-prompt"
          className="inline-flex items-center gap-1.5 rounded-md border hairline px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-xs font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-amber-100/90 min-h-[80px]">
{positive || "— fill the DNA form to build a prompt —"}
      </pre>
      <div className="section-label">Negative</div>
      <pre className="text-[11px] font-mono leading-relaxed bg-elevated rounded-lg p-3 border hairline whitespace-pre-wrap break-words text-zinc-400">
{negative}
      </pre>
    </div>
  );
}
