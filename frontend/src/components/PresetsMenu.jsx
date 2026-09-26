import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, X, Search, Wand2, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import {
  STAR_PRESETS,
  HERITAGE_PRESETS,
  STORYBOOK_PRESETS,
  DEFAULT_DNA,
  SECTIONS,
  HERITAGE_DENSITIES,
  HERITAGE_CASTS,
  createHeritageCharacterVariation,
} from "@/lib/dna";
import { Input } from "@/components/ui/input";

const DNA_CATALOG = Object.fromEntries(SECTIONS.map((section) => [
  section.key,
  Object.fromEntries(section.fields.map((field) => [field.key, {
    type: field.type,
    options: field.groups ? field.groups.flatMap((group) => group.options) : (field.options || undefined),
    min: field.min,
    max: field.max,
  }]))
]));

export default function PresetsMenu({ onApply, currentDna, sectionLocks = {}, fieldLocks = {} }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("stars");
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState(null);
  const [heritageMode, setHeritageMode] = useState("complete");
  const [heritageDensity, setHeritageDensity] = useState("balanced");
  const [heritageCast, setHeritageCast] = useState("solo");
  const [lastHeritage, setLastHeritage] = useState(null);
  const qc = useQueryClient();
  const { data: customPresets = [] } = useQuery({
    queryKey: ["character-presets"],
    queryFn: endpoints.listCharacterPresets,
    enabled: open,
  });

  const source = category === "heritage"
    ? HERITAGE_PRESETS
    : category === "storybook"
      ? STORYBOOK_PRESETS
      : category === "custom"
        ? customPresets
      : STAR_PRESETS;

  const generate = useMutation({
    mutationFn: () => endpoints.aiCharacterPreset(description.trim(), DNA_CATALOG),
    onSuccess: (result) => {
      setDraft(result);
      toast.success("Venice created a preset draft");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Venice could not create the preset"),
  });
  const savePreset = useMutation({
    mutationFn: (preset) => endpoints.createCharacterPreset(preset),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["character-presets"] });
      setDraft(null);
      setDescription("");
      setCategory("custom");
      toast.success("Saved to My Presets");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not save the preset"),
  });
  const deletePreset = useMutation({
    mutationFn: endpoints.deleteCharacterPreset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["character-presets"] });
      toast.success("Preset deleted");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not delete the preset"),
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return source;
    return source.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  }, [q, source]);

  const apply = (preset, requestedMode) => {
    const isHeritage = category === "heritage" || requestedMode === "variation";
    const mode = requestedMode || (isHeritage ? heritageMode : "preset");
    const base = isHeritage && currentDna ? currentDna : DEFAULT_DNA;
    let next = {};
    Object.keys(DEFAULT_DNA).forEach((k) => {
      next[k] = { ...DEFAULT_DNA[k], ...(base[k] || {}), ...(preset.dna[k] || {}) };
    });

    if (isHeritage && (mode === "complete" || mode === "variation")) {
      next = createHeritageCharacterVariation(
        currentDna || DEFAULT_DNA,
        preset.dna || {},
        sectionLocks,
        fieldLocks,
        { density: heritageDensity }
      );
    }

    onApply(next, isHeritage ? { type: "heritage", cast: heritageCast } : { type: "preset" });
    if (isHeritage) {
      setLastHeritage(preset);
      toast.success(mode === "heritage" ? "Heritage applied" : "Complete heritage character created");
    }
    setOpen(false);
    window.dispatchEvent(new CustomEvent("ultra-studio:overflow-close"));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-overflow-stay-open
        data-testid="btn-open-presets"
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 text-rose-200 hover:bg-rose-500/10 text-sm font-semibold px-3 py-2"
      >
        <Star className="h-4 w-4" /> Character presets
      </button>
      {open && createPortal(
        <div
          data-overflow-stay-open
          className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-8 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-testid="presets-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-[100dvh] sm:h-auto sm:max-h-[88vh] max-w-2xl bg-surface border border-hairline rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
              <Star className="h-4 w-4 text-rose-400" />
              <div className="font-display font-bold">Character presets</div>
              <span className="text-xs text-zinc-500 font-mono">{filtered.length}</span>
              <div className="flex-1" />
              <button
                onClick={() => setOpen(false)}
                data-testid="btn-close-presets"
                className="h-8 w-8 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 pt-3 grid grid-cols-4 gap-1.5 shrink-0" role="tablist" aria-label="Preset categories">
              {[
                ["stars", "Styles"],
                ["heritage", "Heritage"],
                ["storybook", "Storybook"],
                ["custom", "My Presets"],
              ].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={category === key}
                  onClick={() => { setCategory(key); setQ(""); }}
                  className={`min-w-0 rounded-lg border px-1.5 py-2 text-[11px] sm:text-xs font-semibold truncate ${category === key ? "border-rose-400 bg-rose-500/15 text-rose-200" : "hairline text-zinc-400"}`}>
                  {label}
                </button>
              ))}
            </div>
            {category === "heritage" && (
              <div className="px-3 py-3 border-b hairline bg-amber-500/[0.04] space-y-2" data-testid="heritage-generation-options">
                <div>
                  <div className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Choose cast first</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(HERITAGE_CASTS).map(([key, option]) => (
                      <button key={key} type="button" onClick={() => setHeritageCast(key)}
                        data-testid={`heritage-cast-${key}`}
                        className={`rounded-lg border px-1.5 py-2 text-[10px] sm:text-xs font-semibold ${heritageCast === key ? "border-rose-400 bg-rose-500/15 text-rose-100" : "hairline text-zinc-400"}`}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-zinc-500">Family casts share heritage and recognizable traits. Every generated subject remains 21+.</p>
                </div>
                <div>
                  <div className="text-xs font-display font-bold text-amber-200">How should the heritage preset apply?</div>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
                    Complete character varies appearance, outfit, pose, and the selected body details. Play, fluids, acts, and Explicit/Kink stay untouched.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setHeritageMode("heritage")}
                    data-testid="heritage-mode-only"
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${heritageMode === "heritage" ? "border-amber-400 bg-amber-500/15 text-amber-100" : "hairline text-zinc-400"}`}>
                    Heritage only
                  </button>
                  <button type="button" onClick={() => setHeritageMode("complete")}
                    data-testid="heritage-mode-complete"
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${heritageMode === "complete" ? "border-amber-400 bg-amber-500/15 text-amber-100" : "hairline text-zinc-400"}`}>
                    Complete character
                  </button>
                </div>
                {heritageMode === "complete" && (
                  <div>
                    <div className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Detail density</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(HERITAGE_DENSITIES).map(([key, option]) => (
                        <button key={key} type="button" onClick={() => setHeritageDensity(key)}
                          data-testid={`heritage-density-${key}`}
                          className={`rounded-lg border px-1.5 py-2 text-[10px] sm:text-xs font-semibold ${heritageDensity === key ? "border-violet-400 bg-violet-500/15 text-violet-100" : "hairline text-zinc-400"}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-zinc-500">Optional details may stay empty. Feet are uncommon unless you choose them yourself.</p>
                  </div>
                )}
                {lastHeritage && (
                  <button type="button" onClick={() => apply(lastHeritage, "variation")}
                    data-testid="btn-another-heritage-variation"
                    className="w-full rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/15">
                    Create another {lastHeritage.name} variation
                  </button>
                )}
              </div>
            )}
            <div className="p-3 border-b hairline">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  data-testid="input-preset-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={category === "heritage" ? "Search every ethnicity…" : "Search presets by name or tag…"}
                  className="pl-9 bg-elevated border-hairline"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-fade p-3 grid content-start grid-cols-1 sm:grid-cols-2 gap-2">
              {category === "custom" && (
                <div className="col-span-full rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 font-display font-bold text-sm text-violet-200">
                      <Wand2 className="h-4 w-4" /> Create with Venice
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">Describe the adult character you want. Venice can only select fields and values Ultra Studio supports.</p>
                  </div>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)}
                    placeholder="Example: A confident 42-year-old Colombian woman with an athletic hourglass build, long wavy black hair, warm editorial styling, and natural skin texture."
                    className="w-full min-h-28 resize-y rounded-lg border hairline bg-elevated p-3 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
                    data-testid="input-venice-character-preset" />
                  <button type="button" onClick={() => generate.mutate()}
                    disabled={!description.trim() || generate.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
                    data-testid="btn-generate-character-preset">
                    {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {generate.isPending ? "Venice is designing…" : "Create preset draft"}
                  </button>
                  {draft && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                      <Input value={draft.name || ""} onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                        className="bg-elevated border-hairline font-semibold" aria-label="Preset name" />
                      <div className="flex flex-wrap gap-1">
                        {(draft.tags || []).map((tag) => <span key={tag} className="rounded-full border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-200">{tag}</span>)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => apply(draft)} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200">Preview & apply</button>
                        <button type="button" onClick={() => savePreset.mutate({ ...draft, source: "venice" })}
                          disabled={!draft.name?.trim() || savePreset.isPending}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
                          <Save className="h-3.5 w-3.5" /> Save preset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {filtered.map((p) => (
                <div key={p.id || p.name} className="relative rounded-lg border hairline bg-elevated hover:border-rose-500/40 transition-colors">
                  <button onClick={() => apply(p)} data-testid={`preset-${p.name.replace(/\s+/g, "-")}`}
                    className="w-full text-left p-3 pr-10 rounded-lg hover:bg-rose-500/5">
                    <div className="font-display font-bold text-sm">{p.name}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(p.tags || []).map((t) => (
                        <span key={t} className="text-[10px] font-mono uppercase tracking-widest text-rose-300/90 bg-rose-500/10 border border-rose-500/30 rounded-full px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  </button>
                  {category === "custom" && p.id && (
                    <button type="button" onClick={() => { if (window.confirm(`Delete ${p.name}?`)) deletePreset.mutate(p.id); }}
                      className="absolute right-2 top-2 h-7 w-7 grid place-items-center rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Delete ${p.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}
              {filtered.length === 0 && category !== "custom" && (
                <div className="col-span-full text-center text-sm text-zinc-500 py-8">No matches</div>
              )}
              {category === "custom" && filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-zinc-500 py-5">No saved presets yet. Describe one above and let Venice build it.</div>
              )}
            </div>
            <div className="px-4 py-2.5 border-t hairline text-[11px] text-zinc-500">
              Presets are editable starting points. Applying one replaces its supplied DNA traits; you can adjust every field afterward.
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
