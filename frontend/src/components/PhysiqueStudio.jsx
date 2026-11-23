import {useState} from 'react';
import {PHYSIQUE_DETAIL_GROUPS} from '@/lib/physiqueDetails';
import {physiqueScalePrompt} from '@/lib/physiqueScalePrompts';
const regions=[
 {name:'Breasts',key:'bust_scale',axis:'bust',max:2000},
 {name:'Hips',key:'hip_scale',axis:'hips',max:2000},
 {name:'Waist',key:'waist_scale',axis:null,max:500},
 {name:'Glutes',key:'butt_scale',axis:'butt',max:2000},
 {name:'Thighs',key:'thigh_scale',axis:'thighs',max:750},
];
const modes=[['Natural',1,100],['Enhanced',101,300],['Extreme',301,600],['Fantasy',601,1000],['Beyond fantasy',1001,2000]];
export default function PhysiqueStudio({value,onChange,locked=false,fieldLocks={}}){
 const [active,setActive]=useState('Breasts');
 const region=regions.find(r=>r.name===active);
 const group=PHYSIQUE_DETAIL_GROUPS.find(g=>g.name===active);
 const amount=Number(value[region.key]||0);
 const change=(key,n)=>onChange({...value,[key]:n});
 const selectedMode=modes.findIndex(([,,max])=>amount<=max);
 const currentMode=Math.max(0,selectedMode);
 return <section className="border border-zinc-700 rounded-xl p-3 sm:p-4 space-y-4" aria-label="Physique Studio 3.0" data-testid="physique-studio">
  <div><h3 className="font-semibold text-lg">Physique Studio 3.0</h3><p className="text-xs text-zinc-400">Choose a region, then refine its volume and silhouette. Zero retains the original preset.</p></div>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Body regions">{regions.map(r=><button type="button" key={r.name} aria-pressed={active===r.name} onClick={()=>setActive(r.name)} className={`rounded-lg min-h-11 border px-2 py-2 text-sm ${active===r.name?'border-amber-400 bg-amber-500/10':'border-zinc-700'}`}>{r.name}</button>)}</div>
  <div className="space-y-3">
   <div className="flex justify-between items-center"><strong>{active} size</strong><span className="font-mono text-amber-300">{amount}</span></div>
   {region.axis&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Volume scale">{modes.map(([label,min,max],i)=><button type="button" key={label} disabled={locked||fieldLocks[region.key]} aria-pressed={currentMode===i&&amount>0} onClick={()=>change(region.key,Math.min(region.max,Math.round((min+max)/2)))} className={`rounded-lg border p-2 text-xs min-h-11 ${currentMode===i&&amount>0?'border-amber-400':'border-zinc-700'}`}>{label}</button>)}</div>}
   <input type="range" aria-label={`${active} volume`} min="0" max={region.max} step="1" value={amount} disabled={locked||fieldLocks[region.key]} onChange={e=>change(region.key,Number(e.target.value))} className="w-full accent-amber-500 min-h-11"/>
   <p className="text-xs text-zinc-400">{region.axis?physiqueScalePrompt(region.axis,amount,region.max)||'Uses existing preset':amount?'Independent waist width adjustment':'Uses existing waist preset'}</p>
  </div>
  <details className="rounded-lg border border-zinc-700 p-3"><summary className="cursor-pointer min-h-9 font-medium">Shape and contour details</summary><div className="space-y-4 pt-3">{group.controls.map(([key,label])=><label key={key} className="block"><span className="flex justify-between text-sm"><span>{label}</span><span className="text-amber-300">{value[key]||0}</span></span><input type="range" min="0" max="100" step="1" value={value[key]||0} disabled={locked||fieldLocks[key]} onChange={e=>change(key,Number(e.target.value))} className="w-full min-h-11 accent-amber-500"/><span className="text-xs text-zinc-500">0 = unchanged</span></label>)}</div></details>
 </section>;
}
