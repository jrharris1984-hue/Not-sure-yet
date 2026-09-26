import { Gauge, Zap, Sparkles } from "lucide-react";
import { QUALITY_TIERS, getRenderRecipe, recipeSummary } from "@/lib/renderRecipes";

const ICONS = { draft: Zap, balanced: Gauge, quality: Sparkles };

export default function RenderRecipeSelector({ compiler, value, onChange }) {
  return (
    <section className="pane overflow-hidden" data-testid="render-recipe-selector">
      <div className="border-b hairline px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="section-label">Render quality</div>
        <p className="mt-1 text-[11px] text-zinc-500">Settings are matched to the selected workflow. You can still adjust the detailed controls afterward.</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3">
        {QUALITY_TIERS.map((tier) => {
          const recipe = getRenderRecipe(compiler, tier.id);
          const Icon = ICONS[tier.id];
          const selected = value === tier.id;
          return (
            <button key={tier.id} type="button" onClick={() => onChange(tier.id)}
              data-testid={`render-recipe-${tier.id}`}
              className={`min-w-0 rounded-xl border p-2 sm:p-2.5 text-left transition-colors ${selected
                ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
                : "hairline bg-elevated text-zinc-400 hover:bg-white/5"}`}>
              <Icon className={`mb-1.5 sm:mb-2 h-4 w-4 ${selected ? "text-amber-300" : "text-zinc-500"}`} />
              <div className="text-xs font-bold">{tier.label}</div>
              <div className="mt-0.5 hidden text-[9px] text-zinc-500 sm:block">{tier.description}</div>
              <div className="mt-1.5 sm:mt-2 text-[8px] sm:text-[9px] font-mono leading-relaxed text-zinc-500">{recipeSummary(recipe)}</div>
            </button>
          );
        })}
      </div>
      <div className="hidden sm:block border-t hairline px-4 py-2 text-[10px] text-zinc-500">
        {getRenderRecipe(compiler, value).note}
      </div>
    </section>
  );
}
