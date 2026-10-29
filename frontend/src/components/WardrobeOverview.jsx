import {wardrobeMode,wardrobeFieldDisabled} from '@/lib/wardrobeMode';
import {resolveBuilderControls} from '@/lib/builderControlResolution';

const present=value=>value!==undefined && value!==null && value!=='' && (!Array.isArray(value) || value.length>0);
const hidden=new Set(['outfit_mode','set_lingerie_mode','nudity_level','nudity_outfit','garment_priority']);
export function wardrobeOverview(value,fields) {
  const {dna,notes}=resolveBuilderControls({wardrobe:value});
  const active=fields.filter(field=>!hidden.has(field.key) && !wardrobeFieldDisabled(field.key,value) && present(dna.wardrobe[field.key])).map(field=>({
    key:field.key,label:field.label,value:(Array.isArray(dna.wardrobe[field.key])?dna.wardrobe[field.key]:[dna.wardrobe[field.key]]).map(item=>field.optionLabels?.[item] || String(item)).join(', '),
  }));
  const inactive=fields.filter(field=>!hidden.has(field.key) && present(value[field.key]) && (wardrobeFieldDisabled(field.key,value) || !present(dna.wardrobe[field.key])));
  return {active,inactive,notes:[...new Set(notes.filter(note=>note.section==='wardrobe').map(note=>note.text))]};
}

export default function WardrobeOverview({value={},fields=[],onModeChange,disabled=false,showInactive=false,onShowInactive}) {
  const mode=wardrobeMode(value),summary=wardrobeOverview(value,fields);
  const row=item=><div key={item.key} className="min-w-0"><dt className="text-xs text-zinc-400">{item.label}</dt><dd className="break-words text-sm">{item.value}</dd></div>;
  return <div className="space-y-3 rounded-xl border hairline bg-elevated p-3" data-testid="wardrobe-mode-controls">
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Outfit mode">
      {[['full','Choose an outfit','One coordinated set'],['custom','Build from garments','Separate clothes and accessories']].map(([key,title,help])=><button type="button" key={key} disabled={disabled} aria-pressed={mode===key} data-testid={`wardrobe-mode-${key}`} onClick={()=>onModeChange(key)} className={`min-h-11 rounded-lg border p-3 text-left disabled:opacity-40 ${mode===key?'border-cyan-400 bg-cyan-400/10':'hairline'}`}><span className="block text-sm font-semibold">{title}</span><span className="text-xs text-zinc-400">{help}</span></button>)}
    </div>
    <p className="text-xs text-zinc-400">{mode==='full'?'Customize the set with its color and available layer or coverage controls. Individual garment choices stay saved but inactive.':'Edit individual garments below. Switching here restores your saved pieces; it does not split a complete outfit into garments.'}</p>
    <div aria-label="Currently wearing"><h3 className="text-sm font-semibold">Currently wearing</h3><p className="mb-2 text-xs text-zinc-400">Wardrobe selections after outfit and clothing rules. Check the final prompt for model and framing adjustments.</p>
      {summary.active.length ? <><dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">{summary.active.slice(0,4).map(row)}</dl>{summary.active.length>4 && <details className="mt-2"><summary className="cursor-pointer text-xs">{summary.active.length-4} more selected details</summary><dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{summary.active.slice(4).map(row)}</dl></details>}</>:<p className="text-sm text-zinc-400">{mode==='full'?'Choose a complete outfit to get started.':'Choose a garment to get started.'}</p>}
    </div>
    {summary.notes.length>0 && <details><summary className="cursor-pointer text-xs text-amber-200">Why some choices are inactive</summary><ul className="mt-2 list-disc space-y-1 pl-4 text-xs">{summary.notes.map(note=><li key={note}>{note}</li>)}</ul></details>}
    {onShowInactive && <button type="button" className="chip min-h-11" aria-pressed={showInactive} onClick={()=>onShowInactive(!showInactive)}>{showInactive?'Hide inactive controls':'Show inactive controls'}{summary.inactive.length>0?` · ${summary.inactive.length} saved`:''}</button>}
  </div>;
}
