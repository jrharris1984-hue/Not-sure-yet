import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Sparkles, RotateCcw, WandSparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { endpoints } from "@/lib/api";
import { planLoras, registryForInstalled, workflowFamily } from "@/lib/loraRegistry";

const MODE_KEY = "ultra-studio-lora-planner-mode";

export default function LoraPanel({ workflowId, workflow, dna, values, onChange }) {
  const [loras, setLoras] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [installed, setInstalled] = useState([]);
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || "assisted");

  useEffect(() => {
    if (!workflowId) { setLoras([]); return; }
    let alive = true;
    endpoints.workflowLoras(workflowId).then((r) => {
      if (!alive) return;
      const list = (r.loras || []).filter((l) => !l.dedicated_likeness);
      setLoras(list);
      const d = {};
      list.forEach((l) => {
        d[l.node_id] = {
          lora_name: l.lora_name,
          strength_model: l.strength_model,
          strength_clip: l.strength_clip,
        };
      });
      setDefaults(d);
    }).catch(() => setLoras([]));
    endpoints.comfyLoras().then((r) => {
      if (alive) setInstalled(r.loras || []);
    }).catch(() => setInstalled([]));
    return () => { alive = false; };
  }, [workflowId]);

  const plan = useMemo(
    () => planLoras({ workflow: workflow || {}, dna: dna || {}, installed }),
    [workflow, dna, installed]
  );
  const recognizedCount = useMemo(() => registryForInstalled(installed).length, [installed]);

  if (!loras.length) return null;

  const cur = (nid) => values[nid] || defaults[nid] ||
    { lora_name: "", strength_model: 1, strength_clip: 1 };

  const setW = (nid, key, v) => {
    onChange({
      ...values,
      [nid]: { ...(values[nid] || defaults[nid] || {}), [key]: v },
    });
  };

  const setOptionalName = (lora, name) => {
    const current = cur(lora.node_id);
    const suggested = lora.slot_kind === "quality" ? 0.4 : lora.slot_kind === "body" ? 0.5 : 0.7;
    onChange({
      ...values,
      [lora.node_id]: {
        ...current,
        lora_name: name,
        strength_model: name && Number(current.strength_model) === 0 ? suggested : current.strength_model,
      },
    });
  };

  const reset = (nid) => {
    const next = { ...values };
    delete next[nid];
    onChange(next);
  };

  const buildPlannedOverrides = () => {
    const next = { ...values };
    const optional = loras.filter((lora) => lora.optional_slot && ["quality", "body", "action"].includes(lora.slot_kind));

    // Clear only planner-owned optional slots. Required and likeness nodes remain untouched.
    optional.forEach((lora) => {
      const base = defaults[lora.node_id] || cur(lora.node_id);
      next[lora.node_id] = { ...base, lora_name: base.lora_name, strength_model: 0 };
    });

    plan.selected.forEach((entry) => {
      const target = optional.find((lora) => lora.slot_kind === entry.slot);
      if (!target) return;
      next[target.node_id] = {
        ...(defaults[target.node_id] || cur(target.node_id)),
        lora_name: entry.installedName,
        strength_model: entry.defaultStrength,
      };
    });
    return next;
  };

  const applyPlan = () => onChange(buildPlannedOverrides());

  const changeMode = (nextMode) => {
    setMode(nextMode);
    localStorage.setItem(MODE_KEY, nextMode);
  };

  // Automatic mode continuously follows DNA changes. Compare serialized values
  // first so React does not loop when the plan is already applied.
  useEffect(() => {
    if (mode !== "automatic" || !loras.length) return;
    const next = buildPlannedOverrides();
    if (JSON.stringify(next) !== JSON.stringify(values)) onChange(next);
    // values/onChange are intentionally excluded: this effect is driven by the plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, loras, defaults, plan]);

  const family = workflowFamily(workflow || {});

  return (
    <div className="pane p-4 space-y-4" data-testid="lora-panel">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <div className="section-label">LoRA planner</div>
        <span className="text-[10px] font-mono text-zinc-500">
          {recognizedCount}/{installed.length} recognized
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border hairline bg-black/20 p-1">
        {[
          ["automatic", "Automatic"],
          ["assisted", "Assisted"],
          ["manual", "Manual"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => changeMode(key)}
            className={`rounded-md px-2 py-2 text-[10px] font-mono uppercase tracking-wide transition-colors ${
              mode === key ? "bg-amber-500/20 text-amber-300" : "text-zinc-500 hover:text-zinc-300"
            }`}
            data-testid={`lora-mode-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== "manual" && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2" data-testid="lora-plan">
          <div className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-semibold">Recommended for {family}</span>
          </div>
          {plan.selected.length ? (
            <div className="space-y-1.5">
              {plan.selected.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-200 flex-1">{entry.label}</span>
                  <span className="font-mono uppercase text-zinc-500">{entry.slot}</span>
                  <span className="font-mono text-amber-300">{entry.defaultStrength.toFixed(2)}</span>
                </div>
              ))}
              {mode === "assisted" && (
                <button
                  type="button"
                  onClick={applyPlan}
                  className="mt-2 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                  data-testid="apply-lora-plan"
                >
                  Apply recommendations
                </button>
              )}
              {mode === "automatic" && (
                <p className="text-[10px] text-zinc-500">Recommendations update automatically as the DNA changes.</p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500">
              No optional LoRA is needed for the current selections. Required workflow LoRAs remain active.
            </p>
          )}
          {plan.warnings.map((warning) => (
            <div key={warning} className="flex gap-2 text-[10px] text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{warning}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {loras.map((lora) => {
          const c = cur(lora.node_id);
          return (
            <div key={lora.node_id} className="rounded-md border hairline bg-elevated p-3 space-y-2" data-testid={`lora-${lora.node_id}`}>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 flex-1 truncate" title={lora.lora_name}>
                  {lora.optional_slot ? lora.title : lora.label}
                </div>
                <button
                  onClick={() => reset(lora.node_id)}
                  data-testid={`btn-reset-lora-${lora.node_id}`}
                  className="h-6 w-6 grid place-items-center rounded text-zinc-400 hover:bg-white/5"
                  title="Reset to default"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              {lora.optional_slot && (
                <label className="block space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400">
                    INSTALLED {(lora.slot_kind || "OPTIONAL").toUpperCase()} LORA
                  </span>
                  <select
                    value={c.lora_name || lora.lora_name}
                    onChange={(e) => setOptionalName(lora, e.target.value)}
                    className="w-full bg-elevated border border-hairline rounded-lg px-3 py-2 text-xs"
                    data-testid={`select-lora-${lora.node_id}`}
                    disabled={mode === "automatic"}
                  >
                    <option value="">Select an installed LoRA…</option>
                    {installed.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <p className="text-[10px] text-zinc-500">
                    {mode === "automatic"
                      ? "Automatic mode controls this slot."
                      : "Only model-compatible LoRAs should be selected."}
                  </p>
                </label>
              )}
              <label className="block space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>MODEL STRENGTH</span>
                  <span className="text-amber-300">{Number(c.strength_model).toFixed(2)}</span>
                </div>
                <Slider
                  data-testid={`slider-lora-model-${lora.node_id}`}
                  min={-3} max={3} step={0.05}
                  value={[c.strength_model]}
                  onValueChange={(v) => setW(lora.node_id, "strength_model", Number(v[0].toFixed(2)))}
                  disabled={mode === "automatic" && lora.optional_slot}
                />
              </label>
              {lora.supports_clip && (
                <label className="block space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>CLIP STRENGTH</span>
                    <span className="text-amber-300">{Number(c.strength_clip).toFixed(2)}</span>
                  </div>
                  <Slider
                    data-testid={`slider-lora-clip-${lora.node_id}`}
                    min={-3} max={3} step={0.05}
                    value={[c.strength_clip]}
                    onValueChange={(v) => setW(lora.node_id, "strength_clip", Number(v[0].toFixed(2)))}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
