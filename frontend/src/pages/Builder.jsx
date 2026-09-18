import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Shuffle, Download, Upload, Loader2, Play, ChevronLeft, ChevronRight, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { SECTIONS, DEFAULT_DNA, randomizeDna, randomizeSection, randomizeWetDream, resetSection, buildPrompts, phaseOfSection } from "@/lib/dna";
import { buildPonyPrompts } from "@/lib/ponyPrompts";
import DnaSection from "@/components/DnaSection";
import PromptPreview from "@/components/PromptPreview";
import AiAssistBar from "@/components/AiAssistBar";
import PresetsMenu from "@/components/PresetsMenu";
import KinkPresetsMenu from "@/components/KinkPresetsMenu";
import LoraPanel from "@/components/LoraPanel";
import LivePreview from "@/components/LivePreview";
import TagInput from "@/components/TagInput";
import GroupedSectionRail from "@/components/GroupedSectionRail";
import DnaAtAGlance from "@/components/DnaAtAGlance";
import { Flame } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Builder() {
  const { id, section: sectionParam } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.key === sectionParam));
  const activeSection = SECTIONS[activeIdx].key;
  const basePath = isNew ? "/character/new" : `/character/${id}`;
  const sectionUrl = (key) => `${basePath}/s/${key}`;
  const goSection = (key) => nav(sectionUrl(key));

  const [name, setName] = useState("Untitled");
  const [dna, setDna] = useState(DEFAULT_DNA);
  const [locks, setLocks] = useState({});
  const [tags, setTags] = useState([]);
  const [raunch, setRaunch] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);
  const [workflowId, setWorkflowId] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});

  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  useEffect(() => {
    if (!workflowId && workflows.length) {
      setWorkflowId(settings?.default_workflow_id || workflows[0].id);
    }
  }, [workflows, settings, workflowId]);

  const activeWorkflow = workflows.find((w) => w.id === workflowId);
  const promptStyle = activeWorkflow?.prompt_style || "venice";

  useQuery({
    queryKey: ["character", id],
    queryFn: () => endpoints.getCharacter(id),
    enabled: !!id,
    onSuccess: (c) => {
      setName(c.name || "Untitled");
      setDna({ ...DEFAULT_DNA, ...(c.dna || {}) });
      setLocks(c.locks || {});
      setTags(Array.isArray(c.tags) ? c.tags : []);
      setRaunch(!!c.raunch);
    },
  });

  const { positive, negative } = useMemo(
    () => (promptStyle === "pony" ? buildPonyPrompts(dna, { raunch }) : buildPrompts(dna, { raunch })),
    [dna, promptStyle, raunch]
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name, dna, locks, tags, raunch, prompt_positive: positive, prompt_negative: negative };
      if (isNew) {
        const created = await endpoints.createCharacter(payload);
        return created;
      }
      return endpoints.updateCharacter(id, payload);
    },
    onSuccess: (c) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["character-tags"] });
      if (isNew && c?.id) nav(`/character/${c.id}/s/${activeSection}`, { replace: true });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const doDispatch = async () => {
    if (!workflowId) {
      toast.error("Pick a workflow first (Settings → Workflow library)");
      return;
    }
    setDispatching(true);
    try {
      const r = await endpoints.dispatchRender({
        character_id: isNew ? undefined : id,
        dna,
        prompt_positive: positive,
        prompt_negative: negative,
        workflow_id: workflowId,
        lora_overrides: loraOverrides,
      });
      setActiveRender(r);
      toast.success(r.status === "running" ? "Render queued to ComfyUI" : `Render ${r.status}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  // Poll active render for output
  useEffect(() => {
    if (!activeRender?.id || activeRender.status === "done" || activeRender.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const r = await endpoints.pollRender(activeRender.id);
        setActiveRender(r);
        if (r.status === "done" || r.status === "failed") clearInterval(t);
      } catch { /* keep polling */ }
    }, 2500);
    return () => clearInterval(t);
  }, [activeRender?.id, activeRender?.status]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ name, dna, locks }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "character").replace(/\s+/g, "_")}.dna.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.name) setName(parsed.name);
        if (parsed.dna) setDna({ ...DEFAULT_DNA, ...parsed.dna });
        if (parsed.locks) setLocks(parsed.locks);
        toast.success("Imported");
      } catch { toast.error("Invalid JSON"); }
    };
    reader.readAsText(file);
  };

  const setSection = (key, val) => setDna({ ...dna, [key]: val });

  const runSuggest = async (sectionKey) => {
    try {
      const res = await endpoints.aiSuggest(sectionKey, dna);
      const first = res.options?.[0];
      if (first) {
        setSection(sectionKey, { ...(dna[sectionKey] || {}), ...first });
        toast.success(`Suggested ${sectionKey}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI suggest failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header */}
      <div className="pane p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            data-testid="input-character-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-elevated border-hairline text-lg font-display font-bold"
          />
          <div className="flex flex-wrap gap-2">
          <select
            data-testid="select-workflow"
            value={workflowId}
            onChange={(e) => { setWorkflowId(e.target.value); setLoraOverrides({}); }}
            className="bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100 min-w-[200px]"
          >
            {workflows.length === 0 && <option value="">No workflows — open Settings</option>}
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>{w.kind.toUpperCase()} · {w.name}</option>
            ))}
          </select>
          <button
            onClick={() => setDna(randomizeDna(dna, locks))}
            data-testid="btn-randomize-all"
            className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            <Shuffle className="h-4 w-4" /> Randomize
          </button>
          <button
            onClick={() => { setDna(randomizeWetDream(dna, locks)); toast.success("Wet dream spun 🎲"); }}
            data-testid="btn-randomize-wet-dream"
            title="Spin feet + kink + watersports + fluids + explicit/kink dials at once"
            className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-500/15 to-amber-500/15 text-fuchsia-100 hover:from-fuchsia-500/25 hover:to-amber-500/25 text-sm font-semibold px-3 py-2"
          >
            <Sparkles className="h-4 w-4" /> Wet dream
          </button>
          <PresetsMenu
            onApply={(preset) => {
              // Merge preset but keep locked sections intact
              const next = { ...preset };
              Object.keys(locks).forEach((k) => { if (locks[k]) next[k] = dna[k]; });
              setDna(next);
              toast.success("Preset applied");
            }}
          />
          <KinkPresetsMenu
            currentDna={dna}
            onApply={(next) => {
              // Respect locked sections
              const merged = { ...next };
              Object.keys(locks).forEach((k) => { if (locks[k]) merged[k] = dna[k]; });
              setDna(merged);
            }}
          />
          <button
            type="button"
            onClick={() => setRaunch((v) => !v)}
            data-testid="btn-toggle-raunch"
            title={raunch ? "Raunch mode ON — graphic vernacular in Venice prompts" : "Raunch mode OFF — editorial vocabulary"}
            className={`inline-flex items-center gap-1.5 rounded-lg border text-sm font-semibold px-3 py-2 ${
              raunch
                ? "border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-200"
                : "border-hairline text-zinc-300 hover:bg-white/5"
            }`}
          >
            <Flame className="h-4 w-4" /> {raunch ? "Raunch ON" : "Raunch"}
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            data-testid="btn-save-character"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          <button
            onClick={doDispatch}
            disabled={dispatching || !workflowId}
            data-testid="btn-dispatch-comfyui-render"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Render
          </button>
          {!isNew && (
            <Link
              to={`/shoot/new/${id}`}
              data-testid="btn-open-shoot"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm font-semibold px-3 py-2 hover:bg-emerald-500/20"
              title="Batch photo shoot"
            >
              <Camera className="h-4 w-4" /> Shoot
            </Link>
          )}
          <button
            onClick={exportJson}
            data-testid="btn-export-json"
            className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300"
          >
            <Download className="h-4 w-4" />
          </button>
          <label
            data-testid="btn-import-json"
            className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
        </div>
        </div>
        <TagInput value={tags} onChange={setTags} placeholder="tag this character (mood, ethnicity, persona)…" testId="builder-tags" />
      </div>

      <DnaAtAGlance dna={dna} name={name} />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-4">
        {/* Left rail - grouped-by-phase section nav */}
        <aside className="hidden lg:block h-fit sticky top-20">
          <GroupedSectionRail
            dna={dna}
            locks={locks}
            activeSection={activeSection}
            onSelect={(key) => nav(sectionUrl(key))}
            testIdPrefix="nav-section"
          />
        </aside>

        {/* Mobile section chips — grouped by phase */}
        <div className="lg:hidden overflow-x-auto scroll-fade -mx-3 px-3 flex gap-2 pb-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              to={sectionUrl(s.key)}
              data-testid={`nav-section-${s.key}-mobile`}
              className={`chip chip-${phaseOfSection(s.key)} whitespace-nowrap ${activeSection === s.key ? "active" : ""}`}
            >
              {s.title}{locks[s.key] && " 🔒"}
            </Link>
          ))}
        </div>

        {/* Center - single active section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Step {activeIdx + 1} of {SECTIONS.length}</span>
            <span className={`uppercase tracking-widest section-label phase-${phaseOfSection(activeSection)}`}>{SECTIONS[activeIdx].title}</span>
          </div>
          <div className="h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${((activeIdx + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>
          <DnaSection
            key={activeSection}
            section={SECTIONS[activeIdx]}
            value={dna[activeSection] || {}}
            onChange={(v) => setSection(activeSection, v)}
            locked={!!locks[activeSection]}
            onToggleLock={() => setLocks({ ...locks, [activeSection]: !locks[activeSection] })}
            onRandomize={() => setSection(activeSection, randomizeSection(activeSection, dna[activeSection] || {}))}
            onReset={() => setSection(activeSection, resetSection(activeSection))}
            onSuggest={() => runSuggest(activeSection)}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => activeIdx > 0 && goSection(SECTIONS[activeIdx - 1].key)}
              disabled={activeIdx === 0}
              data-testid="btn-section-prev"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> {activeIdx > 0 ? SECTIONS[activeIdx - 1].title : "Prev"}
            </button>
            {activeIdx < SECTIONS.length - 1 ? (
              <button
                onClick={() => goSection(SECTIONS[activeIdx + 1].key)}
                data-testid="btn-section-next"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5"
              >
                {SECTIONS[activeIdx + 1].title} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => save.mutate()}
                data-testid="btn-section-finish"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2.5"
              >
                Finish & Save <Save className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right - preview + AI + render */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <PromptPreview positive={positive} negative={negative} />
          {activeWorkflow && promptStyle === "pony" && (
            <div className="pane p-3 flex items-center gap-2" data-testid="pony-style-badge">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 bg-rose-500/10 border border-rose-500/40 rounded px-1.5 py-0.5">pony style</span>
              <span className="text-[11px] text-zinc-400">score_9 prefix + booru tag weighting enabled</span>
            </div>
          )}
          <LoraPanel
            workflowId={workflowId}
            values={loraOverrides}
            onChange={setLoraOverrides}
          />
          <AiAssistBar dna={dna} onApplyDna={(d) => setDna({ ...DEFAULT_DNA, ...d })} />
          {activeRender && (
            <div className="pane p-4 space-y-3" data-testid="render-status-panel">
              <div className="flex items-center justify-between">
                <div className="section-label">Render</div>
                <span
                  data-testid="render-status"
                  className={`text-xs font-mono ${
                    activeRender.status === "done" ? "text-emerald-300" :
                    activeRender.status === "failed" ? "text-red-400" :
                    activeRender.status === "cancelled" ? "text-zinc-400" :
                    activeRender.status === "offline" ? "text-zinc-400" : "text-amber-300"
                  }`}
                >
                  {activeRender.status}
                </span>
              </div>
              {activeRender.error && (
                <div className="text-xs text-red-300 font-mono bg-red-500/10 border border-red-500/30 rounded-md p-2">
                  {activeRender.error}
                </div>
              )}
              {activeRender.status !== "done" && activeRender.status !== "failed" && activeRender.status !== "offline" && activeRender.status !== "cancelled" && (
                <div
                  data-testid="render-live-preview-container"
                  className="relative w-full aspect-square rounded-md border hairline bg-elevated overflow-hidden"
                >
                  <LivePreview
                    clientId={activeRender.id}
                    enabled
                    variant="card"
                    testId="render-live-preview"
                    onCancel={async () => {
                      try {
                        const updated = await endpoints.cancelRender(activeRender.id);
                        setActiveRender(updated);
                        toast.success("Render cancelled");
                      } catch (e) {
                        toast.error(e?.response?.data?.detail || "Cancel failed");
                      }
                    }}
                  />
                </div>
              )}
              {activeRender.output_files?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {activeRender.output_files.map((u, i) => (
                    <img key={i} src={u} alt="render" className="rounded-md border hairline w-full h-auto" />
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
