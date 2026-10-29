import useTabPreference from "@/hooks/useTabPreference";
import { useState } from "react";

// Search includes every group; browsing retains the existing group organization.
export default function OptionBrowser({ alwaysSearch = false, preferenceKey, browseGroup = "all", options = [], searchOptions = options, value, labels = {}, children }) {
  const [query, setQuery] = useState("");
  const [savedLimit, setLimit] = useTabPreference(preferenceKey ? `ultra:choice-limit:${preferenceKey}:${browseGroup}` : null, 24);
  const limit = Math.max(24, Math.floor(savedLimit));
  const [selectedOnly, setSelectedOnly] = useState(false);
  const large = searchOptions.length > 24;
  const term = query.trim().toLowerCase();
  const selected = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const matches = [...new Set(selectedOnly ? searchOptions.filter(option => selected.includes(option)) : term ? searchOptions : options)].filter(option =>
    !term || `${option} ${labels[option] || ""}`.toLowerCase().includes(term));
  const visible = [...new Set([...selected.filter(option => matches.includes(option)), ...matches.slice(0, limit)])];
  return <div className="option-browser space-y-3">
    {(large || alwaysSearch) && <details open={alwaysSearch || undefined} className="option-browser-search"><summary>Search choices{term ? " · Filtered" : ""}</summary><label className="block text-xs text-zinc-400"><span className="sr-only">Search choices</span>
      <input type="search" className="studio-control-search mt-2" value={query}
        onChange={event => { setQuery(event.target.value); }} placeholder="Search all choices…" />
    </label>{query && <button type="button" className="chip min-h-11 mt-2" onClick={() => setQuery("")}>Clear search</button>}</details>}
    {large && (selected.length > 0 || selectedOnly) && <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-200">
      <p className="min-w-0 break-words">Selected: {selected.map(option => labels[option] || option).join(", ") || "None"}</p>
      <button type="button" className="chip min-h-11" aria-pressed={selectedOnly}
        onClick={() => { setSelectedOnly(current => !current); setQuery(""); }}>{selectedOnly ? "Browse all" : "Show selected"}</button>
    </div>}
    <div className={large ? "option-browser-results" : undefined}>
      {matches.length ? children(large ? visible : matches) : <p role="status" className="text-sm text-zinc-400">{selectedOnly ? "No selected choices. Choose Browse all to continue." : "No matching choices. Clear your search or try another term."}</p>}
    </div>
    {large && matches.length > limit && <button type="button" className="chip min-h-11" onClick={() => setLimit(current => current + 24)}>Show more choices ({matches.length - limit})</button>}
  </div>;
}
