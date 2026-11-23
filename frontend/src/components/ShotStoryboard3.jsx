import React from "react";
import {updateShot,reorderShot,duplicateShot,activeShots} from "@/lib/shotPlan3";
const VIEWS=["front","back","rear left three-quarter","rear right three-quarter","left profile","right profile","back from below","back from above","front left three-quarter","front right three-quarter"];
const CAMERA=["eye-level","low","high","rear low upward","rear high downward","side profile low upward","side profile high downward"];
const POSES=["standing","standing hip out","standing hands on hips","walking","sitting on edge","leaning wall","over shoulder look","lying side","kneeling upright"];
const Select=({label,value,options,onChange})=><label className="block text-xs text-zinc-300">{label}<select value={value||""} onChange={e=>onChange(e.target.value||null)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"><option value="">Use character / template</option>{options.map(x=><option key={x} value={x}>{x}</option>)}</select></label>;
export default function ShotStoryboard3({plan,onChange,outfitOptions=[]}){
  return <section className="pane p-4 space-y-3" data-testid="studio3-storyboard">
    <div><h2 className="text-lg font-bold">3.0 Shot Storyboard</h2><p className="text-sm text-zinc-400">Edit individual shots. Disabled shots will not be queued. Preview cards describe the plan, not rendered images.</p></div>
    <div className="text-xs text-amber-200">{activeShots(plan).length} enabled of {plan.shots.length} shots</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{plan.shots.map((shot,index)=><article key={shot.id} className={`rounded-xl border p-3 space-y-3 ${shot.enabled?'border-zinc-700':'border-zinc-800 opacity-60'}`}>
      <div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={shot.enabled} onChange={e=>onChange(updateShot(plan,shot.id,{enabled:e.target.checked}))}/>{shot.label}</label><div className="flex gap-1"><button type="button" className="chip" disabled={index===0} onClick={()=>onChange(reorderShot(plan,index,index-1))} aria-label={`Move ${shot.label} earlier`}>↑</button><button type="button" className="chip" disabled={index===plan.shots.length-1} onClick={()=>onChange(reorderShot(plan,index,index+1))} aria-label={`Move ${shot.label} later`}>↓</button><button type="button" className="chip" disabled={plan.shots.length>=48} onClick={()=>onChange(duplicateShot(plan,shot.id))}>Copy</button></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select label="Subject view" value={shot.subjectView} options={VIEWS} onChange={subjectView=>onChange(updateShot(plan,shot.id,{subjectView}))}/>
        <Select label="Camera height / tilt" value={shot.cameraAngle} options={CAMERA} onChange={cameraAngle=>onChange(updateShot(plan,shot.id,{cameraAngle}))}/>
        <Select label="Pose" value={shot.pose} options={POSES} onChange={pose=>onChange(updateShot(plan,shot.id,{pose}))}/>
        <Select label="Outfit" value={shot.outfit} options={outfitOptions} onChange={outfit=>onChange(updateShot(plan,shot.id,{outfit}))}/>
      </div>
      <details className="text-sm"><summary className="cursor-pointer text-zinc-300">Scene & lighting</summary><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"><label className="text-xs">Environment<input className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2" value={shot.scene.environment||""} onChange={e=>onChange(updateShot(plan,shot.id,{scene:{environment:e.target.value}}))}/></label><label className="text-xs">Lighting style<input className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2" value={shot.lighting.style||""} onChange={e=>onChange(updateShot(plan,shot.id,{lighting:{style:e.target.value}}))}/></label></div></details>
    </article>)}</div>
  </section>;
}
