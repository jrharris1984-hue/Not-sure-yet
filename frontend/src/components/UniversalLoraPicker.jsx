import LoraLibraryManager from "./LoraLibraryManager";
import { useEffect, useMemo, useState } from "react";
import { Check, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { endpoints } from "@/lib/api";
import { readLoraPreferences, saveLoraPreference, loraFileKey, LORA_PREFERENCES_CHANGED } from "@/lib/loraPreferences";
import { compatibleInstalledLoras, workflowFamily } from "@/lib/loraRegistry";


const LORA_CATEGORIES = ["All", "Favorites", "Style", "Realism", "Lighting", "Character", "Body", "Pose", "Clothing", "Camera", "Detail", "Utility", "Other"];
const categoryFor = (entry) => {
  const tags = (entry.categories || []).map(tag=>String(tag).toLowerCase());
  const slot = String(entry.slot || "").toLowerCase();
  const name = String(entry.label || "").toLowerCase();
  const matches = (words) => words.some(word => tags.includes(word) || name.includes(word));
  if (matches(["lighting","light"])) return "Lighting";
  if (matches(["wardrobe","clothing","outfit","fashion","uniform"])) return "Clothing";
  if (matches(["camera","selfie","pov","lens"])) return "Camera";
  if (matches(["pose","action","movement"]) || slot === "action") return "Pose";
  if (matches(["realism","realistic","photoreal"])) return "Realism";
  if (matches(["detail","texture","sharpness","feet"])) return "Detail";
  if (matches(["character","identity","person","face","portrait"]) || slot === "identity") return "Character";
  if (matches(["body","physique","shape"]) || slot === "body") return "Body";
  if (matches(["style","editorial","retro","aesthetic","art"]) || slot === "quality") return "Style";
  if (matches(["utility","turbo","speed","accelerat"]) || slot === "required") return "Utility";
  return "Other";
};

export default function UniversalLoraPicker({ workflow, value, onChange, slotLabel = "LoRA", excludedNames = [] }) {
  const [records, setRecords] = useState([]);
  const [preferences, setPreferences] = useState(readLoraPreferences);
  const [saveError, setSaveError] = useState("");
  const [savedTriggerFor, setSavedTriggerFor] = useState("");
  const [installed, setInstalled] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem("ultra:lora-favorites") || "[]"); } catch { return []; } });
  const toggleFavorite = (name) => { const next = favorites.includes(name) ? favorites.filter(item => item !== name) : [...favorites,name]; setFavorites(next); try { localStorage.setItem("ultra:lora-favorites",JSON.stringify(next)); } catch {} };
  const [loadState, setLoadState] = useState("loading");
  const [triggerInput, setTriggerInput] = useState("");
  const [editedTriggerFor, setEditedTriggerFor] = useState("");
  const family = workflowFamily(workflow || {});
  const [showAllInstalled, setShowAllInstalled] = useState(false);
  const [activeFolder, setActiveFolder] = useState("");

  useEffect(() => {
    const refresh = () => {
      setPreferences(readLoraPreferences());
      endpoints.loraLibrary().then(result=>setRecords(result.records || [])).catch(()=>setSaveError("Could not load saved LoRA profiles. Check the backend connection and rebuild the backend after updating."));
    };
    refresh();
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
    () => compatibleInstalledLoras(workflow || {}, installed, Object.fromEntries([
      ...Object.entries(preferences),
      ...records.filter(r=>r.profile).map(r=>[loraFileKey(r.name), {...r.profile, ...preferences[loraFileKey(r.name)]}])
    ])).filter((entry) =>
      !excludedNames.some((name) => String(name).replace(/\\/g, "/").toLowerCase() === entry.installedName.replace(/\\/g, "/").toLowerCase())
    ),
    [workflow, installed, excludedNames, preferences, records]
  );

  const normalizedFile = (name = "") => String(name).replace(/\\/g, "/").toLowerCase();
  const matchedPaths = new Set(options.map(entry => normalizedFile(entry.installedName)));
  const selected = options.find((entry) => entry.installedName === value?.name)
    || (options.filter(entry => normalizedFile(entry.installedName).split("/").pop() === normalizedFile(value?.name).split("/").pop()).length === 1
      ? options.find(entry => normalizedFile(entry.installedName).split("/").pop() === normalizedFile(value?.name).split("/").pop()) : undefined);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter(entry => {
      const path = String(entry.installedName).replace(/\\/g, "/");
      if (!needle && activeFolder && !path.startsWith(`${activeFolder}/`)) return false;
      if (category === "Favorites" && !favorites.includes(entry.installedName)) return false;
      if (category !== "All" && category !== "Favorites" && categoryFor(entry) !== category) return false;
      return !needle || [entry.label,entry.installedName,entry.slot,...(entry.categories || [])].join(" ").toLowerCase().includes(needle);
    });
  }, [options, query, category, favorites, activeFolder]);
  const folders = useMemo(() => {
    const paths = new Set();
    options.forEach(entry => {
      const parts = String(entry.installedName).replace(/\\/g, "/").split("/").slice(0, -1);
      parts.forEach((_, index) => paths.add(parts.slice(0, index + 1).join("/")));
    });
    return [...paths].sort((a, b) => a.localeCompare(b));
  }, [options]);
  const childFolders = folders.filter(path => (activeFolder ? path.startsWith(`${activeFolder}/`) : true) && path.slice(activeFolder ? activeFolder.length + 1 : 0).indexOf("/") === -1);
  const folderCount = path => options.filter(entry => String(entry.installedName).replace(/\\/g, "/").startsWith(`${path}/`)).length;
  const ranked = [...filtered].sort((a,b)=>Number(favorites.includes(b.installedName))-Number(favorites.includes(a.installedName)));
  const visibleOptions = query.trim() || expanded ? ranked : ranked.slice(0, 8);

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
  const [strengthInput, setStrengthInput] = useState(String(strength));
  useEffect(()=>setStrengthInput(String(strength)),[strength,value?.name]);

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-zinc-300">{selected ? `Active: ${selected.label}` : "No LoRA selected"}</p>
          <button type="button" className="chip min-h-10" aria-expanded={browseOpen} onClick={()=>setBrowseOpen(open=>!open)}>{browseOpen ? "Hide library" : "Browse LoRAs"}</button>
        </div>
        {browseOpen && <>
        <div className="rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-zinc-300">
          <p>{installed.length} discovered by ComfyUI · {options.length} matched to this workflow family.</p>
          <p className="mt-1 text-zinc-500">Family matching is inferred, not proof of training compatibility. Confirm the LoRA base model before generating.</p>
          <button type="button" className="mt-2 min-h-10 text-cyan-200 underline" onClick={() => setShowAllInstalled(open => !open)} aria-expanded={showAllInstalled}>
            {showAllInstalled ? "Hide installed inventory" : "Show all installed files, including unmatched"}
          </button>
          {showAllInstalled && <div className="mt-2 max-h-48 overflow-y-auto rounded border border-white/10 p-2">
            {installed.map(name => {
              const matched = matchedPaths.has(String(name).replace(/\\\\/g, "/").toLowerCase());
              return <div key={name} className="flex gap-2 border-b border-white/5 py-1 last:border-0">
                <span className="min-w-0 flex-1 break-all">{name}</span>
                <span className={matched ? "text-cyan-300" : "text-amber-300"}>{matched ? "Family match" : "Needs review"}</span>
              </div>;
            })}
          </div>}
        </div>
        <LoraLibraryManager installed={installed} records={records} onRecords={setRecords}/>
        <div className="rounded-lg border border-white/10 p-3" data-testid="lora-folder-browser">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-200">Browse folders</p>
            <button type="button" className="text-xs text-cyan-200 underline" onClick={() => {setActiveFolder("");setQuery("");setExpanded(false);}}>All folders</button>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <button type="button" className="text-cyan-200 underline" onClick={() => {setActiveFolder("");setExpanded(false);}}>LoRAs</button>
            {activeFolder.split("/").filter(Boolean).map((part, index, parts) => <span key={index} className="flex min-w-0 items-center gap-2">
              <span className="text-zinc-600">/</span>
              <button type="button" className="max-w-40 truncate text-cyan-200 underline" onClick={() => {setActiveFolder(parts.slice(0,index+1).join("/"));setExpanded(false);}}>{part}</button>
            </span>)}
          </div>
          {childFolders.length > 0 && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {childFolders.map(path => <button type="button" key={path} onClick={() => {setActiveFolder(path);setQuery("");setExpanded(false);}} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/5">
              <span className="min-w-0 truncate">📁 {path.split("/").pop()}</span><span className="shrink-0 text-zinc-500">{folderCount(path)}</span>
            </button>)}
          </div>}
          {activeFolder && <p className="mt-2 break-all text-[10px] text-zinc-500">Folder: {activeFolder} · Includes nested folders</p>}
          {query.trim() && <p className="mt-2 text-[10px] text-zinc-500">Searching all folders; clear search to return to the selected folder.</p>}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="LoRA categories">
          {LORA_CATEGORIES.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={()=>{setCategory(item);setExpanded(false);}} className={`rounded-full border px-3 py-2 text-xs ${category===item ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-white/15 text-zinc-300 hover:bg-white/5"}`}>{item}{item === "Favorites" ? ` (${options.filter(entry=>favorites.includes(entry.installedName)).length})` : ""}</button>)}
        </div>
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

        {!query.trim() && filtered.length > 8 && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="w-full rounded-lg border hairline px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            data-testid="lora-show-more"
          >
            {expanded ? "Show fewer LoRAs" : `Show ${filtered.length - 8} more LoRAs`}
          </button>
        )}

        {loadState === "ready" && filtered.length === 0 && options.length > 0 && <p className="text-xs text-zinc-400">No LoRAs in this category. Try All or another category.</p>}
        {loadState === "ready" && installed.length > 0 && <details className="rounded-lg border hairline p-3">
          <summary className="cursor-pointer text-xs text-cyan-200">Missing a LoRA? Set its model family</summary>
          <p className="my-2 text-xs text-zinc-400">All files reported by ComfyUI are listed here. Assign the training family from the model page; this does not convert a LoRA to another model.</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">{installed.map(name => <label key={name} className="block text-xs text-zinc-300"><span className="break-all">{name}</span>
            <select aria-label={`Model family for ${name}`} className="mt-1 w-full rounded border hairline bg-elevated px-2 py-1" value={preferences[loraFileKey(name)]?.family || ""}
              onChange={event => {const saved = saveLoraPreference(name, {family:event.target.value}); setSaveError(saved ? "" : "Could not save model family in this browser.");}}>
              <option value="">Use filename / folder detection</option>
              {[['moss_image','MOSS Image'],['qwen_image','Qwen Image 2512'],['qwen_edit','Qwen Image Edit'],['chroma','Chroma'],['krea2','Krea 2'],['flux','FLUX'],['flux2_klein','FLUX.2 Klein'],['zimage','Z-Image'],['pony','Pony'],['sdxl','SDXL'],['sd15','SD 1.5'],['wan22','WAN 2.2']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}
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

        </>}
        {selected && (
          <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-fuchsia-300" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-200">{selected.label}</span>
              <span className="font-mono text-xs text-fuchsia-200">{strength.toFixed(2)}</span>
              <button type="button" className="chip min-h-10 text-xs" onClick={()=>toggleFavorite(selected.installedName)}>{favorites.includes(selected.installedName) ? "★ Favorited" : "☆ Add favorite"}</button>
            </div>
            <input
              type="range"
              aria-label={`${slotLabel} model strength`}
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
              <span>{selected.profileConfigured ? "saved default" : "app default"} {Number(selected.defaultStrength ?? 0.8).toFixed(2)}</span>
              <span>{maxStrength.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs">Model strength
                <input type="number" aria-label={`${slotLabel} numeric model strength`} min={minStrength} max={maxStrength} step="0.05" value={strengthInput}
                  onChange={event=>{setStrengthInput(event.target.value); if(event.target.value === '') return; const number=Number(event.target.value); if(Number.isFinite(number) && number>=minStrength && number<=maxStrength) onChange({...value,strength:number});}}
                  onBlur={()=>{const number=Number(strengthInput); const next=strengthInput !== '' && Number.isFinite(number) ? Math.max(minStrength,Math.min(maxStrength,number)) : strength; setStrengthInput(String(next)); if(next!==strength) onChange({...value,strength:next});}}
                  className="ml-2 w-24 rounded border hairline bg-elevated p-2"/>
              </label>
              <button type="button" className="chip min-h-11" onClick={()=>onChange({...value,strength:selected.defaultStrength ?? 0.8})}>Reset strength</button>
            </div>
            <label className="mt-3 block text-xs text-zinc-300">Library category
              <select className="mt-1 w-full rounded border border-white/20 bg-zinc-800 p-2" value={categoryFor(selected)}
                onChange={event=>{
                  const next = event.target.value;
                  const saved = saveLoraPreference(selected.installedName,{categories: next === "Other" ? [] : [next.toLowerCase()]});
                  if (!saved) setSaveError("Could not save category in this browser.");
                }}>
                {LORA_CATEGORIES.filter(item=>item!=="All"&&item!=="Favorites").map(item=><option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <p className="mt-2 text-xs text-zinc-400">Model influence only. Use Scan &amp; manage to save a creator-specific range, including negative values. A saved range is user-confirmed, not independently verified.</p>
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
