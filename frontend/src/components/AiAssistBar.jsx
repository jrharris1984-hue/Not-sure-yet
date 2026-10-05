import { readDescriptionDraft, writeDescriptionDraft } from '@/lib/builderDraft';
import { WebPromptResearchOptions } from '@/components/WebPromptResearch';
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Loader2, ChevronDown, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { DEFAULT_DNA } from "@/lib/dna";
import { normalizeAiSceneSubjects } from "@/lib/aiSceneDraft";

export default function AiAssistBar({ dna, onApplyDna, onApplySubjects, aiProvider = "AI" }) {
  const [text, setText] = useState(readDescriptionDraft);
  const [refineText, setRefineText] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(null);
  const [savedDescriptions, setSavedDescriptions] = useState([]);
  const [descriptionName, setDescriptionName] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedError, setSavedError] = useState("");

  useEffect(() => {
    writeDescriptionDraft(text);
  }, [text]);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    endpoints.listSavedDescriptions().then(descriptions => {
      if (active) { setSavedDescriptions(descriptions); setSavedError(""); }
    }).catch(() => {
      if (active) setSavedError("Could not load saved descriptions. Close and reopen this panel to retry.");
    });
    return () => { active = false; };
  }, [expanded]);

  const saveDescription = async () => {
    if (!text.trim() || !descriptionName.trim()) return;
    setSaving(true);
    try {
      const saved = await endpoints.createSavedDescription({ name: descriptionName.trim(), text: text.trim() });
      setSavedDescriptions(current => [saved, ...current]);
      setSelectedDescription(saved.id);
      toast.success("Description saved");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not save description");
    } finally { setSaving(false); }
  };

  const deleteDescription = async () => {
    if (!selectedDescription) return;
    setSaving(true);
    try {
      await endpoints.deleteSavedDescription(selectedDescription);
      setSavedDescriptions(current => current.filter(item => item.id !== selectedDescription));
      setSelectedDescription("");
      toast.success("Saved description deleted");
    } catch { toast.error("Could not delete description"); }
    finally { setSaving(false); }
  };


  const previewDraft = (suggestion, source) => {
    const changes = Object.entries(suggestion || {}).flatMap(([section, values]) =>
      DEFAULT_DNA[section] && values && typeof values === "object" && !Array.isArray(values)
        ? Object.entries(values).filter(([field, value]) => field in DEFAULT_DNA[section] && value !== null && value !== "")
          .map(([field, value]) => ({ section, field, value: section === "identity" && field === "age" ? Math.max(21, Number(value) || 21) : value, previous: dna?.[section]?.[field] }))
        : []);
    if (!changes.length) throw new Error("AI did not suggest any usable settings");
    setDraft({ suggestion, changes, source });
  };

  const freeform = async () => {
    if (!text.trim()) return;
    setBusy("freeform");
    try {
      const res = await endpoints.aiSceneDraft(text.trim());
      const subjects = normalizeAiSceneSubjects(res.subjects);
      if (!subjects.length) throw new Error("AI did not propose separate adult subjects");
      setDraft({ source: "scene", subjects });
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || `${aiProvider} could not generate DNA`);
    } finally {
      setBusy("");
    }
  };

  const refine = async () => {
    if (!refineText.trim()) return;
    setBusy("refine");
    try {
      const res = await endpoints.aiRefine(dna, refineText.trim());
      previewDraft(res.dna, "refinement");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI refine failed");
    } finally {
      setBusy("");
    }
  };

  const applyDraft = () => {
    if (!draft) return;
    if (draft.source === "scene") {
      onApplySubjects(draft.subjects);
      toast.success(`${draft.subjects.length} adult subject${draft.subjects.length === 1 ? "" : "s"} added. Review their settings before rendering.`);
      setDraft(null);
      return;
    }
    // A new description starts a fresh character. Refinements preserve other choices.
    const next = draft.source === "description" ? JSON.parse(JSON.stringify(DEFAULT_DNA)) : { ...dna };
    for (const { section, field, value } of draft.changes) {
      next[section] = { ...(next[section] || {}), [field]: value };
    }
    onApplyDna(next);
    toast.success(`${draft.changes.length} setting${draft.changes.length === 1 ? "" : "s"} applied. Review the prompt before rendering.`);
    setDraft(null);
    if (draft.source !== "description") setRefineText("");
  };

  return (
    <div className="pane p-4 space-y-3" data-testid="ai-guided-create">
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <div className="section-label flex-1">Describe it with {aiProvider}</div>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className="space-y-3 ai-assist-reveal">
      <WebPromptResearchOptions disabled={!!busy}/>
      <p className="text-xs text-zinc-400">Describe one to four adults. AI will propose a separate profile for each person. Refine changes only the current subject.</p>

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono">Freeform → DNA</div>
        <Textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setDraft(null); }}
          rows={2}
          placeholder='e.g. "two adult friends in a garden, one with silver hair and one with dark curls"'
          className="bg-elevated border-hairline text-zinc-100 text-sm"
          maxLength={20000}
          data-testid="input-ai-freeform"
        />
        <button
          onClick={freeform}
          disabled={busy === "freeform" || !text.trim()}
          data-testid="btn-ai-freeform-generate"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold px-3 py-2 transition-colors"
        >
          {busy === "freeform" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Draft scene
        </button>
        <button type="button" data-testid="btn-clear-ai-description" aria-label="Clear description"
          disabled={!!busy || saving || !text}
          onClick={() => { setText(""); setDescriptionName(""); setSelectedDescription(""); setDraft(null); }}
          className="ml-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40">
          Clear
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] text-zinc-400">Your draft stays during this session. Closing or refreshing clears unfinished text. Save a named description to reuse it on any device.</p>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Description name" placeholder="Description name" maxLength={100}
            value={descriptionName} onChange={e => setDescriptionName(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100" />
          <button type="button" onClick={saveDescription} disabled={saving || !text.trim() || !descriptionName.trim()}
            className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 disabled:opacity-40">
            <Save className="h-4 w-4" /> Save description
          </button>
        </div>
        {savedError && <p role="status" className="text-xs text-amber-200">{savedError}</p>}
        {savedDescriptions.length > 0 && <div className="flex flex-wrap gap-2">
          <select aria-label="Saved descriptions" value={selectedDescription} disabled={saving}
            onChange={e => {
              const selected = savedDescriptions.find(item => item.id === e.target.value);
              setSelectedDescription(e.target.value);
              if (selected) { setText(selected.text); setDescriptionName(selected.name); setDraft(null); }
            }} className="min-w-0 flex-1 rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100">
            <option value="">Load a saved description…</option>
            {savedDescriptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" aria-label="Delete saved description" onClick={deleteDescription}
            disabled={saving || !selectedDescription}
            className="rounded-lg border hairline px-3 py-2 text-zinc-400 hover:text-red-300 disabled:opacity-40">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>}
      </div>

      <div className="h-px bg-hairline" />

      {draft && <div className="space-y-2 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3" data-testid="ai-dna-preview">
        {draft.source === "scene" ? <>
          <div className="text-xs font-semibold text-cyan-100">Review {draft.subjects.length} adult subject{draft.subjects.length === 1 ? "" : "s"}</div>
          <p className="text-[11px] text-amber-200">Applying this scene replaces the current subject profiles. You can edit each person afterward.</p>
          <div className="max-h-52 space-y-2 overflow-y-auto">
            {draft.subjects.map((subject) => <div key={subject.id} className="rounded-lg border hairline p-2 text-xs text-zinc-300">
              <span className="font-semibold text-cyan-100">Subject {subject.label}</span> · age {subject.dna.identity.age}
              <div>{[subject.dna.identity.ethnicity, subject.dna.hair.color, subject.dna.hair.style, subject.dna.wardrobe.outfit_preset].filter(Boolean).join(" · ") || "Review profile after applying"}</div>
            </div>)}
          </div>
        </> : <>
        <div className="text-xs font-semibold text-cyan-100">Review {draft.changes.length} proposed settings</div>
        {draft.source === "description" && <p className="text-[11px] text-amber-200">Applying a new description clears old character settings that are not listed here.</p>}
        <div className="max-h-48 space-y-1 overflow-y-auto text-xs text-zinc-300">
          {draft.changes.map(({ section, field, value, previous }) =>
            <div key={`${section}.${field}`} className="flex gap-2 border-b border-white/5 py-1">
              <span className="min-w-[110px] text-zinc-500">{section} · {field}</span>
              <span className="break-words">{previous ? `${String(previous)} → ` : ""}{Array.isArray(value) ? value.join(", ") : String(value)}</span>
            </div>)}
        </div>
        </>}
        <div className="flex gap-2">
          <button type="button" onClick={applyDraft} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-black">Apply settings</button>
          <button type="button" onClick={() => setDraft(null)} className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-300">Discard</button>
        </div>
      </div>}

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono">Refine current DNA</div>
        <Textarea
          value={refineText}
          onChange={(e) => setRefineText(e.target.value)}
          rows={2}
          placeholder='e.g. "make her older, more athletic, harsher lighting"'
          className="bg-elevated border-hairline text-zinc-100 text-sm"
          data-testid="input-ai-refine"
        />
        <button
          onClick={refine}
          disabled={busy === "refine" || !refineText.trim()}
          data-testid="btn-ai-refine"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 text-sm font-semibold px-3 py-2 transition-colors"
        >
          {busy === "refine" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Apply Refine
        </button>
      </div>
      </div>}
    </div>
  );
}
