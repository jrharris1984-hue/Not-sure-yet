import { useState, useMemo } from "react";
import { Star, X, Search } from "lucide-react";
import { STAR_PRESETS, DEFAULT_DNA } from "@/lib/dna";
import { Input } from "@/components/ui/input";

export default function PresetsMenu({ onApply }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return STAR_PRESETS;
    return STAR_PRESETS.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  }, [q]);

  const apply = (preset) => {
    // Deep-merge preset.dna into DEFAULT_DNA so untouched sections stay defaulted
    const next = {};
    Object.keys(DEFAULT_DNA).forEach((k) => {
      next[k] = { ...DEFAULT_DNA[k], ...(preset.dna[k] || {}) };
    });
    onApply(next);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="btn-open-presets"
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 text-rose-200 hover:bg-rose-500/10 text-sm font-semibold px-3 py-2"
      >
        <Star className="h-4 w-4" /> Star presets
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-8 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-testid="presets-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
              <Star className="h-4 w-4 text-rose-400" />
              <div className="font-display font-bold">Star presets</div>
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
            <div className="p-3 border-b hairline">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  data-testid="input-preset-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or tag (blonde, MILF, huge butt, ebony...)"
                  className="pl-9 bg-elevated border-hairline"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scroll-fade p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              Applying a preset overwrites all sections with the star's traits. Tip: lock any section first to keep it.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
