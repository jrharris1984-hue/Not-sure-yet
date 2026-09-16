import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Shuffle, Zap, Download, Upload, Loader2, Film, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { SECTIONS, DEFAULT_DNA, randomizeDna, randomizeSection, resetSection, buildPrompts } from "@/lib/dna";
import DnaSection from "@/components/DnaSection";
import PromptPreview from "@/components/PromptPreview";
import AiAssistBar from "@/components/AiAssistBar";
import { Input } from "@/components/ui/input";

export default function Builder() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("Untitled");
  const [dna, setDna] = useState(DEFAULT_DNA);
  const [locks, setLocks] = useState({});
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);

  useQuery({
    queryKey: ["character", id],
    queryFn: () => endpoints.getCharacter(id),
    enabled: !!id,
    onSuccess: (c) => {
      setName(c.name || "Untitled");
      setDna({ ...DEFAULT_DNA, ...(c.dna || {}) });
      setLocks(c.locks || {});
    },
  });

  const { positive, negative } = useMemo(() => buildPrompts(dna), [dna]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name, dna, locks, prompt_positive: positive, prompt_negative: negative };
      if (isNew) {
        const created = await endpoints.createCharacter(payload);
        return created;
      }
      return endpoints.updateCharacter(id, payload);
    },
    onSuccess: (c) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["characters"] });
      if (isNew && c?.id) nav(`/character/${c.id}`, { replace: true });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const doDispatch = async (workflow_type) => {
    setDispatching(true);
    try {
      const r = await endpoints.dispatchRender({
        character_id: isNew ? undefined : id,
        dna,
        prompt_positive: positive,
        prompt_negative: negative,
        workflow_type,
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
      <div className="pane p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <Input
          data-testid="input-character-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-elevated border-hairline text-lg font-display font-bold"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDna(randomizeDna(dna, locks))}
            data-testid="btn-randomize-all"
            className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            <Shuffle className="h-4 w-4" /> Randomize
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
            onClick={() => doDispatch("image")}
            disabled={dispatching}
            data-testid="btn-dispatch-comfyui-render"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Render
          </button>
          <button
            onClick={() => doDispatch("video")}
            disabled={dispatching}
            data-testid="btn-dispatch-video"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            <Film className="h-4 w-4" /> Video
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_380px] gap-4">
        {/* Left rail - section nav */}
        <aside className="hidden lg:block pane p-2 h-fit sticky top-20">
          <div className="section-label px-2 py-2">Sections</div>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setActiveSection(s.key);
                document.getElementById(`sec-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              data-testid={`nav-section-${s.key}`}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                activeSection === s.key ? "bg-amber-500/10 text-amber-200" : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              {s.title}
              {locks[s.key] && <span className="ml-2 text-[10px] text-amber-300">🔒</span>}
            </button>
          ))}
        </aside>

        {/* Mobile section chips */}
        <div className="lg:hidden overflow-x-auto scroll-fade -mx-3 px-3 flex gap-2 pb-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setActiveSection(s.key);
                document.getElementById(`sec-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              data-testid={`nav-section-${s.key}-mobile`}
              className={`chip whitespace-nowrap ${activeSection === s.key ? "active" : ""}`}
            >
              {s.title}{locks[s.key] && " 🔒"}
            </button>
          ))}
        </div>

        {/* Center - sections */}
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <div id={`sec-${s.key}`} key={s.key}>
              <DnaSection
                section={s}
                value={dna[s.key] || {}}
                onChange={(v) => setSection(s.key, v)}
                locked={!!locks[s.key]}
                onToggleLock={() => setLocks({ ...locks, [s.key]: !locks[s.key] })}
                onRandomize={() => setSection(s.key, randomizeSection(s.key, dna[s.key] || {}))}
                onReset={() => setSection(s.key, resetSection(s.key))}
                onSuggest={() => runSuggest(s.key)}
              />
            </div>
          ))}
        </div>

        {/* Right - preview + AI + render */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <PromptPreview positive={positive} negative={negative} />
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
              {activeRender.status !== "done" && activeRender.status !== "failed" && activeRender.status !== "offline" && (
                <div className="h-2 rounded-full bg-elevated overflow-hidden">
                  <div className="h-full bg-amber-400 animate-pulse w-1/3" />
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
