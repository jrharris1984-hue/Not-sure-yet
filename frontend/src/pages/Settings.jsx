import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, KeyRound, Server, CheckCircle2, XCircle, Plus, Trash2, Download, ChevronDown, ChevronRight, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const KIND_OPTIONS = [
  { value: "image", label: "Image (T2I)" },
  { value: "video", label: "Video / I2V" },
  { value: "edit", label: "Edit (needs image)" },
  { value: "face", label: "Face-preserved" },
];

function WorkflowRow({ w, isDefault, onSetDefault, onDelete, onSave }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(w);
  useEffect(() => setForm(w), [w]);
  const dirty = JSON.stringify(form) !== JSON.stringify(w);

  return (
    <div className="border hairline rounded-lg overflow-hidden bg-elevated/60" data-testid={`workflow-row-${w.id}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
      >
        {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
        <span className="text-[10px] uppercase tracking-widest font-mono text-amber-300 min-w-[52px]">{w.kind}</span>
        <span className="font-display font-semibold text-sm truncate flex-1">{w.name}</span>
        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">pos:{w.positive_node_id || "—"} · neg:{w.negative_node_id || "—"}</span>
        {isDefault && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/40">default</span>}
      </button>
      {open && (
        <div className="p-3 space-y-3 border-t hairline">
          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-xs space-y-1">
              <span className="uppercase tracking-widest text-zinc-500 font-mono">Name</span>
              <Input data-testid={`input-workflow-name-${w.id}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-obsidian border-hairline" />
            </label>
            <label className="text-xs space-y-1">
              <span className="uppercase tracking-widest text-zinc-500 font-mono">Kind</span>
              <select
                data-testid={`select-workflow-kind-${w.id}`}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="w-full bg-obsidian border border-hairline rounded-md px-3 py-2 text-sm text-zinc-100"
              >
                {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="uppercase tracking-widest text-zinc-500 font-mono">Positive node id</span>
              <Input data-testid={`input-workflow-pos-${w.id}`} value={form.positive_node_id || ""} onChange={(e) => setForm({ ...form, positive_node_id: e.target.value })} className="bg-obsidian border-hairline font-mono" />
            </label>
            <label className="text-xs space-y-1">
              <span className="uppercase tracking-widest text-zinc-500 font-mono">Negative node id (optional)</span>
              <Input data-testid={`input-workflow-neg-${w.id}`} value={form.negative_node_id || ""} onChange={(e) => setForm({ ...form, negative_node_id: e.target.value })} className="bg-obsidian border-hairline font-mono" />
            </label>
          </div>
          <label className="text-xs space-y-1 block">
            <span className="uppercase tracking-widest text-zinc-500 font-mono">Workflow JSON (API/prompt format)</span>
            <Textarea
              data-testid={`textarea-workflow-json-${w.id}`}
              rows={7}
              value={form.json_str || ""}
              onChange={(e) => setForm({ ...form, json_str: e.target.value })}
              className="bg-obsidian border-hairline font-mono text-[11px]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSave({ ...form, auto_detect: true })}
              disabled={!dirty}
              data-testid={`btn-workflow-save-${w.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-1.5"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button
              onClick={() => onSave({ ...form, auto_detect: true, positive_node_id: "", negative_node_id: "" })}
              data-testid={`btn-workflow-redetect-${w.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 text-xs font-semibold px-3 py-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" /> Re-detect nodes
            </button>
            {!isDefault && (
              <button
                onClick={() => onSetDefault(w.id)}
                data-testid={`btn-workflow-default-${w.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border hairline text-zinc-200 hover:bg-white/5 text-xs font-semibold px-3 py-1.5"
              >
                Set as default
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => window.confirm(`Delete workflow "${w.name}"?`) && onDelete(w.id)}
              data-testid={`btn-workflow-delete-${w.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border hairline text-zinc-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 text-xs font-semibold px-3 py-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: health } = useQuery({ queryKey: ["comfy-health"], queryFn: endpoints.comfyHealth, refetchInterval: 10000 });

  const [form, setForm] = useState(null);
  useEffect(() => { if (settings && !form) setForm(settings); }, [settings, form]);

  const saveSettings = useMutation({
    mutationFn: (payload) => endpoints.updateSettings(payload || form),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["comfy-health"] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const upsertWf = useMutation({
    mutationFn: (body) => endpoints.upsertWorkflow(body),
    onSuccess: () => { toast.success("Workflow saved"); qc.invalidateQueries({ queryKey: ["workflows"] }); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });
  const deleteWf = useMutation({
    mutationFn: (id) => endpoints.deleteWorkflow(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["workflows"] }); qc.invalidateQueries({ queryKey: ["settings"] }); },
  });
  const seedWf = useMutation({
    mutationFn: () => endpoints.seedWorkflows(),
    onSuccess: (r) => { toast.success(`Seeded ${r.added} workflow(s)`); qc.invalidateQueries({ queryKey: ["workflows"] }); },
  });

  if (!form) return <div className="p-10 text-zinc-500">Loading settings…</div>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div>
        <div className="section-label">Settings</div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Studio configuration</h1>
      </div>

      <section className="pane p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-amber-400" />
          <div className="section-label">ComfyUI</div>
          {health && (
            <span className={`ml-auto inline-flex items-center gap-1 text-xs font-mono ${health.online ? "text-emerald-300" : "text-red-400"}`}>
              {health.online ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {health.online ? "online" : "offline"}
            </span>
          )}
        </div>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Server URL</span>
          <Input
            data-testid="input-comfyui-url"
            value={form.comfyui_url}
            onChange={(e) => set("comfyui_url", e.target.value)}
            className="bg-elevated border-hairline font-mono"
          />
        </label>
        <div className="flex justify-end">
          <button
            data-testid="btn-save-server"
            onClick={() => saveSettings.mutate({ comfyui_url: form.comfyui_url })}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2"
          >
            <Save className="h-4 w-4" /> Save server
          </button>
        </div>
      </section>

      <section className="pane p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="section-label">Workflow library</div>
          <span className="text-xs text-zinc-500 font-mono">{workflows.length} workflow{workflows.length === 1 ? "" : "s"}</span>
          <div className="flex-1" />
          <button
            onClick={() => seedWf.mutate()}
            data-testid="btn-seed-workflows"
            className="inline-flex items-center gap-1.5 rounded-md border hairline text-zinc-200 hover:bg-white/5 text-xs font-semibold px-3 py-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Re-seed bundled 5
          </button>
          <button
            onClick={() => upsertWf.mutate({ name: "New workflow", kind: "image", json_str: "", auto_detect: false })}
            data-testid="btn-add-workflow"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add workflow
          </button>
        </div>
        <div className="space-y-2">
          {workflows.map((w) => (
            <WorkflowRow
              key={w.id}
              w={w}
              isDefault={form.default_workflow_id === w.id}
              onSetDefault={(id) => {
                set("default_workflow_id", id);
                saveSettings.mutate({ default_workflow_id: id });
              }}
              onDelete={(id) => deleteWf.mutate(id)}
              onSave={(payload) => upsertWf.mutate(payload)}
            />
          ))}
          {workflows.length === 0 && (
            <div className="text-sm text-zinc-500 text-center py-6">No workflows yet. Tap "Re-seed bundled 5" or "Add workflow".</div>
          )}
        </div>
      </section>

      <section className="pane p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-400" />
          <div className="section-label">OpenRouter (AI Assist)</div>
        </div>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">API key</span>
          <Input
            data-testid="input-openrouter-key"
            type="password"
            value={form.openrouter_api_key}
            onChange={(e) => set("openrouter_api_key", e.target.value)}
            placeholder="sk-or-v1-..."
            className="bg-elevated border-hairline font-mono"
          />
          <p className="text-[11px] text-zinc-500">Get a key at openrouter.ai/keys. NSFW-permissive models supported.</p>
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Model</span>
          <Input
            data-testid="input-openrouter-model"
            value={form.openrouter_model}
            onChange={(e) => set("openrouter_model", e.target.value)}
            placeholder="cognitivecomputations/dolphin-mixtral-8x7b"
            className="bg-elevated border-hairline font-mono"
          />
        </label>
        <div className="flex justify-end">
          <button
            data-testid="btn-save-settings"
            onClick={() => saveSettings.mutate({ openrouter_api_key: form.openrouter_api_key, openrouter_model: form.openrouter_model })}
            disabled={saveSettings.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> Save AI settings
          </button>
        </div>
      </section>
    </div>
  );
}
