import { AlertTriangle, CheckCircle2, LockKeyhole, Target } from "lucide-react";

export default function PromptAlignmentCard({ analysis, priorityPlan, mode = "simple" }) {
  if (!analysis) return null;

  const must = priorityPlan?.mustMatch || [];
  const important = priorityPlan?.important || [];
  const droppedImportant = analysis.droppedImportantCount || 0;
  const strong = analysis.alignmentScore >= 90;
  const review = analysis.alignmentScore < 75;

  return (
    <section className="pane overflow-hidden" data-testid="prompt-alignment-card">
      <div className="flex items-start gap-3 px-3 py-3">
        <div className={
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl border "
          + (strong
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : review
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
              : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200")
        }>
          {strong ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="section-label">Prompt alignment</div>
              <div className="mt-0.5 text-sm font-semibold text-zinc-100">{analysis.alignmentLabel}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-zinc-200">{analysis.alignmentScore}%</div>
              <div className="text-[9px] text-zinc-600">alignment</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded-md border hairline bg-black/10 px-2 py-1 text-zinc-400">
              {analysis.mustCount || 0} must match
            </span>
            <span className="rounded-md border hairline bg-black/10 px-2 py-1 text-zinc-400">
              {analysis.importantCount || 0} important
            </span>
            {droppedImportant > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/[0.06] px-2 py-1 text-amber-200">
                <AlertTriangle className="h-3 w-3" /> {droppedImportant} trimmed
              </span>
            )}
          </div>
        </div>
      </div>

      {must.length > 0 && (
        <div className="border-t hairline px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600">
            <LockKeyhole className="h-3.5 w-3.5" /> Must match
          </div>
          <div className="flex flex-wrap gap-1.5">
            {must.slice(0, mode === "advanced" ? 10 : 4).map((item) => (
              <span key={item.key} className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-2 py-1 text-[10px] text-zinc-300">
                {item.label}: {item.value}
              </span>
            ))}
            {must.length > (mode === "advanced" ? 10 : 4) && (
              <span className="rounded-md border hairline px-2 py-1 text-[10px] text-zinc-500">
                +{must.length - (mode === "advanced" ? 10 : 4)} more
              </span>
            )}
          </div>
        </div>
      )}

      {mode === "advanced" && important.length > 0 && (
        <div className="border-t hairline px-3 py-2.5">
          <div className="mb-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600">Important details</div>
          <div className="flex flex-wrap gap-1.5">
            {important.slice(0, 12).map((item) => (
              <span key={item.key} className="rounded-md border hairline px-2 py-1 text-[10px] text-zinc-500">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
