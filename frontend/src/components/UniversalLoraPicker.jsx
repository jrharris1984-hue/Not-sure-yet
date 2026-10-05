import { useEffect, useMemo, useState } from "react";
import { Check, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { endpoints } from "@/lib/api";
import { readLoraPreferences, saveLoraPreference, loraFileKey, LORA_PREFERENCES_CHANGED } from "@/lib/loraPreferences";
import { compatibleInstalledLoras, workflowFamily } from "@/lib/loraRegistry";

export default function UniversalLoraPicker({ workflow, value, onChange, slotLabel = "LoRA", excludedNames = [] }) {
  const [preferences, setPreferences] = useState(readLoraPreferences);
  const [saveError, setSaveError] = useState("");
  const [savedTriggerFor, setSavedTriggerFor] = useState("");
  const [installed, setInstalled] = useState([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loadState, setLoadState] = useState("loading");
  const [triggerInput, setTriggerInput] = useState("");
  const [editedTriggerFor, setEditedTriggerFor] = useState("");
  const family = workflowFamily(workflow || {});

  useEffect(() => {
    const refresh = () => setPreferences(readLoraPreferences());
    window.addEventListener(LORA_PREFERENCES_CHANGED, refresh);
    window.addEventListener('storage', refresh);
    return () => {window.removeEventListener(LORA_PREFERENCES_CHANGED, refresh); window.removeEventListener('storage', refresh);};
  }, []);
  useEffect(() => {
    let alive = true;
    setLoadState("loading");
    endpoints.comfyLoras()
      .then((result) => { if (alive) { setInstalled(result.loras || []); setLoadState("ready"); } })
      .catch(() => { if (alive) { setInstalled([]); setLoadState("error"); } });
    return () => { alive = false; };
  }, [workflow?.id]);

  const options = useMemo(
    () => compatibleInstalledLoras(workflow || {}, installed, preferences).filter((entry) =>
      !excludedNames.some((name) => String(name).replace(/\\/g, "/").toLowerCase() === entry.installedName.replace(/\\/g, "/").toLowerCase())
    ),
    [workflow, installed, excludedNames, preferences]
  );

  const normalizedFile = (name = "") => String(name).replace(/\\/g, "/").toLowerCase();
  const selected = options.find((entry) => entry.installedName === value?.name)
    || options.find((entry) =>
      normalizedFile(entry.installedName).split("/").pop() === normalizedFile(value?.name).split("/").pop()
    );
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
  const visibleOptions = query.trim() || expanded ? filtered : filtered.slice(0, 8);

  useEffect(() => {
    if (!value?.name || !installed.length) return;
    if (!selected) {
      onChange({ name: "", strength: 0.8, triggerWords: [] });
      return;
    }
    const oldMagazineTrigger = selected.id === "krea-private-1990s" && !editedTriggerFor
      && value?.triggerWords?.length === 1 && value.triggerWords[0].toLowerCase() === "privatemag";
    if (selected.installedName !== value.name || oldMagazineTrigger || (!editedTriggerFor && !value?.triggerWords?.length && selected.triggerWords?.length)) {
      onChange({
        name: selected.installedName,
        strength: Number(value?.strength ?? selected.defaultStrength ?? 0.8),
        triggerWords: oldMagazineTrigger ? selected.triggerWords : (value?.triggerWords?.length ? value.triggerWords : (selected.triggerWords || [])),
      });
    }
  }, [installed, selected, value?.name, value?.strength, value?.triggerWords, editedTriggerFor, onChange]);

  useEffect(() => {
    setTriggerInput((value?.triggerWords || []).join(", "));
  }, [value?.name, value?.triggerWords]);

  const choose = (entry) => {
    setEditedTriggerFor(""); setSavedTriggerFor(""); setSaveError("");
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

  const saveTriggers = () => {
    if (!selected) return;
    const triggerWords = [...new Set(triggerInput.split(/[,;\n]+/).map((word) => word.trim()).filter(Boolean))];
    setEditedTriggerFor(selected.installedName);
    const saved = saveLoraPreference(selected.installedName, {triggerWords});
    setSaveError(saved ? "" : "Could not save in this browser. Your trigger words are still applied to this selection.");
    setSavedTriggerFor(saved ? selected.installedName : "");
    onChange({
      name: selected.installedName,
      strength,
      triggerWords,
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
            <div className="section-label !text-cyan-300">{slotLabel}</div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Installed LoRAs matched by model family · {family === "unknown" ? "unclassified workflow" : family}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">Check the LoRA's stated base model; filename and folder matching cannot verify training compatibility.</p>
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
              placeholder="Search model-family LoRAs..."
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

          {visibleOptions.map((entry) => {
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

        {!query.trim() && options.length > 8 && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="w-full rounded-lg border hairline px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            data-testid="lora-show-more"
          >
            {expanded ? "Show fewer LoRAs" : `Show ${options.length - 8} more LoRAs`}
          </button>
        )}

        {loadState === "ready" && installed.length > 0 && <details className="rounded-lg border hairline p-3">
          <summary className="cursor-pointer text-xs text-cyan-200">Missing a LoRA? Set its model family</summary>
          <p className="my-2 text-xs text-zinc-400">All files reported by ComfyUI are listed here. Assign the training family from the model page; this does not convert a LoRA to another model.</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">{installed.map(name => <label key={name} className="block text-xs text-zinc-300"><span className="break-all">{name}</span>
            <select aria-label={`Model family for ${name}`} className="mt-1 w-full rounded border hairline bg-elevated px-2 py-1" value={preferences[loraFileKey(name)]?.family || ""}
              onChange={event => {const saved = saveLoraPreference(name, {family:event.target.value}); setSaveError(saved ? "" : "Could not save model family in this browser.");}}>
              <option value="">Use filename / folder detection</option>
              {[['qwen_image','Qwen Image 2512'],['qwen_edit','Qwen Image Edit'],['chroma','Chroma'],['krea2','Krea 2'],['flux','FLUX'],['flux2_klein','FLUX.2 Klein'],['zimage','Z-Image'],['pony','Pony'],['sdxl','SDXL'],['sd15','SD 1.5'],['wan22','WAN 2.2']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}
            </select></label>)}</div>
        </details>}
        {saveError && <p role="alert" className="text-xs text-amber-200">{saveError}</p>}
        {loadState !== "ready" && (
          <div className="rounded-lg border hairline px-3 py-2 text-xs text-amber-200" role="status">
            {loadState === "loading" ? "Checking installed LoRAs…" : "Could not read LoRAs from ComfyUI. Check the connection in Settings, then reload."}
          </div>
        )}

        {loadState === "ready" && !options.length && (
          <div className="rounded-lg border hairline bg-black/10 px-3 py-3 text-xs text-zinc-500">
            No model-family LoRAs were detected for this workflow. Put model-matched LoRAs in a family folder such as
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
                triggerWords: value?.triggerWords || [],
              })}
              className="w-full accent-fuchsia-400"
              data-testid="universal-lora-strength"
            />
            <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-600">
              <span>{minStrength.toFixed(2)}</span>
              <span>recommended {Number(selected.defaultStrength ?? 0.8).toFixed(2)}</span>
              <span>{maxStrength.toFixed(2)}</span>
            </div>
            <label className="mt-3 block text-[10px] text-zinc-400">
              Prompt trigger words (comma-separated)
              <input type="text" value={triggerInput} onChange={(event) => {setTriggerInput(event.target.value); setSavedTriggerFor("");}}
                onBlur={saveTriggers} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                placeholder="Enter the trigger from this LoRA's model page, if it has one"
                className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-cyan-400/50"
                data-testid="lora-trigger-words" />
            </label>
            <button type="button" onClick={saveTriggers} className="mt-2 text-xs text-cyan-200">Save trigger words</button>
            {savedTriggerFor === selected.installedName && <p role="status" className="mt-1 text-xs text-emerald-300">Trigger words saved in this browser.</p>}
            <p className="mt-1 text-[10px] text-zinc-500">
              {selected.triggerWords?.length ? "Known trigger loaded automatically. You can edit it." : "No verified trigger is configured for this LoRA. Add one only if its model page specifies it."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
