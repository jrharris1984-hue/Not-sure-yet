import PhysiqueComparison3 from '@/components/PhysiqueComparison3';
import {useState,useRef} from 'react';
import {applyPhysiquePreset,restorePhysiqueRegion,physiqueRegionDifferences} from '@/lib/physiqueStudio3';
import {PHYSIQUE_DETAIL_GROUPS} from '@/lib/physiqueDetails';
import {physiqueScalePrompt} from '@/lib/physiqueScalePrompts';
const regions=[
 {name:'Breasts',key:'bust_scale',axis:'bust',max:2000},
 {name:'Hips',key:'hip_scale',axis:'hips',max:2000},
 {name:'Waist',key:'waist_scale',axis:null,max:500},
 {name:'Glutes',key:'butt_scale',axis:'butt',max:2000},
 {name:'Thighs',key:'thigh_scale',axis:'thighs',max:750},
 {name:'Shoulders',key:'shoulder_width',axis:null,max:100},
 {name:'Arms',key:'upper_arm_fullness',axis:null,max:100},
 {name:'Calves',key:'calf_fullness',axis:null,max:100},
];
const shapeKeys=['roundness','thickness','side_fullness','outer_curve','front_profile','projection_profile','taper'];
const modes=[['Natural',1,100],['Enhanced',101,300],['Extreme',301,600],['Fantasy',601,1000],['Beyond fantasy',1001,2000]];
export default function PhysiqueStudio({value,onChange,locked=false,fieldLocks={}}){
 const [active,setActive]=useState('Breasts');
 const baseline=useRef({...value});
 const [compare,setCompare]=useState(false);
 const region=regions.find(r=>r.name===active);
 const group=PHYSIQUE_DETAIL_GROUPS.find(g=>g.name===active);
 const amount=Number(value[region.key]||0);
 const change=(key,n)=>onChange({...value,[key]:n});
 const selectedMode=modes.findIndex(([,,max])=>amount<=max);
 const currentMode=Math.max(0,selectedMode);
 return <section className="border border-zinc-700 rounded-xl p-3 sm:p-4 space-y-4" aria-label="Physique Studio 3.0" data-testid="physique-studio">
  <div><h3 className="font-semibold text-lg">Physique Studio 3.0</h3><p className="text-xs text-zinc-400">Adjust volume, frame width, fullness and contour by region. Zero leaves the saved preset unchanged.</p></div>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Body regions">{regions.map(r=><button type="button" key={r.name} aria-pressed={active===r.name} onClick={()=>setActive(r.name)} className={`rounded-lg min-h-11 border px-2 py-2 text-sm ${active===r.name?'border-amber-400 bg-amber-500/10':'border-zinc-700'}`}>{r.name}</button>)}</div>
  <div className="rounded-lg border border-zinc-700 p-3 space-y-2" data-testid="physique3-region-presets">
   <div className="flex flex-wrap justify-between items-center gap-2"><strong className="text-sm">{active} · Shape presets</strong><button type="button" className="text-xs underline" onClick={()=>setCompare(v=>!v)}>{compare?'Hide comparison':'Compare with starting values'}</button></div>
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{['subtle','balanced','pronounced','dramatic'].map(preset=><button key={preset} type="button" disabled={locked} onClick={()=>onChange(applyPhysiquePreset(value,active,preset,fieldLocks))} className="min-h-11 rounded-lg border border-zinc-600 px-2 text-xs capitalize hover:border-amber-400">{preset}</button>)}</div>
   <button type="button" disabled={locked} className="text-xs text-amber-200 underline" onClick={()=>onChange(restorePhysiqueRegion(value,baseline.current,active,fieldLocks))}>Restore {active} to starting values</button>
   {compare&&<div className="rounded-lg bg-zinc-900 p-2 text-xs space-y-1"><p className="text-zinc-400">Numeric DNA comparison, not a rendered preview.</p>{physiqueRegionDifferences(baseline.current,value,active).length?physiqueRegionDifferences(baseline.current,value,active).map(row=><div key={row.key} className="flex justify-between gap-2"><span>{row.key.replaceAll('_',' ')}</span><span className="font-mono">{row.before} → {row.after}</span></div>):<p>No changes to this region.</p>}</div>}
  </div>
  <PhysiqueComparison3 baseline={baseline.current} current={value} region={active}/>
  <div className="space-y-3">
   <div className="flex justify-between items-center"><strong>{active} {region.max<=100?'shape intensity':'size'}</strong><span className="font-mono text-amber-300">{amount}</span></div>
   {region.axis&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Volume scale">{modes.map(([label,min,max],i)=><button type="button" key={label} disabled={locked||fieldLocks[region.key]} aria-pressed={currentMode===i&&amount>0} onClick={()=>change(region.key,Math.min(region.max,Math.round((min+max)/2)))} className={`rounded-lg border p-2 text-xs min-h-11 ${currentMode===i&&amount>0?'border-amber-400':'border-zinc-700'}`}>{label}</button>)}</div>}
   <input type="range" aria-label={`${active} volume`} min="0" max={region.max} step="1" value={amount} disabled={locked||fieldLocks[region.key]} onChange={e=>change(region.key,Number(e.target.value))} className="w-full accent-amber-500 min-h-11"/>
   <p className="text-xs text-zinc-400">{region.axis?physiqueScalePrompt(region.axis,amount,region.max)||'Uses existing preset':amount?'Independent waist width adjustment':'Uses existing waist preset'}</p>
  </div>
  <details className="rounded-lg border border-zinc-700 p-3"><summary className="cursor-pointer min-h-9 font-medium">Shape, thickness and contour details</summary><div className="space-y-4 pt-3">{[...group.controls].sort(([a],[b])=>Number(shapeKeys.some(k=>b.endsWith(k)))-Number(shapeKeys.some(k=>a.endsWith(k)))).map(([key,label])=><label key={key} className="block"><span className="flex justify-between text-sm"><span>{label}</span><span className="text-amber-300">{value[key]||0}</span></span><input type="range" min="0" max="100" step="1" value={value[key]||0} disabled={locked||fieldLocks[key]} onChange={e=>change(key,Number(e.target.value))} className="w-full min-h-11 accent-amber-500"/><span className="text-xs text-zinc-500">0 = unchanged</span></label>)}</div></details>
 </section>;
}
