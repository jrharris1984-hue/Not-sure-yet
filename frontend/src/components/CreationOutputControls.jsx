import { QUALITY_TIERS, getRenderRecipe, recipeSummary } from "@/lib/renderRecipes";
import { Gauge, Sparkles, Zap } from "lucide-react";
import GenerationWorkflowPicker from "@/components/GenerationWorkflowPicker";
import CanvasControls from "@/components/CanvasControls";

const QUALITY_ICONS = { draft: Zap, balanced: Gauge, quality: Sparkles };

export default function CreationOutputControls({ workflows, workflowId, onWorkflow, tier, onTier,
  count, onCount, settings, onSettings, compiler, fixedSampling = false, family = "image", busy = false, countLocked = false }) {
  const workflow = workflows?.find(item => item.id === workflowId);
  const moss = workflow?.prompt_style === 'moss_image';
  const set = (key, value) => onSettings({ ...settings, [key]: value });
  return (
    <div className="space-y-3" data-testid="creation-output-controls">
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><GenerationWorkflowPicker workflows={workflows} value={workflowId} onChange={onWorkflow} busy={busy} /></div>
      </fieldset>
      {family === "image" && <CanvasControls settings={settings} onSettings={onSettings} busy={busy} />}
      <fieldset disabled={busy} className="space-y-2">
        <legend className="text-xs font-semibold text-zinc-300">Quality preset</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Generation quality">
          {QUALITY_TIERS.map((choice) => {
            const recipe = getRenderRecipe(compiler, choice.id, workflow);
            const Icon = QUALITY_ICONS[choice.id];
            const selected = tier === choice.id;
            return <button key={choice.id} type="button" onClick={() => onTier(choice.id)} disabled={busy || recipe.unavailable}
              aria-label={moss ? ({draft:'Smaller canvas',balanced:'Workflow default',quality:'Larger canvas'}[choice.id]) : `Quality: ${choice.label}`} aria-pressed={selected}
              className={`min-h-20 rounded-xl border p-3 text-left transition-colors disabled:opacity-40 ${selected ? "border-amber-400/70 bg-amber-500/10 text-amber-100" : "hairline bg-black/15 text-zinc-300 hover:border-white/30"}`}>
              <span className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4" />{moss ? ({draft:'Smaller canvas',balanced:'Workflow default',quality:'Larger canvas'}[choice.id]) : choice.label}</span>
              <span className="mt-1 block text-xs text-zinc-400">{moss ? "Workflow sampling preserved" : family === "edit" ? (choice.id === "draft" ? "Subtle change" : choice.id === "quality" ? "Stronger change" : "Balanced change") : choice.description}</span>
              {compiler && <span className="mt-2 block text-[11px] leading-relaxed text-zinc-500">{recipeSummary(recipe)}</span>}
            </button>;
          })}
        </div>
        <p className="text-[11px] text-zinc-500">{moss ? "Canvas presets use this workflow’s sampling defaults. Advanced settings remain adjustable." : "Choosing a preset applies its render settings. You can adjust available controls afterward."}</p>
      </fieldset>
      {family === "image" && <fieldset disabled={busy || countLocked} className="space-y-2">
        <legend className="text-xs font-semibold text-zinc-300">How many images?</legend>
        <div className="grid grid-cols-6 gap-2" aria-label="Image count">
          {[1, 2, 4, 6, 8, 10].map((value) => <button type="button" key={value} onClick={() => onCount(value)}
            aria-label={`${value} image${value === 1 ? "" : "s"}`} aria-pressed={count === value} disabled={busy || countLocked}
            className={`min-h-11 rounded-lg border text-sm font-bold disabled:opacity-40 ${count === value ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-100" : "hairline text-zinc-400 hover:border-white/30"}`}>
            {value}
          </button>)}
        </div>
        <p className="text-[11px] text-zinc-500">{countLocked ? "Pose Assist uses one image at a time. Turn it off to select a batch." : "Each image in a batch gets a different seed."}</p>
      </fieldset>}
      {family === "image" && <details className="rounded-xl border hairline bg-black/15 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Advanced generation settings</summary>
        <fieldset disabled={busy} className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-400">Steps
            <input aria-label="Sampling steps" type="number" min="1" max="100" value={settings.steps} disabled={fixedSampling}
              onChange={(event) => set("steps", Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50" />
          </label>
          <label className="text-xs text-zinc-400">CFG
            <input aria-label="Sampling CFG" type="number" min="0" max="30" step="0.1" value={settings.cfg} disabled={fixedSampling}
              onChange={(event) => set("cfg", Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50" />
          </label>
          <label className="col-span-2 text-xs text-zinc-400">Sampler
            <select aria-label="Sampling method" value={settings.sampler || "euler"} disabled={fixedSampling}
              onChange={(event) => set("sampler", event.target.value)}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50">
              <option value="euler">Euler</option>
              <option value="dpmpp_2m">DPM++ 2M</option>
              <option value="dpmpp_2m_sde">DPM++ 2M SDE</option>
              {settings.sampler && !["euler", "dpmpp_2m", "dpmpp_2m_sde"].includes(settings.sampler)
                && <option value={settings.sampler}>{settings.sampler}</option>}
            </select>
          </label>
          <label className="col-span-2 text-xs text-zinc-400">Seed · leave blank for a new seed
            <input aria-label="Generation seed" type="number" min="0" max="2147483647" value={settings.seed ?? ""}
              onChange={(event) => set("seed", event.target.value === "" ? "" : Math.max(0, Math.min(2147483647, Math.trunc(Number(event.target.value) || 0))))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white" />
          </label>
        </fieldset>
        {fixedSampling && <p className="mt-2 text-[11px] text-zinc-500">This distilled model uses a fixed sampling recipe. Canvas and seed remain adjustable.</p>}
      </details>}
    </div>
  );
}
