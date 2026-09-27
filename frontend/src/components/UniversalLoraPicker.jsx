import { useEffect, useMemo, useState } from "react";
import { Check, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { endpoints } from "@/lib/api";
import { compatibleInstalledLoras, workflowFamily } from "@/lib/loraRegistry";

export default function UniversalLoraPicker({ workflow, value, onChange }) {
  const [installed, setInstalled] = useState([]);
  const [query, setQuery] = useState("");
  const family = workflowFamily(workflow || {});

  useEffect(() => {
    let alive = true;
    endpoints.comfyLoras()
      .then((result) => { if (alive) setInstalled(result.loras || []); })
      .catch(() => { if (alive) setInstalled([]); });
    return () => { alive = false; };
  }, [workflow?.id]);

  const options = useMemo(
    () => compatibleInstalledLoras(workflow || {}, installed),
    [workflow, installed]
  );

  const selected = options.find((entry) => entry.installedName === value?.name);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((entry) =>
      [entry.label, entry.installedName, entry.slot, ...(entry.categories || [])]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [options, query]);

  useEffect(() => {
    if (!value?.name || !installed.length) return;
    if (!options.some((entry) => entry.installedName === value.name)) {
      onChange({ name: "", strength: 0.8, triggerWords: [] });
    }
  }, [installed, options, value?.name, onChange]);

  const choose = (entry) => {
    if (!entry) {
      onChange({ name: "", strength: 0.8, triggerWords: [] });
      return;
    }
    onChange({
      name: entry.installedName,
      strength: entry.defaultStrength ?? 0.8,
      triggerWords: entry.triggerWords || [],
    });
  };

  const strength = Number(value?.strength ?? selected?.defaultStrength ?? 0.8);
  const minStrength = selected?.minStrength ?? 0;
  const maxStrength = selected?.maxStrength ?? 1.5;

  return (
    <section className="pane overflow-hidden border-cyan-500/25" data-testid="universal-lora-picker">
      <div className="border-b border-cyan-500/15 bg-gradient-to-r from-cyan-500/10 to-transparent px-4 py-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" />
          <div className="min-w-0">
            <div className="section-label !text-cyan-300">LoRA</div>
            <p className="mt-0.5 text-xs text-zinc-400">
              One compatible LoRA at a time · {family === "unknown" ? "unclassified workflow" : family}
            </p>
          </div>
          <span className="ml-auto rounded border border-white/10 px-2 py-1 text-[10px] font-mono text-zinc-500">
            {options.length} found
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {options.length > 6 && (
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search compatible LoRAs..."
              className="w-full rounded-lg border hairline bg-elevated py-2 pl-9 pr-3 text-xs text-zinc-100 outline-none focus:border-cyan-500/50"
              data-testid="lora-search"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => choose(null)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              !value?.name
                ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                : "hairline text-zinc-400 hover:bg-white/5"
            }`}
            data-testid="lora-option-none"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              {!value?.name && <Check className="h-3.5 w-3.5" />} None
            </span>
            <span className="mt-0.5 block text-[9px] text-zinc-600">Base workflow only</span>
          </button>

          {filtered.map((entry) => {
            const active = value?.name === entry.installedName;
            return (
              <button
                key={entry.id + entry.installedName}
                type="button"
                onClick={() => choose(entry)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-100"
                    : "hairline text-zinc-400 hover:bg-white/5"
                }`}
                title={entry.installedName}
                data-testid={`lora-option-${entry.id.replace(/[^a-z0-9_-]/gi, "-")}`}
              >
                <span className="flex items-center gap-1.5 truncate text-xs font-semibold">
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{entry.label}</span>
                </span>
                <span className="mt-0.5 block truncate text-[9px] uppercase tracking-wide text-zinc-600">
                  {entry.slot === "manual" ? "local" : entry.slot}
                  {entry.triggerWords?.length ? " · trigger" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {!options.length && (
          <div className="rounded-lg border hairline bg-black/10 px-3 py-3 text-xs text-zinc-500">
            No compatible LoRAs were detected for this workflow. Put model-matched LoRAs in a family folder such as
            <span className="font-mono text-zinc-400"> models/loras/Krea2</span>,
            <span className="font-mono text-zinc-400"> /Flux</span>,
            <span className="font-mono text-zinc-400"> /Pony</span>, or another matching family folder, then restart ComfyUI.
          </div>
        )}

        {selected && (
          <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-fuchsia-300" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-200">{selected.label}</span>
              <span className="font-mono text-xs text-fuchsia-200">{strength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={minStrength}
              max={maxStrength}
              step="0.05"
              value={strength}
              onChange={(event) => onChange({
                name: selected.installedName,
                strength: Number(event.target.value),
                triggerWords: selected.triggerWords || [],
              })}
              className="w-full accent-fuchsia-400"
              data-testid="universal-lora-strength"
            />
            <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-600">
              <span>{minStrength.toFixed(2)}</span>
              <span>recommended {Number(selected.defaultStrength ?? 0.8).toFixed(2)}</span>
              <span>{maxStrength.toFixed(2)}</span>
            </div>
            {selected.triggerWords?.length > 0 && (
              <p className="mt-2 text-[10px] text-zinc-500">
                Trigger added automatically: <span className="font-mono text-cyan-300">{selected.triggerWords.join(", ")}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
