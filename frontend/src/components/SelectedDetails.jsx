import {useState} from 'react';
export default function SelectedDetails({items = [], onEdit}) {
  const [search,setSearch] = useState('');
  const matches = items.filter(item => `${item.category} ${item.label} ${item.value}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="selected-details space-y-3">
    <p className="text-xs text-zinc-400">Saved choices for the active character, including shared scene settings. Open a detail to edit or clear it using its original control.</p>
    <label className="block text-xs text-zinc-300">Find a selected detail<input className="studio-control-search mt-2" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search your selections…" /></label>
    <p role="status" className="text-xs text-zinc-400">{matches.length} of {items.length} selected details</p>
    {matches.length ? matches.map(item => <button key={`${item.section}-${item.field}`} type="button" className="selected-detail-row studio-selected-option" onClick={()=>onEdit(item)}>
      <span className="block text-xs text-zinc-400">{item.category} · {item.label}{item.locked ? ' · Locked' : ''}</span>
      <span className="block mt-1 text-sm break-words">{item.value}</span>
      {item.note && <span className="block mt-2 text-xs text-amber-200">{item.note}</span>}
      <span className="block mt-2 text-xs text-cyan-200">Edit detail</span>
    </button>) : <p className="text-sm text-zinc-400">{items.length ? 'No matching selections. Try another search.' : 'No selections yet. Choose a detail to get started.'}</p>}
  </div>;
}
