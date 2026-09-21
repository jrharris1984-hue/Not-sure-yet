import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Star, X, Search } from "lucide-react";
import { STAR_PRESETS, HERITAGE_PRESETS, STORYBOOK_PRESETS, DEFAULT_DNA } from "@/lib/dna";
import { Input } from "@/components/ui/input";

export default function PresetsMenu({ onApply, currentDna }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("stars");

  const source = category === "heritage"
    ? HERITAGE_PRESETS
    : category === "storybook"
      ? STORYBOOK_PRESETS
      : STAR_PRESETS;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return source;
    return source.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  }, [q, source]);

  const apply = (preset) => {
    // Heritage selectors preserve the character already being designed. Fuller
    // style/story presets intentionally begin from defaults.
    const base = category === "heritage" && currentDna ? currentDna : DEFAULT_DNA;
    const next = {};
    Object.keys(DEFAULT_DNA).forEach((k) => {
      next[k] = { ...DEFAULT_DNA[k], ...(base[k] || {}), ...(preset.dna[k] || {}) };
    });
    onApply(next);
    setOpen(false);
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
            <div className="px-3 pt-3 grid grid-cols-3 gap-2 shrink-0" role="tablist" aria-label="Preset categories">
              {[
                ["stars", "Styles"],
                ["heritage", "Heritage"],
                ["storybook", "Storybook 21+"],
              ].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={category === key}
                  onClick={() => { setCategory(key); setQ(""); }}
                  className={`min-w-0 rounded-lg border px-1.5 py-2 text-[11px] sm:text-xs font-semibold truncate ${category === key ? "border-rose-400 bg-rose-500/15 text-rose-200" : "hairline text-zinc-400"}`}>
                  {label}
                </button>
              ))}
            </div>
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
              {filtered.map((p) => (
                <button
                  key={p.name}
                  onClick={() => apply(p)}
                  data-testid={`preset-${p.name.replace(/\s+/g, "-")}`}
                  className="text-left p-3 rounded-lg border hairline bg-elevated hover:border-rose-500/40 hover:bg-rose-500/5 transition-colors"
                >
                  <div className="font-display font-bold text-sm">{p.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(p.tags || []).map((t) => (
                      <span key={t} className="text-[10px] font-mono uppercase tracking-widest text-rose-300/90 bg-rose-500/10 border border-rose-500/30 rounded-full px-1.5 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-zinc-500 py-8">No matches</div>
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
