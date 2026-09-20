import { useEffect, useMemo, useState } from "react";
import { Fingerprint, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { endpoints } from "@/lib/api";

const EMPTY = { enabled: false, node_id: "", lora_name: "", strength_model: 0.8, strength_clip: 0.8, trigger: "" };

export function likenessOverrides(subjects = []) {
  const result = {};
  subjects.forEach((subject) => {
    const item = subject?.likeness;
    if (!item?.enabled || !item.node_id || !item.lora_name) return;
    result[item.node_id] = {
      lora_name: item.lora_name,
      strength_model: Number(item.strength_model ?? 0.8),
      strength_clip: Number(item.strength_clip ?? 0.8),
    };
  });
  return result;
}

export function likenessTriggerText(subjects = []) {
  return subjects
    .filter((subject) => subject?.likeness?.enabled && subject.likeness.trigger?.trim())
    .map((subject) => `${subject.label || "Subject"}: ${subject.likeness.trigger.trim()}`)
    .join(", ");
}

export default function LikenessLoraPanel({ workflowId, subject, onChange }) {
  const [nodes, setNodes] = useState([]);
  const [installed, setInstalled] = useState([]);
  const value = { ...EMPTY, ...(subject?.likeness || {}) };

  useEffect(() => {
    if (!workflowId) { setNodes([]); return; }
    endpoints.workflowLoras(workflowId).then((r) => setNodes(r.loras || [])).catch(() => setNodes([]));
    endpoints.comfyLoras().then((r) => setInstalled(r.loras || [])).catch(() => setInstalled([]));
  }, [workflowId]);

  const availableNodes = useMemo(() => nodes.map((node) => ({
    ...node,
    name: `${node.node_id} · ${node.label || "LoRA loader"}`,
  })), [nodes]);
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <section className="pane p-4 space-y-3" data-testid="likeness-lora-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="section-label flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Likeness LoRA · Subject {subject?.label || "A"}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Saved with this subject and applied automatically at render time.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="accent-amber-400" />
          Enable
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-3">
          {availableNodes.length === 0 && (
            <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" /> This workflow has no LoRA loader. Add a dedicated LoraLoader node in ComfyUI, export API JSON, then refresh the workflow.
            </div>
          )}
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Workflow slot</span>
            <select value={value.node_id} onChange={(e) => set({ node_id: e.target.value })} className="w-full bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm">
              <option value="">Select a dedicated LoRA loader…</option>
              {availableNodes.map((node) => <option key={node.node_id} value={node.node_id}>{node.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Installed likeness LoRA</span>
            <select value={value.lora_name} onChange={(e) => set({ lora_name: e.target.value })} className="w-full bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm">
              <option value="">Select an installed LoRA…</option>
              {installed.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Trigger phrase (optional)</span>
            <Input value={value.trigger} onChange={(e) => set({ trigger: e.target.value })} placeholder="Training trigger word" className="bg-elevated border-hairline" />
          </label>
          {[['strength_model', 'Model strength'], ['strength_clip', 'CLIP strength']].map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400"><span>{label}</span><span className="text-amber-300">{Number(value[key]).toFixed(2)}</span></div>
              <Slider min={0} max={1.5} step={0.05} value={[Number(value[key])]} onValueChange={(v) => set({ [key]: Number(v[0].toFixed(2)) })} />
            </label>
          ))}
          {installed.length === 0 && <p className="text-[11px] text-zinc-500">No installed LoRAs were reported. Confirm ComfyUI is online and refresh this page.</p>}
        </div>
      )}
    </section>
  );
}
