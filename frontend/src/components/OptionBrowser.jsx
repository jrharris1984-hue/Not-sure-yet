import { useState } from "react";

// Search includes every group; browsing retains the existing group organization.
export default function OptionBrowser({ options = [], searchOptions = options, value, labels = {}, children }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const large = searchOptions.length > 24;
  const term = query.trim().toLowerCase();
  const matches = [...new Set(term ? searchOptions : options)].filter(option =>
    !term || `${option} ${labels[option] || ""}`.toLowerCase().includes(term));
  const selected = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const visible = [...new Set([...selected.filter(option => matches.includes(option)), ...matches.slice(0, limit)])];
  return <div className="option-browser space-y-3">
    {large && <label className="block text-xs text-zinc-400">Search choices
      <input type="search" className="studio-control-search mt-2" value={query}
        onChange={event => { setQuery(event.target.value); setLimit(24); }} placeholder="Search all choices…" />
    </label>}
    {large && selected.length > 0 && <p className="text-xs text-cyan-200 break-words">Selected: {selected.map(option => labels[option] || option).join(", ")}</p>}
    <div className={large ? "option-browser-results" : undefined}>
      {matches.length ? children(large ? visible : matches) : <p role="status" className="text-sm text-zinc-400">No matching choices. Try another search.</p>}
    </div>
    {large && matches.length > limit && <button type="button" className="chip min-h-11" onClick={() => setLimit(current => current + 24)}>Show more choices ({matches.length - limit})</button>}
  </div>;
}
