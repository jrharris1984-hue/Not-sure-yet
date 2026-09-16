import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, KeyRound, Server, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  const { data: health } = useQuery({ queryKey: ["comfy-health"], queryFn: endpoints.comfyHealth, refetchInterval: 10000 });

  const [form, setForm] = useState(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: () => endpoints.updateSettings(form),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["comfy-health"] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
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
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Positive prompt node id</span>
            <Input
              data-testid="input-positive-node-id"
              value={form.positive_prompt_node_id}
              onChange={(e) => set("positive_prompt_node_id", e.target.value)}
              className="bg-elevated border-hairline font-mono"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Negative prompt node id</span>
            <Input
              data-testid="input-negative-node-id"
              value={form.negative_prompt_node_id}
              onChange={(e) => set("negative_prompt_node_id", e.target.value)}
              className="bg-elevated border-hairline font-mono"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Image workflow JSON</span>
          <Textarea
            data-testid="input-image-workflow"
            rows={7}
            value={form.image_workflow_json}
            onChange={(e) => set("image_workflow_json", e.target.value)}
            placeholder='Paste the ComfyUI /prompt-format workflow JSON here (the raw graph object, not the UI export).'
            className="bg-elevated border-hairline font-mono text-xs"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Video workflow JSON</span>
          <Textarea
            data-testid="input-video-workflow"
            rows={7}
            value={form.video_workflow_json}
            onChange={(e) => set("video_workflow_json", e.target.value)}
            placeholder='Optional — paste a video generation workflow (e.g., AnimateDiff).'
            className="bg-elevated border-hairline font-mono text-xs"
          />
        </label>
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
      </section>

      <div className="flex justify-end">
        <button
          data-testid="btn-save-settings"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 disabled:opacity-40"
        >
          <Save className="h-4 w-4" /> Save settings
        </button>
      </div>
    </div>
  );
}
