import {useMemo,useState} from 'react';
import {WARDROBE_ITEMS} from '@/lib/wardrobeCatalog';
import {editWardrobeField} from '@/lib/wardrobeMode';

// Outfit prompts are intentionally stored in DNA for compatibility with existing characters.
export default function WardrobeBrowser({value,onChange,disabled=false}){
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('');
 const [favorites,setFavorites]=useState([]);
 const [favoritesOnly,setFavoritesOnly]=useState(false);
 const [custom,setCustom]=useState('');
 const categories=useMemo(()=>[...new Set(WARDROBE_ITEMS.map(item=>item.category))],[]);
 const visible=useMemo(()=>WARDROBE_ITEMS.filter(item=>(!category||item.category===category)&&(!favoritesOnly||favorites.includes(item.id))&&[item.label,item.category,item.prompt,...item.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase())),[category,favorites,favoritesOnly,query]);
 const select=prompt=>onChange(editWardrobeField(value,'outfit_set',prompt));
 const toggleFavorite=id=>setFavorites(items=>items.includes(id)?items.filter(item=>item!==id):[...items,id]);
 return <section className="space-y-3 min-w-0" aria-label="Outfit browser" data-testid="wardrobe-browser">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold text-zinc-100">Outfit library</h3><p className="text-xs text-zinc-400">Search styles, select an outfit, or write your own.</p></div><button type="button" className="rounded-lg border border-zinc-600 px-3 py-2 text-sm" aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(v=>!v)}>{favoritesOnly?'★ Favorites':'☆ Favorites'}</button></div>
  <input className="studio-control-search w-full min-h-11" aria-label="Search outfits" placeholder="Search outfits, fabrics, eras…" value={query} onChange={event=>setQuery(event.target.value)}/>
  <div className="md:hidden"><label className="block text-sm text-zinc-300">Category<select className="studio-control-search mt-1 w-full min-h-11" value={category} onChange={event=>setCategory(event.target.value)}><option value="">All categories</option>{categories.map(name=><option key={name} value={name}>{name}</option>)}</select></label></div>
  <div className="hidden md:flex flex-wrap gap-2" role="group" aria-label="Outfit categories"><button type="button" aria-pressed={!category} className={`rounded-lg px-3 py-2 text-sm border ${!category?'border-amber-400 text-amber-200':'border-zinc-700'}`} onClick={()=>setCategory('')}>All</button>{categories.map(name=><button type="button" key={name} aria-pressed={category===name} className={`rounded-lg px-3 py-2 text-sm border ${category===name?'border-amber-400 text-amber-200':'border-zinc-700'}`} onClick={()=>setCategory(name)}>{name}</button>)}</div>
  <div className="max-h-[48vh] overflow-y-auto space-y-2 pr-1" aria-live="polite">{visible.length===0?<p className="text-sm text-zinc-400">No outfits match. Try a different search or category.</p>:visible.map(item=><div key={item.id} className="rounded-lg border border-zinc-700 p-3 flex gap-2 items-start"><button type="button" disabled={disabled} aria-pressed={value.outfit_set===item.prompt} onClick={()=>select(item.prompt)} className={`flex-1 min-w-0 text-left rounded-md p-1 ${value.outfit_set===item.prompt?'text-amber-200':'text-zinc-200'}`}><strong className="block text-sm">{item.label}{value.outfit_set===item.prompt?' · Selected':''}</strong><span className="block text-xs text-zinc-400">{item.category}</span><span className="block text-xs mt-1 text-zinc-400">{item.prompt}</span></button><button type="button" aria-label={favorites.includes(item.id)?`Remove ${item.label} from favorites`:`Favorite ${item.label}`} aria-pressed={favorites.includes(item.id)} onClick={()=>toggleFavorite(item.id)} className="shrink-0 min-h-11 min-w-11 rounded-lg border border-zinc-700 text-amber-300">{favorites.includes(item.id)?'★':'☆'}</button></div>)}</div>
  <details className="rounded-lg border border-zinc-700 p-3"><summary className="cursor-pointer font-medium text-sm">Custom outfit</summary><label className="block text-sm mt-3">Describe a complete outfit<textarea className="studio-control-search mt-2 w-full min-h-24 p-2" value={custom} onChange={event=>setCustom(event.target.value)} placeholder="Describe garments, materials, accessories and footwear…"/></label><button type="button" disabled={disabled||!custom.trim()} onClick={()=>select(custom.trim())} className="mt-2 rounded-lg border border-zinc-600 px-3 py-2 disabled:opacity-50">Use custom outfit</button></details>
 </section>;
}
