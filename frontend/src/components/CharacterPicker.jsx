import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, Star, Copy, ArrowRight } from 'lucide-react';
import { endpoints } from '@/lib/api';
import { mediaUrl } from '@/lib/media';

export default function CharacterPicker({ intent = 'character', onClose }) {
  const [characters,setCharacters]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [query,setQuery]=useState(''),[favorites,setFavorites]=useState(false),[sort,setSort]=useState('recent');
  const [visibleCount,setVisibleCount]=useState(12);
  useEffect(()=>{setVisibleCount(12);},[query,favorites,sort]);
  const [retry,setRetry]=useState(0),[pending,setPending]=useState('');
  const navigate=useNavigate();
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{
    let active=true;setLoading(true);setError('');
    endpoints.listCharacters().then(rows=>{if(active)setCharacters(rows);}).catch(()=>{if(active)setError('Could not load characters. Your saved characters have not been changed.');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[retry]);
  const results=useMemo(()=>{
    const text=query.trim().toLowerCase();
    return characters.filter(c=>(!favorites || c.favorite) && [c.name,...(c.tags || []),c.dna?.identity?.archetype,c.dna?.identity?.ethnicity].filter(Boolean).join(' ').toLowerCase().includes(text))
      .sort((a,b)=>sort==='name'?(a.name || '').localeCompare(b.name || ''):String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
  },[characters,query,favorites,sort]);
  const destination=id=>intent==='shoot'?`/shoots?character=${encodeURIComponent(id)}`:`/character/${encodeURIComponent(id)}`;
  async function duplicate(character) {
    setPending(character.id);setError('');
    try {const copy=await endpoints.duplicateCharacter(character.id);if(!copy?.id)throw new Error('Missing copy');if(mounted.current)navigate(destination(copy.id));}
    catch {if(mounted.current)setError('Could not make a copy. Your original character is unchanged.');}
    finally {if(mounted.current)setPending('');}
  }
  async function favorite(character) {
    setPending(character.id);setError('');
    try {await endpoints.updateCharacter(character.id,{favorite:!character.favorite});if(mounted.current)setCharacters(rows=>rows.map(c=>c.id===character.id?{...c,favorite:!c.favorite}:c));}
    catch {if(mounted.current)setError('Could not update this favorite. Try again.');}
    finally {if(mounted.current)setPending('');}
  }
  return <section id="create-character-picker" className="pane scroll-mt-24 p-4 sm:p-6 space-y-4" aria-label="Choose a saved character">
    <header className="flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-bold">{intent==='shoot'?'Who is the photoshoot for?':'Choose your character'}</h2><p className="mt-1 text-sm text-zinc-400">{intent==='shoot'?'Choose a saved character, then pick a shoot style.':'Use opens the saved character for editing. Make a copy keeps the original separate.'}</p></div><button type="button" className="chip min-h-11" onClick={onClose}>Back</button></header>
    <div className="flex flex-col gap-2 sm:flex-row"><label className="flex-1 text-xs text-zinc-400">Find a character<input type="search" className="studio-control-search mt-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, tag or heritage…"/></label><label className="text-xs text-zinc-400">Sort<select className="studio-control-search mt-2" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Recently updated</option><option value="name">Name</option></select></label><button type="button" className={`chip min-h-11 sm:self-end ${favorites?'active':''}`} aria-pressed={favorites} onClick={()=>setFavorites(!favorites)}>Favorites</button></div>
    {loading?<p role="status" className="py-5 text-sm text-zinc-400">Loading your characters…</p>:<>
      {error && <div role="alert" className="rounded-xl border border-amber-400/30 p-3 text-sm text-amber-200">{error}<button type="button" className="ml-2 underline min-h-11" onClick={()=>setRetry(retry+1)}>Try again</button></div>}
      {!error && !results.length && <div className="rounded-xl border border-dashed hairline p-6 text-center"><h3 className="font-semibold">{characters.length?'No matching characters':'Your character collection starts here'}</h3><p className="mt-2 text-sm text-zinc-400">{characters.length?'Try a different search or turn off Favorites.':'Create a character first. Once saved, it will appear here.'}</p>{characters.length?<button type="button" className="chip min-h-11 mt-3" onClick={()=>{setQuery('');setFavorites(false);}}>Clear filters</button>:<Link to="/character/new" className="chip min-h-11 mt-3">Create a character</Link>}</div>}
      {!!results.length && <p className="text-xs text-zinc-500" aria-live="polite">{results.length} character{results.length===1?'':'s'}</p>}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-3">{results.slice(0,visibleCount).map(character=><article key={character.id} className="overflow-hidden rounded-2xl border hairline bg-black/15">
        <Link to={destination(character.id)} aria-label={`Use ${character.name || 'Untitled'}`} className="relative block aspect-[4/3] bg-white/[0.03]">{character.thumbnail?<img loading="lazy" decoding="async" src={mediaUrl(character.thumbnail)} alt={character.name || 'Character'} className="h-full w-full object-contain"/>:<div className="grid h-full place-items-center text-zinc-500"><UserRound className="h-12 w-12"/><span className="text-xs">No saved preview yet</span></div>}</Link>
        <div className="space-y-3 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-semibold">{character.name || 'Untitled'}</h3><p className="mt-1 text-xs text-zinc-400">{[character.dna?.identity?.archetype,...(character.tags || []).slice(0,2)].filter(Boolean).join(' · ') || 'Saved character'}</p></div><button type="button" aria-label={`${character.favorite?'Remove':'Add'} ${character.name || 'character'} ${character.favorite?'from':'to'} favorites`} aria-pressed={!!character.favorite} disabled={!!pending} onClick={()=>favorite(character)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border hairline disabled:opacity-40"><Star className={`h-4 w-4 ${character.favorite?'fill-amber-300 text-amber-300':'text-zinc-400'}`}/></button></div>
        <Link to={destination(character.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 text-sm font-bold text-black">{intent==='shoot'?'Choose for photoshoot':'Use character'}<ArrowRight className="h-4 w-4"/></Link>
        <button type="button" disabled={!!pending} onClick={()=>duplicate(character)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border hairline px-3 text-xs text-zinc-300 disabled:opacity-40"><Copy className="h-4 w-4"/>{pending===character.id?'Working…':'Make a copy'}</button></div>
      </article>)}</div>
      {results.length > visibleCount && <button type="button" className="chip min-h-11 w-full" onClick={()=>setVisibleCount(visibleCount+12)}>Show more characters ({results.length-visibleCount} remaining)</button>}
    </>}
  </section>;
}
