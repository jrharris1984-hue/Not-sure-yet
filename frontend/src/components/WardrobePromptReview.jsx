import {wardrobePromptReview,stageWardrobePromptUpdates} from '@/lib/wardrobePromptUpdates';
export default function WardrobePromptReview({catalog,onChange,disabled=false}) {
  const rows=wardrobePromptReview(catalog);
  const eligible=rows.filter(row=>!row.customized);
  if (!rows.length) return null;
  return <details className="pane p-4" data-testid="wardrobe-prompt-review">
    <summary className="cursor-pointer font-semibold">Review wardrobe wording · {eligible.length} updates · {rows.length-eligible.length} customized</summary>
    <p className="my-3 text-sm text-zinc-400">These updates remove unselected colors, materials and styling from built-in phrases. Customized wording is preserved. Stage changes below, then Save library to apply them.</p>
    <button type="button" className="chip min-h-11" disabled={disabled || !eligible.length} onClick={()=>onChange(stageWardrobePromptUpdates(catalog,eligible.map(row=>row.id)))}>Stage unchanged defaults</button>
    <div className="mt-3 max-h-96 space-y-3 overflow-y-auto">{rows.map(row=><div key={row.id} className="rounded border hairline p-3 text-sm">
      <p className="font-semibold">{row.field.replaceAll('_',' ')} · {row.value}</p>
      <p className="break-words text-zinc-400">Current: {row.current}</p>
      <p className="break-words text-cyan-200">Proposed: {row.after}</p>
      {row.customized ? <p className="mt-2 text-xs">Custom wording or compact override retained. Edit this choice manually if desired.</p> : <button type="button" className="chip mt-2 min-h-11" disabled={disabled} onClick={()=>onChange(stageWardrobePromptUpdates(catalog,[row.id]))}>Stage {row.value}</button>}
    </div>)}</div>
  </details>;
}
