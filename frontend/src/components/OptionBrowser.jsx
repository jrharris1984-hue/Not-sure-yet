import useTabPreference from "@/hooks/useTabPreference";
import { useState } from "react";

// Search includes every group; browsing retains the existing group organization.
export default function OptionBrowser({ alwaysSearch = false, preferenceKey, browseGroup = "all", options = [], searchOptions = options, value, labels = {}, children }) {
  const [query, setQuery] = useState("");
  const [savedLimit, setLimit] = useTabPreference(preferenceKey ? `ultra:choice-limit:${preferenceKey}:${browseGroup}` : null, 24);
  const limit = Math.max(24, Math.floor(savedLimit));
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [savedFavorites,setFavorites]=useTabPreference(preferenceKey ? `ultra:choice-favorites:${preferenceKey}` : null,[]);
  const favorites=Array.isArray(savedFavorites)?savedFavorites.filter(option=>searchOptions.includes(option)):[];
  const [favoritesOnly,setFavoritesOnly]=useState(false);
  const large = searchOptions.length > 24;
  const term = query.trim().toLowerCase();
  const selected = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const matches = [...new Set(favoritesOnly ? favorites : selectedOnly ? searchOptions.filter(option => selected.includes(option)) : term ? searchOptions : options)].filter(option =>
    !term || `${option} ${labels[option] || ""}`.toLowerCase().includes(term));
  const visible = [...new Set([...selected.filter(option => matches.includes(option)), ...matches.slice(0, limit)])];
  const knownSelected=selected.filter(option=>searchOptions.includes(option));
  const allFavorited=knownSelected.length>0 && knownSelected.every(option=>favorites.includes(option));
  return <div className="option-browser space-y-3">
    {(large || (alwaysSearch && searchOptions.length>8)) && <div className="choice-browser-toolbar"><label className="choice-browser-search"><span className="sr-only">Search choices</span>
      <input type="search" className="studio-control-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search choices…"/>
    </label>{query && <button type="button" className="chip min-h-11" onClick={()=>setQuery('')}>Clear search</button>}
    <span className="choice-browser-count">{matches.length} choices</span></div>}
    {preferenceKey && (searchOptions.length>8 || favorites.length>0) && <div className="choice-browser-shortcuts">
      <button type="button" aria-pressed={favoritesOnly} onClick={()=>{setFavoritesOnly(current=>!current);setSelectedOnly(false);setQuery('');}}>Favorites ({favorites.length})</button>
      {knownSelected.length>0 && <button type="button" onClick={()=>setFavorites(allFavorited?favorites.filter(option=>!knownSelected.includes(option)):[...new Set([...favorites,...knownSelected])])}>{allFavorited?'Unfavorite selected':'Favorite selected'}</button>}
    </div>}
    {large && (selected.length > 0 || selectedOnly) && <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-200">
      <p className="min-w-0 break-words">Selected: {selected.map(option => labels[option] || option).join(", ") || "None"}</p>
      <button type="button" className="chip min-h-11" aria-pressed={selectedOnly}
        onClick={() => { setSelectedOnly(current => !current); setFavoritesOnly(false); setQuery(""); }}>{selectedOnly ? "Browse all" : "Show selected"}</button>
    </div>}
    <div className={large ? "option-browser-results" : undefined}>
      {matches.length ? children(large ? visible : matches) : <p role="status" className="text-sm text-zinc-400">{favoritesOnly ? "No matching favorites. Turn off Favorites to browse all choices." : selectedOnly ? "No selected choices. Choose Browse all to continue." : "No matching choices. Clear your search or try another term."}</p>}
    </div>
    {large && matches.length > limit && <button type="button" className="chip min-h-11" onClick={() => setLimit(current => current + 24)}>Show more choices ({matches.length - limit})</button>}
  </div>;
}
