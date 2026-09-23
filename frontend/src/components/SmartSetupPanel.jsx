import { useMemo, useState } from "react";
import { BrainCircuit, ShieldCheck, WandSparkles, AlertTriangle } from "lucide-react";
import { inferGenerationTarget, recommendSmartSetup } from "@/lib/smartGeneration";

const TARGETS = [
  ["still", "New image"], ["edit", "Edit image"], ["animate", "Animate"], ["text_video", "Text video"], ["face", "Face preserve"],
];

export default function SmartSetupPanel({ workflows, activeWorkflow, dna, subjectCount, hasReference, onApply }) {
  const [target, setTarget] = useState(() => inferGenerationTarget(activeWorkflow));
  const recommendation = useMemo(() => recommendSmartSetup({ workflows, target, dna, subjectCount, hasReference }),
    [workflows, target, dna, subjectCount, hasReference]);

  return (
    <section className="pane overflow-hidden" data-testid="smart-setup-panel">
      <div className="flex items-center gap-2 border-b hairline px-4 py-3">
        <BrainCircuit className="h-4 w-4 text-cyan-300" />
        <div>
          <div className="section-label">Smart setup</div>
          <p className="mt-0.5 text-[10px] text-zinc-500">One action selects the workflow, render recipe, LoRA mode, and safety review.</p>
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TARGETS.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTarget(value)}
              className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${target === value ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100" : "hairline text-zinc-500"}`}
              data-testid={`smart-target-${value}`}>{label}</button>
          ))}
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px]">
          <div className="font-bold text-cyan-100">{recommendation.workflowName}</div>
          <div className="mt-1 grid grid-cols-2 gap-1 text-zinc-400">
            <span>Quality: {recommendation.qualityTier}</span>
            <span>LoRAs: {recommendation.loraMode}</span>
            <span className="col-span-2 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-300" /> Anatomy review {recommendation.anatomyReview ? "enabled" : "workflow-specific"}</span>
          </div>
          {recommendation.warnings.map((warning) => <div key={warning} className="mt-2 flex gap-1 text-amber-200"><AlertTriangle className="h-3 w-3 shrink-0" />{warning}</div>)}
        </div>
        <button type="button" onClick={() => onApply(recommendation)} disabled={!recommendation.workflowId}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2.5 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-40"
          data-testid="btn-apply-smart-setup">
          <WandSparkles className="h-4 w-4" /> Apply smart setup
        </button>
      </div>
    </section>
  );
}
