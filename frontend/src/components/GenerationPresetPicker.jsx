import { useMemo, useState } from "react";

const KEY = "ultra:generation-presets:v1";
const CATEGORIES = ["General", "Portrait", "Realism", "Style", "Photoshoot", "Experimental"];
const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.name === "string" && typeof item.workflowId === "string").slice(0, 40) : [];
  } catch { return []; }
};

export default function GenerationPresetPicker({ workflowId, steps, sampler, scheduler, selectedLora, secondaryLora, onApply }) {
  const [presets, setPresets] = useState(read);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState("");
  const [error, setError] = useState("");
  const save = (next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setPresets(next); setError(""); return true; }
    catch { setError("Unable to save presets in this browser."); return false; }
  };
  const add = () => {
    const label = name.trim();
    if (!label || !workflowId) return;
    if (presets.length >= 40 && !presets.some(item => item.name === label)) { setError("Maximum 40 presets. Delete one before adding another."); return; }
    const existing = presets.find(item => item.name === label);
    const entry = { name: label, workflowId, steps: Number(steps) || 6, sampler: sampler || "", scheduler: scheduler || "", selectedLora: selectedLora || null, secondaryLora: secondaryLora || null, category, favorite: Boolean(existing?.favorite) };
    if (save([...presets.filter(item => item.name !== label), entry])) { setName(""); setChosen(label); }
  };
  const visible = useMemo(() => presets.filter(item => {
    if (filter === "Favorites" && !item.favorite) return false;
    if (filter !== "All" && filter !== "Favorites" && (item.category || "General") !== filter) return false;
    return item.name.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a,b) => Number(Boolean(b.favorite))-Number(Boolean(a.favorite)) || a.name.localeCompare(b.name)), [presets,filter,query]);
  const selected = presets.find(item => item.name === chosen);
  const toggleFavorite = () => {
    if (selected) save(presets.map(item => item.name === chosen ? {...item, favorite: !item.favorite} : item));
  };
  return <section className="pane mt-3 space-y-3 p-4" aria-label="Saved generation presets">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-zinc-100">Generation preset library</h3>
      <span className="text-xs text-zinc-400">{presets.length}/40 saved</span>
    </div>
    <p className="text-xs text-zinc-400">Save workflow, steps, sampler and LoRA settings. Presets stay in this browser.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Preset categories">
      {["All","Favorites",...CATEGORIES].map(item => <button key={item} type="button" aria-pressed={filter===item} onClick={() => {setFilter(item);setChosen("");}} className={`min-h-10 rounded-full border px-3 text-xs ${filter===item ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-white/20 text-zinc-300"}`}>{item}</button>)}
    </div>
    <input aria-label="Search saved presets" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search presets" className="min-h-10 w-full rounded-lg border border-white/20 bg-zinc-800 px-3 text-sm text-zinc-100"/>
    <div className="flex flex-wrap gap-2">
      <select aria-label="Saved preset" value={visible.some(item=>item.name===chosen)?chosen:""} onChange={event => setChosen(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/20 bg-zinc-800 p-2 text-sm text-zinc-100">
        <option value="">Choose a preset ({visible.length})</option>
        {visible.map(item => <option key={item.name} value={item.name}>{item.favorite ? "★ " : ""}{item.name} · {item.steps} steps</option>)}
      </select>
      <button type="button" className="chip min-h-10" disabled={!selected} onClick={() => onApply(selected)}>Load</button>
      <button type="button" className="chip min-h-10" disabled={!selected} aria-label={selected?.favorite?"Remove preset from favorites":"Add preset to favorites"} onClick={toggleFavorite}>{selected?.favorite?"★":"☆"}</button>
      <button type="button" className="chip min-h-10" disabled={!selected} onClick={() => { if (save(presets.filter(item => item.name !== chosen))) setChosen(""); }}>Delete</button>
    </div>
    <div className="flex flex-wrap gap-2">
      <input aria-label="New preset name" value={name} maxLength={64} onChange={event => setName(event.target.value)} placeholder="Preset name" className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/20 bg-zinc-800 px-3 text-sm text-zinc-100"/>
      <select aria-label="New preset category" value={category} onChange={event=>setCategory(event.target.value)} className="min-h-10 rounded-lg border border-white/20 bg-zinc-800 p-2 text-sm text-zinc-100">{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select>
      <button type="button" className="chip min-h-10" disabled={!name.trim() || !workflowId} onClick={add}>Save current</button>
    </div>
    {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
  </section>;
}
