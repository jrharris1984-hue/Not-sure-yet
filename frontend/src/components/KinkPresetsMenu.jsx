import { useState, useMemo } from "react";
import { Flame, X, Search, Save, Trash2, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { KINK_PRESETS, DEFAULT_DNA } from "@/lib/dna";
import { endpoints } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  applyAdjustedKinkPreset,
  kinkPresetChangeSummary,
  KINK_EDITOR_SECTIONS,
  presetSectionOptions,
} from "@/lib/kinkPresetEditor";

export default function KinkPresetsMenu({ currentDna, onApply }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [sections, setSections] = useState({});
  const [explicitLevel, setExplicitLevel] = useState(0);
  const [kinkLevel, setKinkLevel] = useState(0);
  const [powerDynamic, setPowerDynamic] = useState("preset");
  const [restraintMode, setRestraintMode] = useState("preset");
  const [role, setRole] = useState("preset");
  const [position, setPosition] = useState("preset");
  const [expression, setExpression] = useState("preset");
  const [mood, setMood] = useState("preset");
  const qc = useQueryClient();

  const { data: userPresets = [] } = useQuery({
    queryKey: ["kink-presets"],
    queryFn: endpoints.listKinkPresets,
    enabled: open,
  });

  const save = useMutation({
    mutationFn: (body) => endpoints.createKinkPreset(body),
    onSuccess: () => {
      toast.success("Kink preset saved");
      qc.invalidateQueries({ queryKey: ["kink-presets"] });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id) => endpoints.deleteKinkPreset(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["kink-presets"] });
    },
  });

  const all = useMemo(() => {
    const builtIn = KINK_PRESETS.map((p) => ({ ...p, source: "builtin" }));
    const custom = userPresets.map((p) => ({ ...p, source: "user" }));
    return [...builtIn, ...custom];
  }, [userPresets]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  }, [q, all]);

  const beginReview = (preset) => {
    const enabled = presetSectionOptions(preset);
    // Character styling should never change silently. It remains available as an opt-in.
    enabled.wardrobe = false;
    enabled.scene = false;
    enabled.lighting = false;
    setSections(enabled);
    setExplicitLevel(preset.dna?.scenario?.explicit_level ?? currentDna?.scenario?.explicit_level ?? 0);
    setKinkLevel(preset.dna?.scenario?.kink_level ?? currentDna?.scenario?.kink_level ?? 0);
    setPowerDynamic(preset.dna?.kink?.power_dynamic ? "preset" : "preserve");
    setRestraintMode(preset.dna?.kink?.restraint?.length ? "preset" : "preserve");
    setRole(preset.dna?.scenario?.roleplay ? "preset" : "preserve");
    setPosition(preset.dna?.pose?.action ? "preset" : "preserve");
    setExpression(preset.dna?.face?.expression ? "preset" : "preserve");
    setMood(preset.dna?.lighting?.mood ? "preset" : "preserve");
    setSelectedPreset(preset);
  };

  const apply = () => {
    if (!selectedPreset) return;
    onApply(applyAdjustedKinkPreset(currentDna || DEFAULT_DNA, selectedPreset, {
      sections, explicitLevel, kinkLevel, powerDynamic, restraintMode, role, position, expression, mood,
    }));
    toast.success(`Applied adjusted "${selectedPreset.name}"`);
    setSelectedPreset(null);
    setOpen(false);
  };

  const summary = selectedPreset ? kinkPresetChangeSummary(selectedPreset, sections) : [];

  const saveCurrent = () => {
    const name = window.prompt("Name this kink preset:");
    if (!name || !name.trim()) return;
    // Store only kink-relevant sections to avoid overwriting identity when re-applied
    const patch = {};
    ["feet", "kink", "watersports"].forEach((k) => {
      if (currentDna?.[k]) patch[k] = currentDna[k];
    });
    // Also carry fluids/mess subsections + scenario dials
    if (currentDna?.intimate) {
      const im = currentDna.intimate;
      const carry = {};
      ["cum_state", "saliva", "squirt", "lactation", "sweat", "lube", "tears"].forEach((f) => {
        if (im[f] !== undefined && im[f] !== "" && !(Array.isArray(im[f]) && im[f].length === 0)) {
          carry[f] = im[f];
        }
      });
      if (Object.keys(carry).length) patch.intimate = carry;
    }
    if (currentDna?.scenario) {
      const sc = currentDna.scenario;
      const carry = {};
      ["explicit_level", "kink_level", "acts"].forEach((f) => {
        if (sc[f] !== undefined && sc[f] !== "" && !(Array.isArray(sc[f]) && sc[f].length === 0)) {
          carry[f] = sc[f];
        }
      });
      if (Object.keys(carry).length) patch.scenario = carry;
    }
    save.mutate({ name: name.trim(), tags: ["custom"], dna: patch });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-overflow-stay-open
        data-testid="btn-open-kink-presets"
        className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10 text-sm font-semibold px-3 py-2"
      >
        <Flame className="h-4 w-4" /> Kink presets
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-8 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-testid="kink-presets-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
              {selectedPreset && (
                <button type="button" onClick={() => setSelectedPreset(null)}
                  className="h-8 w-8 grid place-items-center rounded-md text-zinc-300 hover:bg-white/5"
                  aria-label="Back to kink presets" data-testid="btn-kink-editor-back">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <Flame className="h-4 w-4 text-fuchsia-400" />
              <div className="font-display font-bold">{selectedPreset ? selectedPreset.name : "Kink presets"}</div>
              {!selectedPreset && <span className="text-xs text-zinc-500 font-mono">{filtered.length}</span>}
              <div className="flex-1" />
              {!selectedPreset && <button
                onClick={saveCurrent}
                data-testid="btn-save-kink-preset"
                className="inline-flex items-center gap-1 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono px-2 py-1 hover:bg-fuchsia-500/20"
              >
                <Save className="h-3 w-3" /> save current
              </button>}
              <button
                onClick={() => setOpen(false)}
                data-testid="btn-close-kink-presets"
                className="h-8 w-8 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {!selectedPreset && <div className="p-3 border-b hairline">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  data-testid="input-kink-preset-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (feet, cum, shibari, watersports...)"
                  className="pl-9 bg-elevated border-hairline"
                  autoFocus
                />
              </div>
            </div>}
            {!selectedPreset ? <div className="max-h-[60vh] overflow-y-auto scroll-fade p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((p) => (
                <div
                  key={`${p.source}-${p.name}`}
                  className="relative text-left p-3 rounded-lg border hairline bg-elevated hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 transition-colors"
                >
                  <button
                    onClick={() => beginReview(p)}
                    data-testid={`kink-preset-${p.name.replace(/\s+/g, "-")}`}
                    className="text-left w-full"
                  >
                    <div className="font-display font-bold text-sm pr-6">{p.name}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(p.tags || []).map((t) => (
                        <span key={t} className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300/90 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                      {p.source === "user" && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-1.5 py-0.5">saved</span>
                      )}
                    </div>
                  </button>
                  {p.source === "user" && (
                    <button
                      type="button"
                      onClick={() => window.confirm(`Delete "${p.name}"?`) && del.mutate(p.id)}
                      data-testid={`btn-delete-kink-preset-${p.name.replace(/\s+/g, "-")}`}
                      className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-md text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-zinc-500 py-8">No matches</div>
              )}
            </div> : (
              <div className="max-h-[72vh] overflow-y-auto scroll-fade p-4 space-y-5" data-testid="kink-preset-editor">
                <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-display font-bold text-fuchsia-100">
                    <SlidersHorizontal className="h-4 w-4" /> Review before applying
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">Identity, heritage, body shape, and hair are always preserved. Uncheck anything this preset should not change.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-300"><span>Explicit intensity</span><span className="font-mono text-amber-300">{explicitLevel}%</span></div>
                    <input type="range" min="0" max="100" value={explicitLevel} onChange={(e) => setExplicitLevel(Number(e.target.value))}
                      className="w-full accent-amber-400" data-testid="kink-editor-explicit-level" />
                  </label>
                  <label className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-300"><span>Kink intensity</span><span className="font-mono text-fuchsia-300">{kinkLevel}%</span></div>
                    <input type="range" min="0" max="100" value={kinkLevel} onChange={(e) => setKinkLevel(Number(e.target.value))}
                      className="w-full accent-fuchsia-400" data-testid="kink-editor-kink-level" />
                  </label>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Preset ingredients</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {KINK_EDITOR_SECTIONS.filter(([key]) => selectedPreset.dna?.[key]).map(([key, label]) => (
                      <label key={key} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs cursor-pointer ${sections[key] ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100" : "hairline text-zinc-500"}`}>
                        <input type="checkbox" checked={!!sections[key]} onChange={(e) => setSections({ ...sections, [key]: e.target.checked })}
                          className="accent-fuchsia-500" data-testid={`kink-editor-section-${key}`} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Power dynamic</span>
                    <select value={powerDynamic} onChange={(e) => setPowerDynamic(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-power-dynamic">
                      <option value="preserve">Preserve current</option><option value="preset">Use preset</option>
                      <option value="none">Neutral</option><option value="dominant">Dominant</option><option value="submissive">Submissive</option><option value="switch">Switch</option>
                      <option value="master and slave">Master and slave</option><option value="owner and pet">Owner and pet</option><option value="goddess and worshipper">Goddess and worshipper</option>
                    </select>
                  </label>
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Restraint level</span>
                    <select value={restraintMode} onChange={(e) => setRestraintMode(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-restraint">
                      <option value="preserve">Preserve current</option><option value="preset">Use full preset</option><option value="none">None</option><option value="light">Light</option><option value="moderate">Moderate</option>
                    </select>
                  </label>
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Role</span>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-role">
                      <option value="preserve">Preserve current</option><option value="preset">Use preset</option><option value="none">None</option><option value="dominatrix">Dominatrix</option><option value="submissive">Submissive</option><option value="goddess">Goddess</option><option value="milf">MILF</option><option value="cougar">Cougar</option>
                    </select>
                  </label>
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Body position</span>
                    <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-position">
                      <option value="preserve">Preserve current</option><option value="preset">Use preset</option><option value="standing">Standing</option><option value="seated">Seated</option><option value="kneeling">Kneeling</option><option value="all fours">All fours</option><option value="reclining">Reclining</option>
                    </select>
                  </label>
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Expression</span>
                    <select value={expression} onChange={(e) => setExpression(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-expression">
                      <option value="preserve">Preserve current</option><option value="preset">Use preset</option><option value="neutral">Neutral</option><option value="smirk">Smirk</option><option value="smile">Smile</option><option value="serious">Serious</option><option value="sultry">Sultry</option>
                    </select>
                  </label>
                  <label className="space-y-1"><span className="text-xs text-zinc-400">Mood</span>
                    <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm" data-testid="kink-editor-mood">
                      <option value="preserve">Preserve current</option><option value="preset">Use preset</option><option value="sensual">Sensual</option><option value="dramatic">Dramatic</option><option value="playful">Playful</option><option value="dark">Dark</option><option value="romantic">Romantic</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-lg border hairline bg-elevated p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">This will change</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {summary.length ? summary.map((item) => <span key={item} className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] text-fuchsia-200">{item}</span>) : <span className="text-xs text-zinc-500">Only the intensity sliders</span>}
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-300">Preserved: identity, heritage, physique, hair, and every unchecked section.</div>
                </div>

                <button type="button" onClick={apply} className="w-full rounded-lg bg-fuchsia-500 px-4 py-3 text-sm font-bold text-white hover:bg-fuchsia-400" data-testid="btn-apply-adjusted-kink-preset">
                  Apply adjusted preset
                </button>
              </div>
            )}
            {!selectedPreset && <div className="px-4 py-2.5 border-t hairline text-[11px] text-zinc-500">
              Select a preset to review exactly what it changes before applying it.
            </div>}
          </div>
        </div>
      )}
    </>
  );
}
