import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Images,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { QUALITY_TIERS, getRenderRecipe, recipeSummary } from "@/lib/renderRecipes";

const QUALITY_ICONS = { draft: Zap, balanced: Gauge, quality: Sparkles };

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b hairline py-2.5 last:border-b-0">
      <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">{label}</span>
      <span className="min-w-0 text-right text-[11px] leading-relaxed text-zinc-300">{value}</span>
    </div>
  );
}

export default function MobileCreateReview({
  workflow,
  compiler,
  family = "image",
  qualityTier,
  onQualityTier,
  renderCount = 1,
  onRenderCount,
  summaries = {},
  issues = [],
  mode = "simple",
  onRequestAdvanced,
}) {
  const ready = issues.length === 0;

  return (
    <section className="md:hidden space-y-3" data-testid="mobile-create-review">
      <div className={`pane overflow-hidden border ${ready ? "border-emerald-500/30" : "border-amber-500/30"}`}>
        <div className={`flex items-start gap-3 px-3 py-3 ${ready ? "bg-emerald-500/[0.06]" : "bg-amber-500/[0.06]"}`}>
          <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
            ready ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}>
            {ready ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold text-zinc-100">
              {ready ? "Ready to create" : "Almost ready"}
            </div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              {ready
                ? "Your main choices are set. Pick quality and quantity, then render."
                : "Finish the item below before rendering."}
            </div>
          </div>
        </div>

        {!ready && (
          <div className="border-t hairline px-3 py-2.5">
            {issues.slice(0, 3).map((issue) => (
              <div key={issue} className="flex items-start gap-2 py-1 text-[11px] text-amber-200">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pane overflow-hidden" data-testid="mobile-create-summary">
        <div className="flex items-center gap-2 border-b hairline px-3 py-2.5">
          <Layers3 className="h-4 w-4 text-amber-300" />
          <div>
            <div className="text-xs font-bold text-zinc-200">Final review</div>
            <div className="text-[9px] text-zinc-600">The choices that matter most for this render</div>
          </div>
        </div>
        <div className="px-3">
          <SummaryRow label="Character" value={summaries.character} />
          <SummaryRow label="Scene" value={summaries.scene} />
          <SummaryRow label="Fine tune" value={summaries.fineTune} />
          <SummaryRow label="Workflow" value={workflow?.name || "No workflow selected"} />
        </div>
      </div>

      <div className="pane overflow-hidden" data-testid="mobile-create-quality">
        <div className="border-b hairline px-3 py-2.5">
          <div className="text-xs font-bold text-zinc-200">Quality</div>
          <div className="mt-0.5 text-[9px] text-zinc-600">Choose how much time and detail you want.</div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2.5">
          {QUALITY_TIERS.map((tier) => {
            const recipe = getRenderRecipe(compiler, tier.id);
            const Icon = QUALITY_ICONS[tier.id];
            const selected = qualityTier === tier.id;
            const friendlyLabel = tier.id === "draft" ? "Fast" : tier.id === "quality" ? "Best" : "Balanced";
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onQualityTier(tier.id)}
                data-testid={`mobile-create-quality-${tier.id}`}
                className={`min-w-0 rounded-xl border px-2 py-3 text-center transition-colors ${
                  selected
                    ? "border-amber-400/70 bg-amber-500/10 text-amber-100"
                    : "hairline bg-elevated text-zinc-500"
                }`}
              >
                <Icon className={`mx-auto h-5 w-5 ${selected ? "text-amber-300" : "text-zinc-600"}`} />
                <div className="mt-1.5 text-xs font-bold">{friendlyLabel}</div>
                <div className="mt-1 text-[8px] leading-tight text-zinc-600">{recipeSummary(recipe)}</div>
              </button>
            );
          })}
        </div>
        <div className="border-t hairline px-3 py-2 text-[9px] text-zinc-600">
          {getRenderRecipe(compiler, qualityTier).note}
        </div>
      </div>

      {family === "image" && (
        <div className="pane overflow-hidden" data-testid="mobile-create-count">
          <div className="flex items-center gap-2 border-b hairline px-3 py-2.5">
            <Images className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-xs font-bold text-zinc-200">How many images?</div>
              <div className="text-[9px] text-zinc-600">Each image gets a different seed.</div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5 p-2.5">
            {[1, 2, 4, 6, 8, 10].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onRenderCount(count)}
                disabled={!ready && false}
                data-testid={`mobile-create-count-${count}`}
                className={`rounded-lg border py-2.5 text-xs font-bold transition-colors ${
                  renderCount === count
                    ? "border-cyan-400/70 bg-cyan-500/10 text-cyan-100"
                    : "hairline bg-elevated text-zinc-500"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "simple" && (
        <button
          type="button"
          onClick={onRequestAdvanced}
          className="w-full rounded-xl border border-dashed hairline bg-black/10 px-3 py-3 text-xs font-semibold text-zinc-500 hover:text-zinc-300"
          data-testid="btn-mobile-create-advanced"
        >
          <SlidersHorizontal className="mr-1.5 inline h-4 w-4" />
          Need manual workflow, prompt, LoRA, or model controls? Open Advanced Studio
        </button>
      )}
    </section>
  );
}
