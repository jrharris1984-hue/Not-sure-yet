import {useMemo, useState} from 'react';
import {auditSelectionPrompt} from '@/lib/selectionPromptAudit';

export default function SelectionPromptAudit({positive, manifest}) {
  const [filter, setFilter] = useState('all');
  const audit = useMemo(()=>auditSelectionPrompt(positive, manifest), [positive, manifest]);
  if (!manifest?.length) return null;
  const rows = audit.rows.filter(row=>filter==='all' || row.status===filter);
  return <details className="rounded-lg border hairline bg-black/20 p-3 text-xs" data-testid="selection-prompt-audit">
    <summary className="cursor-pointer font-semibold text-zinc-200">Selection-to-prompt check · {audit.counts.included} included · {audit.counts.inactive} inactive · <span className={audit.counts.missing ? 'text-amber-200' : ''}>{audit.counts.missing} not detected</span></summary>
    <p className="mt-3 text-zinc-400">Checks selected visual details against the final positive prompt, including manual and AI edits. Wording matches are approximate. Included means matching text was found; it does not guarantee the model will draw the detail. This review does not block rendering.</p>
    <label className="mt-3 flex items-center gap-2 text-zinc-300">Show
      <select aria-label="Filter selection check" value={filter} onChange={event=>setFilter(event.target.value)} className="rounded-lg border hairline bg-elevated px-2 py-2">
        <option value="all">All selections</option><option value="missing">Not detected</option><option value="inactive">Inactive</option><option value="included">Included</option>
      </select>
    </label>
    <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto" aria-label="Selection check results">
      {rows.map(row=><li key={row.key} className="space-y-1 rounded-lg border hairline p-3" data-status={row.status}>
        <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-zinc-200">{row.label}: {row.value}</span><span className={row.status==='included' ? 'text-emerald-200' : row.status==='inactive' ? 'text-zinc-400' : 'text-amber-200'}>{row.status==='missing' ? 'Not detected' : row.status==='included' ? 'Included' : 'Inactive'}</span></div>
        <p className="text-zinc-400">{row.reason}</p>
        {row.status!=='inactive' && row.expected && <p className="break-words text-zinc-400">Expected wording: {row.expected}</p>}
      </li>)}
    </ul>
    {!rows.length && <p className="mt-3 text-zinc-400">No selections in this group.</p>}
  </details>;
}
