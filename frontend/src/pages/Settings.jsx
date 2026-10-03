import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, KeyRound, Server, CheckCircle2, XCircle, Plus, Trash2, Download, ChevronDown, ChevronRight, Wand2, ArrowUp, ArrowDown } from "lucide-react";
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

function WorkflowRow({ w, isDefault, isFallback, isFirst, isLast, onSetDefault, onDelete, onSave, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(w);
  useEffect(() => setForm(w), [w]);
  const dirty = JSON.stringify(form) !== JSON.stringify(w);

  return (
    <div className="border hairline rounded-lg overflow-hidden bg-elevated/60" data-testid={`workflow-row-${w.id}`}>
      <div className="flex items-center gap-1 px-2 py-2">
        <div className="flex flex-col -space-y-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(w.id); }}
            disabled={isFirst}
            data-testid={`btn-workflow-up-${w.id}`}
            className="h-4 w-6 grid place-items-center rounded text-zinc-400 hover:bg-white/5 disabled:opacity-25"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(w.id); }}
            disabled={isLast}
            data-testid={`btn-workflow-down-${w.id}`}
            className="h-4 w-6 grid place-items-center rounded text-zinc-400 hover:bg-white/5 disabled:opacity-25"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-3 px-2 py-1.5 text-left hover:bg-white/5 rounded"
        >
          {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
          <span className="text-[10px] uppercase tracking-widest font-mono text-amber-300 min-w-[52px]">{w.kind}</span>
          <span className="font-display font-semibold text-sm truncate flex-1">{w.name}</span>
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">pos:{w.positive_node_id || "—"} · neg:{w.negative_node_id || "—"}</span>
          {isDefault && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/40">default</span>}
          {!isDefault && isFallback && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">fallback</span>}
        </button>
      </div>
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
            {isDefault && (
              <button
                onClick={() => onSetDefault("")}
                data-testid={`btn-workflow-clear-default-${w.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 text-xs font-semibold px-3 py-1.5"
              >
                Clear default
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
  const { data: ollama, refetch: checkOllama } = useQuery({ queryKey: ["ollama-models", settings?.ollama_url], queryFn: endpoints.ollamaModels, enabled: !!settings });

  const mediaHealth = useQuery({ queryKey: ["media-library-health"], queryFn: endpoints.mediaLibraryHealth });
  const [form, setForm] = useState(null);
  useEffect(() => { if (settings && !form) setForm(settings); }, [settings, form]);

  const saveSettings = useMutation({
    mutationFn: (payload) => endpoints.updateSettings(payload || form),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["comfy-health"] }); qc.invalidateQueries({ queryKey: ["ollama-models"] }); qc.invalidateQueries({ queryKey: ["media-library-health"] }); qc.invalidateQueries({ queryKey: ["media-library"] }); },
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
    onSuccess: (r) => {
      toast.success(`Bundled workflows refreshed`, {
        description: `${r.updated || 0} updated · ${r.added || 0} added`,
      });
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
  const reorderWf = useMutation({
    mutationFn: (order) => endpoints.reorderWorkflows(order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const move = (id, dir) => {
    const idx = workflows.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= workflows.length) return;
    const next = [...workflows];
    [next[idx], next[target]] = [next[target], next[idx]];
    qc.setQueryData(["workflows"], next);
    reorderWf.mutate(next.map((w) => w.id));
  };

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

      <section className="pane p-5 space-y-4" data-testid="media-library-connection">
        <div className="section-label">Media Library connection</div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400 font-mono">Media server URL</span>
          <Input data-testid="input-media-library-url" value={form.media_library_url || ""}
            onChange={(event) => set("media_library_url", event.target.value)} className="bg-elevated border-hairline font-mono" />
        </label>
        <p className="text-xs text-zinc-400">Use the address of the computer running AI Media Library. Its API must be running and reachable from Ultra Studio.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => saveSettings.mutate({ media_library_url: form.media_library_url })}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black" data-testid="btn-save-media-library">Save media server</button>
          <button type="button" onClick={() => mediaHealth.refetch()}
            className="rounded-lg border hairline px-3 py-2 text-sm" data-testid="btn-test-media-library">Test saved connection</button>
          <span className="text-xs text-zinc-400">{mediaHealth.isFetching ? "Checking…" : mediaHealth.data?.online ? "Connected" : "Unavailable"}</span>
        </div>
        {mediaHealth.data?.error && <p className="text-xs text-amber-200 break-words">{mediaHealth.data.error}</p>}
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
            <Download className="h-3.5 w-3.5" /> Refresh bundled workflows
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
          {workflows.map((w, i) => (
            <WorkflowRow
              key={w.id}
              w={w}
              isDefault={form.default_workflow_id === w.id}
              isFallback={i === 0 && !form.default_workflow_id}
              isFirst={i === 0}
              isLast={i === workflows.length - 1}
              onMoveUp={(id) => move(id, -1)}
              onMoveDown={(id) => move(id, 1)}
              onSetDefault={(id) => {
                set("default_workflow_id", id);
                saveSettings.mutate({ default_workflow_id: id });
              }}
              onDelete={(id) => deleteWf.mutate(id)}
              onSave={(payload) => upsertWf.mutate(payload)}
            />
          ))}
          <p className="text-[11px] text-zinc-500 pt-1">
            Top of the list is the fallback used when no default is set. Use the up/down arrows to reorder.
          </p>
          {workflows.length === 0 && (
            <div className="text-sm text-zinc-500 text-center py-6">No workflows yet. Tap "Refresh bundled workflows" or "Add workflow".</div>
          )}
        </div>
      </section>

      <section className="pane p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-400" />
          <div className="section-label">AI Assist</div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {["ollama", "venice"].map((provider) => <button key={provider} type="button" onClick={() => set("ai_provider", provider)}
            aria-pressed={form.ai_provider === provider} className={`rounded-lg border px-3 py-2 ${form.ai_provider === provider ? "border-amber-400 text-amber-200" : "hairline text-zinc-400"}`}>
            {provider === "ollama" ? "Local Ollama" : "Venice API"}</button>)}
        </div>
        {form.ai_provider === "ollama" && <div className="space-y-3">
          <label className="block space-y-1"><span className="text-xs text-zinc-400">Ollama URL from the backend container</span>
            <Input value={form.ollama_url || ""} onChange={(e) => set("ollama_url", e.target.value)} placeholder="http://host.docker.internal:11434" className="bg-elevated border-hairline font-mono" /></label>
          <div className="text-xs text-zinc-400">{ollama?.online ? `${ollama.models.length} installed models found` : `Ollama unavailable${ollama?.error ? `: ${ollama.error}` : ""}`}
            <button type="button" onClick={() => checkOllama()} className="ml-2 text-amber-300 underline">Check again</button></div>
          {[ ["ollama_text_model", "Prompt assistant model"], ["ollama_vision_model", "Image review model"] ].map(([key, label]) =>
            <label key={key} className="block space-y-1"><span className="text-xs text-zinc-400">{label}</span>
              <select value={form[key] || ""} onChange={(e) => set(key, e.target.value)} className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100">
                <option value="">Auto detect installed model</option>
                {(ollama?.models || []).map((model) => <option key={model} value={model}>{model}</option>)}
                {form[key] && !ollama?.models?.includes(form[key]) && <option value={form[key]}>{form[key]} (saved)</option>}
              </select></label>)}
          <p className="text-xs text-zinc-500">Choose a vision capable model for image review. On Docker Desktop, host.docker.internal reaches Ollama running on Windows.</p>
        </div>}
        {form.ai_provider !== "ollama" && <>
        <div className="text-[11px] text-zinc-400 leading-relaxed">
          AI Assist is powered by <code className="text-amber-300">Venice.AI</code> (uncensored, NSFW-permissive).
          The API key and model are read from <code>backend/.env</code>:
          <code className="block mt-1 text-zinc-500">VENICE_API_KEY, VENICE_MODEL (default: venice-uncensored)</code>
          <span className="block mt-2 text-zinc-500">
            Get a key at <a href="https://venice.ai" target="_blank" rel="noreferrer" className="text-amber-300 underline">venice.ai</a>.
            The legacy key field below is a fallback if the env var isn't set.
          </span>
        </div>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Fallback API key (optional)</span>
          <Input
            data-testid="input-openrouter-key"
            type="password"
            value={form.openrouter_api_key}
            onChange={(e) => set("openrouter_api_key", e.target.value)}
            placeholder="only used if VENICE_API_KEY env var is missing"
            className="bg-elevated border-hairline font-mono"
          />
        </label>
        </>}
        <div className="flex justify-end">
          <button
            data-testid="btn-save-settings"
            onClick={() => saveSettings.mutate({ ai_provider: form.ai_provider, ollama_url: form.ollama_url, ollama_text_model: form.ollama_text_model, ollama_vision_model: form.ollama_vision_model, openrouter_api_key: form.openrouter_api_key, openrouter_model: form.openrouter_model })}
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
