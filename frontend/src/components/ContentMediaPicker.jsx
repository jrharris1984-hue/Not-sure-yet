import { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
import MediaLibraryPreview from '@/components/MediaLibraryPreview';

export default function ContentMediaPicker({ onSelect, onClose }) {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [offset,setOffset]=useState(0);
  const [total,setTotal]=useState(0);
  useEffect(() => {
    let live=true;
    setLoading(true);setError('');
    endpoints.mediaLibraryList({q:query || undefined,media_type:'image',hide_sidecars:true,limit:36,offset})
      .then(result => {if(live){setItems(result.items || []);setTotal(result.total || 0);}})
      .catch(() => {if(live)setError('Unable to load your media library. Check that the local media service is running.');})
      .finally(() => {if(live)setLoading(false);});
    return () => {live=false;};
  },[query,offset]);
  return <div className="space-y-3 rounded-lg border border-cyan-400/30 bg-elevated p-3" aria-label="Select a library reference">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-sm font-semibold">Select from Media Library</h4>
      <button type="button" className="rounded border hairline px-2 py-1 text-xs" onClick={onClose}>Close</button>
    </div>
    <input aria-label="Search library images" value={query} onChange={e=>{setQuery(e.target.value);setOffset(0);}}
      placeholder="Search images…" className="w-full rounded-lg border hairline bg-black/20 px-3 py-2 text-sm"/>
    {loading && <p className="text-xs text-zinc-400">Loading images…</p>}
    {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
    {!loading && !error && !items.length && <p className="text-xs text-zinc-400">No images found.</p>}
    <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {items.map(item => <button type="button" key={item.id} onClick={()=>onSelect(item)}
        className="min-w-0 overflow-hidden rounded-lg border hairline text-left hover:border-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
        <div className="aspect-square overflow-hidden"><MediaLibraryPreview item={item} className="h-full w-full object-cover"/></div>
        <div className="truncate px-1 py-1 text-[10px] text-zinc-300">{item.filename || item.id}</div>
      </button>)}
    </div>
    <div className="flex items-center justify-between text-xs text-zinc-400">
      <span>{total ? `${offset+1}–${Math.min(offset+items.length,total)} of ${total}` : 'No results'}</span>
      <div className="flex gap-2">
        <button type="button" disabled={!offset || loading} onClick={()=>setOffset(n=>Math.max(0,n-36))} className="rounded border hairline px-2 py-1 disabled:opacity-40">Previous</button>
        <button type="button" disabled={offset+36>=total || loading} onClick={()=>setOffset(n=>n+36)} className="rounded border hairline px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  </div>;
}
