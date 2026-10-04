import { useState } from "react";

export default function ImageRecoveryPanel({ busy = false, onRecover }) {
  const [mode, setMode] = useState("");
  const [strength, setStrength] = useState(0.22);
  const [targets, setTargets] = useState(["hands"]);
  const [instruction, setInstruction] = useState("");
  const repair = mode === "anatomy_repair";
  const choose = (next) => {
    setMode(next);
    setStrength(next === "anatomy_repair" ? 0.35 : 0.22);
    setInstruction("");
  };
  return (
    <section className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 space-y-3" data-testid="image-recovery-panel">
      <div>
        <div className="text-xs font-bold text-cyan-100">Work from this image</div>
        <p className="mt-1 text-[11px] text-zinc-400">Create a new version from the displayed image. Your original stays in the Gallery.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["small_variation", "Small variation"], ["anatomy_repair", "Fix anatomy"]].map(([value, label]) => (
          <button key={value} type="button" disabled={busy} aria-pressed={mode === value}
            onClick={() => choose(value)} data-testid={`recovery-${value}`}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${mode === value ? "border-cyan-400 bg-cyan-500/15 text-cyan-100" : "hairline text-zinc-300"}`}>
            {label}
          </button>
        ))}
      </div>
      {mode && <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (!busy && (!repair || targets.length)) onRecover({ mode, strength, targets: repair ? targets : [], instruction });
      }}>
        <p className="text-[11px] text-zinc-400">{repair
          ? "Qwen repairs the selected areas using instructions. Nearby details may change; this tool does not use a masked selection."
          : "Chroma starts from the source pixels with a low change amount. Identity and small details may still vary."}</p>
        {repair && <fieldset disabled={busy} className="space-y-2">
          <legend className="text-xs text-zinc-300">Areas to repair</legend>
          <div className="flex flex-wrap gap-3">
            {["face", "hands", "feet", "limbs"].map((target) => <label key={target} className="flex items-center gap-1.5 text-xs capitalize text-zinc-300">
              <input type="checkbox" checked={targets.includes(target)} onChange={(event) => setTargets((current) =>
                event.target.checked ? [...current, target] : current.filter((item) => item !== target))} /> {target}
            </label>)}
          </div>
        </fieldset>}
        <label className="block text-xs text-zinc-300">
          {repair ? "Repair strength" : "Variation amount"} · {Math.round(strength * 100)}%
          <input aria-label={repair ? "Repair strength" : "Variation amount"} type="range" min={repair ? 0.2 : 0.05}
            max={repair ? 0.85 : 0.35} step="0.01" value={strength} disabled={busy}
            onChange={(event) => setStrength(Number(event.target.value))} className="mt-2 block w-full accent-cyan-400" />
          <span className="mt-1 block text-[10px] text-zinc-500">Lower keeps the source closer. Higher permits more reconstruction.</span>
        </label>
        <label className="block text-xs text-zinc-300">{repair ? "Describe the defect · optional" : "Describe a small change · optional"}
          <textarea rows={2} maxLength={2000} disabled={busy} value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-xs text-zinc-100" />
        </label>
        <button type="submit" disabled={busy || (repair && !targets.length)} data-testid="recovery-submit"
          className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-40">
          {busy ? "Preparing new version…" : repair ? "Generate repair" : "Generate small variation"}
        </button>
      </form>}
    </section>
  );
}
