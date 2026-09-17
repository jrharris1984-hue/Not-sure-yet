import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Sparkles, RotateCcw } from "lucide-react";
import { endpoints } from "@/lib/api";

export default function LoraPanel({ workflowId, values, onChange }) {
  const [loras, setLoras] = useState([]);
  const [defaults, setDefaults] = useState({});

  useEffect(() => {
    if (!workflowId) { setLoras([]); return; }
    let alive = true;
    endpoints.workflowLoras(workflowId).then((r) => {
      if (!alive) return;
      const list = r.loras || [];
      setLoras(list);
      const d = {};
      list.forEach((l) => { d[l.node_id] = { strength_model: l.strength_model, strength_clip: l.strength_clip }; });
      setDefaults(d);
    }).catch(() => setLoras([]));
    return () => { alive = false; };
  }, [workflowId]);

  if (!loras.length) return null;

  const setW = (nid, key, v) => {
    onChange({
      ...values,
      [nid]: { ...(values[nid] || defaults[nid] || {}), [key]: v },
    });
  };
  const reset = (nid) => {
    const next = { ...values };
    delete next[nid];
    onChange(next);
  };
  const cur = (nid) => values[nid] || defaults[nid] || { strength_model: 1, strength_clip: 1 };

  return (
    <div className="pane p-4 space-y-3" data-testid="lora-panel">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <div className="section-label">LoRA weights</div>
        <span className="text-[10px] font-mono text-zinc-500">{loras.length} loaded</span>
      </div>
      <div className="space-y-3">
        {loras.map((l) => {
          const c = cur(l.node_id);
          return (
            <div key={l.node_id} className="rounded-md border hairline bg-elevated p-3 space-y-2" data-testid={`lora-${l.node_id}`}>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 flex-1 truncate" title={l.lora_name}>{l.label}</div>
                <button
                  onClick={() => reset(l.node_id)}
                  data-testid={`btn-reset-lora-${l.node_id}`}
                  className="h-6 w-6 grid place-items-center rounded text-zinc-400 hover:bg-white/5"
                  title="Reset to default"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              <label className="block space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>MODEL STRENGTH</span>
                  <span className="text-amber-300">{c.strength_model.toFixed(2)}</span>
                </div>
                <Slider
                  data-testid={`slider-lora-model-${l.node_id}`}
                  min={-3} max={3} step={0.05}
                  value={[c.strength_model]}
                  onValueChange={(v) => setW(l.node_id, "strength_model", Number(v[0].toFixed(2)))}
                />
              </label>
              <label className="block space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>CLIP STRENGTH</span>
                  <span className="text-amber-300">{c.strength_clip.toFixed(2)}</span>
                </div>
                <Slider
                  data-testid={`slider-lora-clip-${l.node_id}`}
                  min={-3} max={3} step={0.05}
                  value={[c.strength_clip]}
                  onValueChange={(v) => setW(l.node_id, "strength_clip", Number(v[0].toFixed(2)))}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
