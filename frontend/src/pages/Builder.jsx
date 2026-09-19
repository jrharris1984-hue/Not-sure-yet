import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Shuffle, Download, Upload, Loader2, Play, ChevronLeft, ChevronRight, Camera, Sparkles, ChevronDown, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import {
  SECTIONS, DEFAULT_DNA,
  randomizeDna, randomizeSection, randomizeWetDream, resetSection,
  buildPrompts, buildMultiVenicePrompts,
  phaseOfSection,
  MAX_SUBJECTS, makeSubject, subjectsFromCharacter, subjectLabel,
  expectedSubjectCount, seedSubjectFromPairing,
} from "@/lib/dna";
import { buildPonyPrompts, buildMultiPonyPrompts } from "@/lib/ponyPrompts";
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
import MobileOverflow from "@/components/MobileOverflow";
import SubjectSwitcher from "@/components/SubjectSwitcher";
import { Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  // Multi-subject store: [{id, label, dna, field_locks}]. subjects[0] is Subject A (primary).
  const [subjects, setSubjects] = useState(() => [makeSubject({ label: "A" })]);
  const [activeSubjectId, setActiveSubjectId] = useState(() => "");
  const [locks, setLocks] = useState({}); // section-level locks (shared across subjects — shot-level)
  const [collapsed, setCollapsed] = useState({});     // {sectionKey|'_glance': bool}
  const [tags, setTags] = useState([]);
  const [raunch, setRaunch] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);
  const [workflowId, setWorkflowId] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [referenceImage, setReferenceImage] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [faceStrength, setFaceStrength] = useState(1.1);
  const [faceIdV2Strength, setFaceIdV2Strength] = useState(1.4);
  const [editInstruction, setEditInstruction] = useState("");
  const [preserveUnmentioned, setPreserveUnmentioned] = useState(true);
  const [enhancingEdit, setEnhancingEdit] = useState(false);
  const [videoInstruction, setVideoInstruction] = useState("");
  const [videoFrames, setVideoFrames] = useState(41);
  const [videoFps, setVideoFps] = useState(24);
  const [enhancingVideo, setEnhancingVideo] = useState(false);
  const [analyzingVideoImage, setAnalyzingVideoImage] = useState(false);
  const [videoImageAnalysis, setVideoImageAnalysis] = useState("");

  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  useEffect(() => {
    if (!workflowId && workflows.length) {
      setWorkflowId(settings?.default_workflow_id || workflows[0].id);
    }
  }, [workflows, settings, workflowId]);

  const activeWorkflow = workflows.find((w) => w.id === workflowId);
  const promptStyle = activeWorkflow?.prompt_style || "venice";
  const isFaceWorkflow = activeWorkflow?.kind === "face";
  const isEditWorkflow = activeWorkflow?.kind === "edit";
  const isVideoWorkflow = activeWorkflow?.kind === "video";
  const isTextVideoWorkflow = activeWorkflow?.kind === "text_video";

  const uploadReference = async (file) => {
    if (!file) return;
    setReferenceUploading(true);
    try {
      const uploaded = await endpoints.uploadReferenceImage(file);
      if (referencePreview) URL.revokeObjectURL(referencePreview);
      setReferencePreview(URL.createObjectURL(file));
      setReferenceImage(uploaded);
      toast.success("Reference photograph uploaded");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reference photograph upload failed");
    } finally {
      setReferenceUploading(false);
    }
  };

  const enhanceEditInstruction = async () => {
    if (!editInstruction.trim()) {
      toast.error("Describe the edit first");
      return;
    }
    setEnhancingEdit(true);
    try {
      const result = await endpoints.aiEditPrompt(editInstruction.trim(), preserveUnmentioned);
      setEditInstruction(result.prompt || editInstruction);
      toast.success("Venice enhanced the edit instruction");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not enhance the edit instruction");
    } finally {
      setEnhancingEdit(false);
    }
  };

  const enhanceVideoInstruction = async () => {
    if (!videoInstruction.trim()) {
      toast.error("Describe the movement first");
      return;
    }
    setEnhancingVideo(true);
    try {
      const result = await endpoints.aiVideoPrompt(
        videoInstruction.trim(),
        isTextVideoWorkflow ? "text" : "image"
      );
      setVideoInstruction(result.prompt || videoInstruction);
      toast.success(isTextVideoWorkflow ? "Venice expanded the video prompt" : "Venice enhanced the motion prompt");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not enhance the motion prompt");
    } finally {
      setEnhancingVideo(false);
    }
  };

  const analyzeVideoImage = async () => {
    if (!referenceImage?.name) {
      toast.error("Upload a starting image first");
      return;
    }
    setAnalyzingVideoImage(true);
    try {
      const result = await endpoints.aiAnalyzeVideoImage(referenceImage.name, videoInstruction.trim());
      setVideoImageAnalysis(result.analysis || "");
      if (result.prompt) setVideoInstruction(result.prompt);
      toast.success("Venice analyzed the starting image and drafted the motion prompt");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not analyze the starting image");
    } finally {
      setAnalyzingVideoImage(false);
    }
  };

  const clearReference = () => {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferencePreview("");
    setReferenceImage(null);
  };

  useEffect(() => () => {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
  }, [referencePreview]);

  const { data: character } = useQuery({
    queryKey: ["character", id],
    queryFn: () => endpoints.getCharacter(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!character) return;
    setName(character.name || "Untitled");
    const subs = subjectsFromCharacter(character);
    setSubjects(subs);
    setActiveSubjectId(character.active_subject_id && subs.find((s) => s.id === character.active_subject_id)
      ? character.active_subject_id
      : subs[0].id);
    setLocks(character.locks || {});
    // Auto-fold the DNA at-a-glance panel on mobile if the user has never set a preference
    const savedCollapsed = character.collapsed || {};
    if (typeof savedCollapsed._glance === "undefined" && typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed({ ...savedCollapsed, _glance: true });
    } else {
      setCollapsed(savedCollapsed);
    }
    setTags(Array.isArray(character.tags) ? character.tags : []);
    setRaunch(!!character.raunch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id]);

  // Ensure active id is always valid.
  useEffect(() => {
    if (!subjects.length) return;
    if (!activeSubjectId || !subjects.find((s) => s.id === activeSubjectId)) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const activeSubjectIdx = Math.max(0, subjects.findIndex((s) => s.id === activeSubjectId));
  const activeSubject = subjects[activeSubjectIdx] || subjects[0];
  const activeDna = activeSubject?.dna || DEFAULT_DNA;
  const activeFieldLocks = activeSubject?.field_locks || {};
  const primaryDna = subjects[0]?.dna || DEFAULT_DNA;

  // Whenever the user changes cast_size / cast_type in scenario, we may want to auto-add
  // a subject B (only if not already present, and we've truly upgraded to multi-subject).
  const prevPairingRef = useRef("");
  useEffect(() => {
    const key = `${primaryDna?.scenario?.cast_size || "solo"}|${primaryDna?.scenario?.cast_type || "none"}`;
    if (prevPairingRef.current === key) return;
    prevPairingRef.current = key;
    const expected = expectedSubjectCount(primaryDna);
    if (expected > subjects.length && subjects.length < MAX_SUBJECTS) {
      // Auto-add one subject (never more than one at a time — user can add more via UI).
      const seeded = seedSubjectFromPairing(primaryDna, subjects.length);
      const newSub = makeSubject({ label: subjectLabel(subjects.length), dna: seeded });
      setSubjects((cur) => [...cur, newSub]);
      toast.success(`Subject ${newSub.label} added — scenario expects ${expected} subjects`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDna?.scenario?.cast_size, primaryDna?.scenario?.cast_type]);

  const updateActiveSubject = (updater) => {
    setSubjects((cur) => cur.map((s) => (s.id === activeSubjectId ? { ...s, ...updater(s) } : s)));
  };
  const setActiveDna = (newDna) => updateActiveSubject(() => ({ dna: newDna }));
  const setActiveFieldLocks = (newLocks) => updateActiveSubject(() => ({ field_locks: newLocks }));

  const setSection = (key, val) => setActiveDna({ ...activeDna, [key]: val });

  const isMulti = subjects.length > 1;
  const { positive, negative } = useMemo(
    () => {
      if (isMulti) {
        return promptStyle === "pony"
          ? buildMultiPonyPrompts(subjects, { raunch })
          : buildMultiVenicePrompts(subjects, { raunch });
      }
      return promptStyle === "pony"
        ? buildPonyPrompts(activeDna, { raunch })
        : buildPrompts(activeDna, { raunch });
    },
    [subjects, isMulti, activeDna, promptStyle, raunch]
  );

  const save = useMutation({
    mutationFn: async () => {
      // Persist subjects[]. Also mirror Subject A into dna/field_locks for backward compat.
      const payload = {
        name,
        dna: subjects[0]?.dna || {},
        field_locks: subjects[0]?.field_locks || {},
        subjects: subjects.map((s) => ({ id: s.id, label: s.label, dna: s.dna, field_locks: s.field_locks })),
        active_subject_id: activeSubjectId,
        locks,
        collapsed,
        tags,
        raunch,
        prompt_positive: positive,
        prompt_negative: negative,
      };
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
    if (isFaceWorkflow && !referenceImage?.name) {
      toast.error("Upload a reference photograph before using Face Preserve");
      return;
    }
    if (isEditWorkflow && !referenceImage?.name) {
      toast.error("Upload a source image before using Qwen Image Edit");
      return;
    }
    if (isEditWorkflow && !editInstruction.trim()) {
      toast.error("Describe the change you want Qwen to make");
      return;
    }
    if (isVideoWorkflow && !referenceImage?.name) {
      toast.error("Upload a starting image before using WAN Image to Video");
      return;
    }
    if ((isVideoWorkflow || isTextVideoWorkflow) && !videoInstruction.trim()) {
      toast.error(isTextVideoWorkflow
        ? "Describe the video you want WAN to create"
        : "Describe the movement you want WAN to create");
      return;
    }
    setDispatching(true);
    try {
      const r = await endpoints.dispatchRender({
        character_id: isNew ? undefined : id,
        // Send primary subject DNA (backward compat) + all subjects for future backend use.
        dna: subjects[0]?.dna || {},
        subjects: subjects.map((s) => ({ label: s.label, dna: s.dna })),
        prompt_positive: positive,
        prompt_negative: negative,
        workflow_id: workflowId,
        lora_overrides: loraOverrides,
        reference_image: (isFaceWorkflow || isEditWorkflow || isVideoWorkflow) ? referenceImage?.name : undefined,
        face_strength: faceStrength,
        faceid_v2_strength: faceIdV2Strength,
        edit_instruction: isEditWorkflow ? editInstruction.trim() : undefined,
        preserve_unmentioned: preserveUnmentioned,
        video_instruction: (isVideoWorkflow || isTextVideoWorkflow) ? videoInstruction.trim() : undefined,
        video_frames: videoFrames,
        video_fps: videoFps,
        video_width: 640,
        video_height: 640,
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
    const blob = new Blob(
      [JSON.stringify({ name, subjects, locks, tags }, null, 2)],
      { type: "application/json" }
    );
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
        if (Array.isArray(parsed.subjects) && parsed.subjects.length) {
          const subs = subjectsFromCharacter({ subjects: parsed.subjects });
          setSubjects(subs);
          setActiveSubjectId(subs[0].id);
        } else if (parsed.dna) {
          const subs = subjectsFromCharacter({ dna: parsed.dna, field_locks: parsed.field_locks });
          setSubjects(subs);
          setActiveSubjectId(subs[0].id);
        }
        if (parsed.locks) setLocks(parsed.locks);
        if (Array.isArray(parsed.tags)) setTags(parsed.tags);
        toast.success("Imported");
      } catch { toast.error("Invalid JSON"); }
    };
    reader.readAsText(file);
  };

  const runSuggest = async (sectionKey) => {
    try {
      const res = await endpoints.aiSuggest(sectionKey, activeDna);
      const first = res.options?.[0];
      if (first) {
        setSection(sectionKey, { ...(activeDna[sectionKey] || {}), ...first });
        toast.success(`Suggested ${sectionKey}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI suggest failed");
    }
  };

  // -------- Subject switcher actions --------
  const addSubject = () => {
    if (subjects.length >= MAX_SUBJECTS) {
      toast.error(`Max ${MAX_SUBJECTS} subjects`);
      return;
    }
    const seeded = seedSubjectFromPairing(primaryDna, subjects.length);
    const label = subjectLabel(subjects.length);
    const newSub = makeSubject({ label, dna: seeded });
    setSubjects((cur) => [...cur, newSub]);
    setActiveSubjectId(newSub.id);
    toast.success(`Subject ${label} added`);
  };
  const removeSubject = (subjectId) => {
    if (subjects.length <= 1) return;
    setSubjects((cur) => {
      const filtered = cur.filter((s) => s.id !== subjectId);
      // Re-label sequentially so A, B, C stays contiguous
      return filtered.map((s, i) => ({ ...s, label: subjectLabel(i) }));
    });
    // If we removed the active one, snap to Subject A
    if (subjectId === activeSubjectId) setActiveSubjectId(subjects[0].id);
  };
  const copyPrimaryToActive = () => {
    if (activeSubjectIdx === 0) {
      toast.error("Copy target is Subject A itself");
      return;
    }
    const cloneDna = JSON.parse(JSON.stringify(primaryDna));
    // Preserve name — copies shouldn't have the same name field
    cloneDna.identity = { ...cloneDna.identity, name: "" };
    updateActiveSubject(() => ({ dna: cloneDna }));
    toast.success(`Copied Subject A → Subject ${activeSubject.label}`);
  };
  const randomizeActive = () =>
    updateActiveSubject((s) => ({ dna: randomizeDna(s.dna, locks, s.field_locks) }));
  const randomizeAllSubjects = () => {
    setSubjects((cur) => cur.map((s) => ({ ...s, dna: randomizeDna(s.dna, locks, s.field_locks) })));
    toast.success(`Randomized ${subjects.length} subject${subjects.length > 1 ? "s" : ""}`);
  };
  const wetDreamActive = () => {
    updateActiveSubject((s) => ({ dna: randomizeWetDream(s.dna, locks) }));
    toast.success(`Wet dream · Subject ${activeSubject.label} 🎲`);
  };

  const expectedCount = expectedSubjectCount(primaryDna);

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
          <MobileOverflow testId="builder-overflow">
            <button
              onClick={randomizeAllSubjects}
              data-testid="btn-randomize-all"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
              title={isMulti ? `Randomize all ${subjects.length} subjects` : "Randomize DNA"}
            >
              <Shuffle className="h-4 w-4" /> {isMulti ? "Randomize all" : "Randomize"}
            </button>
            <button
              onClick={wetDreamActive}
              data-testid="btn-randomize-wet-dream"
              title={isMulti ? `Wet dream on Subject ${activeSubject.label}` : "Spin feet + kink + watersports + fluids + explicit/kink dials"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-500/15 to-amber-500/15 text-fuchsia-100 hover:from-fuchsia-500/25 hover:to-amber-500/25 text-sm font-semibold px-3 py-2"
            >
              <Sparkles className="h-4 w-4" /> Wet dream{isMulti ? ` · ${activeSubject.label}` : ""}
            </button>
            <PresetsMenu
              onApply={(preset) => {
                const next = { ...preset };
                Object.keys(locks).forEach((k) => { if (locks[k]) next[k] = activeDna[k]; });
                setActiveDna(next);
                toast.success(`Preset applied to Subject ${activeSubject.label}`);
              }}
            />
            <KinkPresetsMenu
              currentDna={activeDna}
              onApply={(next) => {
                const merged = { ...next };
                Object.keys(locks).forEach((k) => { if (locks[k]) merged[k] = activeDna[k]; });
                setActiveDna(merged);
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
              title="Export DNA JSON"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <label
              data-testid="btn-import-json"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300 cursor-pointer"
              title="Import DNA JSON"
            >
              <Upload className="h-4 w-4" /> Import
              <input type="file" accept="application/json" onChange={importJson} className="hidden" />
            </label>
          </MobileOverflow>
        </div>
        </div>
        <TagInput value={tags} onChange={setTags} placeholder="tag this character (mood, ethnicity, persona)…" testId="builder-tags" />
      </div>

      {/* Subject switcher — appears when scenario expects >1 or user manually added subjects */}
      <SubjectSwitcher
        subjects={subjects}
        activeId={activeSubjectId}
        expectedCount={expectedCount}
        primaryLabel={subjects[0]?.label || "A"}
        onSelect={setActiveSubjectId}
        onAdd={addSubject}
        onRemove={removeSubject}
        onCopyFromPrimary={copyPrimaryToActive}
        onRandomizeActive={randomizeActive}
      />

      <div className="pane px-3 py-2 flex items-center gap-2" data-testid="glance-header">
        <button
          type="button"
          onClick={() => setCollapsed((cur) => ({ ...cur, _glance: !cur._glance }))}
          data-testid="btn-collapse-glance"
          className="flex items-center gap-2 text-left flex-1 group"
        >
          <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-transform ${collapsed._glance ? "-rotate-90" : ""}`} />
          <span className="section-label">DNA at a glance{isMulti ? ` · ${subjects.length} subjects` : ""}</span>
        </button>
      </div>
      {!collapsed._glance && <DnaAtAGlance dna={activeDna} name={name} subjects={isMulti ? subjects : undefined} />}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-4">
        {/* Left rail - grouped-by-phase section nav (uses active subject's dna for filled dots) */}
        <aside className="hidden lg:block h-fit sticky top-20">
          <GroupedSectionRail
            dna={activeDna}
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
            <span>Step {activeIdx + 1} of {SECTIONS.length}{isMulti && ` · Subject ${activeSubject.label}`}</span>
            <span className={`uppercase tracking-widest section-label phase-${phaseOfSection(activeSection)}`}>{SECTIONS[activeIdx].title}</span>
          </div>
          <div className="h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${((activeIdx + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>
          <DnaSection
            key={`${activeSubjectId}-${activeSection}`}
            section={SECTIONS[activeIdx]}
            value={activeDna[activeSection] || {}}
            onChange={(v) => setSection(activeSection, v)}
            locked={!!locks[activeSection]}
            onToggleLock={() => setLocks({ ...locks, [activeSection]: !locks[activeSection] })}
            onRandomize={() => setSection(activeSection, randomizeSection(activeSection, activeDna[activeSection] || {}, activeFieldLocks[activeSection] || {}))}
            onReset={() => setSection(activeSection, resetSection(activeSection))}
            onSuggest={() => runSuggest(activeSection)}
            fieldLocks={activeFieldLocks[activeSection] || {}}
            onToggleFieldLock={(fieldKey) => setActiveFieldLocks({
              ...activeFieldLocks,
              [activeSection]: { ...(activeFieldLocks[activeSection] || {}), [fieldKey]: !(activeFieldLocks[activeSection] || {})[fieldKey] },
            })}
            collapsed={!!collapsed[activeSection]}
            onToggleCollapsed={() => setCollapsed((cur) => ({ ...cur, [activeSection]: !cur[activeSection] }))}
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
          {isVideoWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="wan-video-panel">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-300" />
                <div className="section-label">WAN Image → Video</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload the starting frame, then describe movement rather than redesigning the image.
              </p>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="WAN starting frame" className="w-full max-h-72 object-contain" />
                  <button type="button" onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove WAN starting image" data-testid="btn-remove-wan-source">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 px-4 py-5 text-center hover:bg-emerald-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-300" /> : <Upload className="h-6 w-6 text-emerald-300" />}
                  <span className="text-sm font-semibold text-emerald-100">
                    {referenceUploading ? "Uploading…" : "Choose starting image"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden" data-testid="input-wan-source" />
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Movement instruction</span>
                <Textarea rows={5} value={videoInstruction}
                  onChange={(event) => setVideoInstruction(event.target.value)}
                  placeholder="Example: She slowly turns toward the camera and smiles. Natural blinking and breathing, gentle hair movement, steady camera."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-wan-motion" />
              </label>
              <button type="button" onClick={analyzeVideoImage}
                disabled={analyzingVideoImage || !referenceImage?.name}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
                data-testid="btn-venice-analyze-video-image">
                {analyzingVideoImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze image + draft motion with Venice
              </button>
              {videoImageAnalysis && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-mono uppercase tracking-widest text-cyan-300">Venice image analysis</div>
                  {videoImageAnalysis}
                </div>
              )}
              <button type="button" onClick={enhanceVideoInstruction}
                disabled={enhancingVideo || !videoInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-video">
                {enhancingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Enhance movement with Venice
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <select value={videoFrames} onChange={(e) => setVideoFrames(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-duration">
                    <option value={41}>1.7 sec · 41 frames</option>
                    <option value={81}>3.4 sec · 81 frames</option>
                    <option value={121}>5 sec · 121 frames</option>
                    <option value={161}>6.7 sec · 161 frames</option>
                    <option value={201}>8.4 sec · 201 frames</option>
                    <option value={241}>10 sec · 241 frames</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Playback FPS</span>
                  <select value={videoFps} onChange={(e) => setVideoFps(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-fps">
                    <option value={16}>16 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                  </select>
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                Longer clips require substantially more VRAM and generation time. Start with 41 frames for testing.
              </p>
            </div>
          )}
          {isTextVideoWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="wan-text-video-panel">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-violet-300" />
                <div className="section-label">WAN Text → Video</div>
              </div>
              <p className="text-xs text-zinc-400">
                Describe the complete shot: adult subject, action, environment, lighting, framing, and camera motion. No starting image is required.
              </p>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Video description</span>
                <Textarea rows={7} value={videoInstruction}
                  onChange={(event) => setVideoInstruction(event.target.value)}
                  placeholder="Example: A cinematic full-body shot of an adult woman walking through a softly lit hotel suite, natural body movement, gentle handheld camera, stable identity, one continuous shot."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-wan-text-video" />
              </label>
              <button type="button" onClick={enhanceVideoInstruction}
                disabled={enhancingVideo || !videoInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-text-video">
                {enhancingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Expand scene with Venice
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <select value={videoFrames} onChange={(e) => setVideoFrames(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-t2v-duration">
                    <option value={41}>2.6 sec · 41 frames</option>
                    <option value={81}>5.1 sec · 81 frames</option>
                    <option value={121}>7.6 sec · 121 frames</option>
                    <option value={161}>10 sec · 161 frames</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Playback FPS</span>
                  <select value={videoFps} onChange={(e) => setVideoFps(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-t2v-fps">
                    <option value={16}>16 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={24}>24 FPS</option>
                  </select>
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                This 14B workflow is much heavier than the 5B Image → Video workflow. Test with 41 frames first.
              </p>
            </div>
          )}
          {isEditWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="qwen-edit-panel">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-cyan-300" />
                <div className="section-label">Qwen Image Edit</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload the image you want to change, then describe only the changes you want made.
              </p>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="Source for editing" className="w-full max-h-72 object-contain" />
                  <button type="button" onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove source image" data-testid="btn-remove-edit-source">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 px-4 py-5 text-center hover:bg-cyan-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : <Upload className="h-6 w-6 text-cyan-300" />}
                  <span className="text-sm font-semibold text-cyan-100">
                    {referenceUploading ? "Uploading…" : "Choose source image"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden" data-testid="input-qwen-edit-source" />
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Edit instruction</span>
                <Textarea rows={5} value={editInstruction}
                  onChange={(event) => setEditInstruction(event.target.value)}
                  placeholder="Example: Change the black dress to a red satin evening gown. Keep her face, pose, body, lighting, and background unchanged."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-qwen-edit-instruction" />
              </label>
              <label className="flex items-start gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={preserveUnmentioned}
                  onChange={(event) => setPreserveUnmentioned(event.target.checked)}
                  className="mt-0.5 accent-cyan-400"
                  data-testid="checkbox-preserve-unmentioned" />
                <span>Preserve identity, composition, and every detail I did not ask to change</span>
              </label>
              <button type="button" onClick={enhanceEditInstruction}
                disabled={enhancingEdit || !editInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-edit">
                {enhancingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Enhance instruction with Venice
              </button>
              <p className="text-[11px] text-zinc-500">
                Venice only rewrites the instruction. Review and edit it before rendering.
              </p>
            </div>
          )}
          {isFaceWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="face-reference-panel">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-amber-400" />
                <div className="section-label">Face Preserve Reference</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload a clear photograph of one adult face. The photo is sent directly to your local ComfyUI input folder.
              </p>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="Face reference" className="w-full max-h-72 object-contain" />
                  <button
                    type="button"
                    onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove reference photograph"
                    data-testid="btn-remove-face-reference"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-5 text-center hover:bg-amber-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-amber-300" /> : <Upload className="h-6 w-6 text-amber-300" />}
                  <span className="text-sm font-semibold text-amber-100">
                    {referenceUploading ? "Uploading…" : "Choose reference photograph"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden"
                    data-testid="input-face-reference"
                  />
                </label>
              )}
              <label className="block space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Identity strength</span><span className="font-mono text-amber-300">{faceStrength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="1.8" step="0.05" value={faceStrength}
                  onChange={(e) => setFaceStrength(Number(e.target.value))} className="w-full accent-amber-400"
                  data-testid="slider-face-strength" />
              </label>
              <label className="block space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>FaceID v2 strength</span><span className="font-mono text-amber-300">{faceIdV2Strength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="1.8" step="0.05" value={faceIdV2Strength}
                  onChange={(e) => setFaceIdV2Strength(Number(e.target.value))} className="w-full accent-amber-400"
                  data-testid="slider-faceid-v2-strength" />
              </label>
            </div>
          )}
          <LoraPanel
            workflowId={workflowId}
            values={loraOverrides}
            onChange={setLoraOverrides}
          />
          <AiAssistBar dna={activeDna} onApplyDna={(d) => setActiveDna({ ...DEFAULT_DNA, ...d })} />
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
