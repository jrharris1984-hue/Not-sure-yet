import { useState, useMemo } from "react";
import { Flame, X, Search, Save, Trash2 } from "lucide-react";
import { KINK_PRESETS, DEFAULT_DNA } from "@/lib/dna";
import { endpoints } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Deep-merge preset patch into a base DNA object — only override sections/fields in the patch.
function mergePreset(base, patch) {
  const out = { ...base };
  Object.entries(patch || {}).forEach(([sec, fields]) => {
    out[sec] = { ...(out[sec] || {}), ...(fields || {}) };
  });
  return out;
}

export default function KinkPresetsMenu({ currentDna, onApply }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

  const apply = (preset) => {
    onApply(mergePreset(currentDna || DEFAULT_DNA, preset.dna));
    toast.success(`Applied "${preset.name}"`);
    setOpen(false);
  };

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
              <Flame className="h-4 w-4 text-fuchsia-400" />
              <div className="font-display font-bold">Kink presets</div>
              <span className="text-xs text-zinc-500 font-mono">{filtered.length}</span>
              <div className="flex-1" />
              <button
                onClick={saveCurrent}
                data-testid="btn-save-kink-preset"
                className="inline-flex items-center gap-1 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono px-2 py-1 hover:bg-fuchsia-500/20"
              >
                <Save className="h-3 w-3" /> save current
              </button>
              <button
                onClick={() => setOpen(false)}
                data-testid="btn-close-kink-presets"
                className="h-8 w-8 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 border-b hairline">
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
            </div>
            <div className="max-h-[60vh] overflow-y-auto scroll-fade p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((p) => (
                <div
                  key={`${p.source}-${p.name}`}
                  className="relative text-left p-3 rounded-lg border hairline bg-elevated hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 transition-colors"
                >
                  <button
                    onClick={() => apply(p)}
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
            </div>
            <div className="px-4 py-2.5 border-t hairline text-[11px] text-zinc-500">
              Applying a kink preset patches only the kink/feet/watersports/mess sections — identity, wardrobe and scene stay put.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
