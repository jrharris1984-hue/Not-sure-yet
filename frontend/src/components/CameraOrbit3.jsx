import React from "react";
import {cameraOrbitSelection,ORBIT_VIEWS,ORBIT_ELEVATIONS} from "@/lib/cameraOrbit3";

// Schematic camera-position preview, not a 3D renderer or model output.
export default function CameraOrbit3({subjectView,cameraAngle,onChange}){
  const current=cameraOrbitSelection(subjectView,cameraAngle);
  return <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 space-y-3" data-testid="studio3-camera-orbit">
    <div><div className="text-sm font-semibold">Virtual Camera · 360°</div><p className="text-xs text-zinc-400">Choose camera position around the subject and elevation independently.</p></div>
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative mx-auto w-44 h-44 rounded-full border border-zinc-600 bg-zinc-900" role="group" aria-label="Camera orbit positions">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 pointer-events-none">SUBJECT</div>
        {ORBIT_VIEWS.map((v,i)=>{const radians=(i*45-90)*Math.PI/180;const left=50+42*Math.cos(radians),top=50+42*Math.sin(radians);return <button key={v.value} type="button" title={v.label} aria-label={`Camera position: ${v.label}`} aria-pressed={current.direction===v.value} onClick={()=>onChange({subjectView:v.value,cameraAngle:current.cameraAngle})} style={{left:`${left}%`,top:`${top}%`,transform:"translate(-50%,-50%)"}} className={`absolute w-9 h-9 rounded-full border text-xs font-semibold ${current.direction===v.value?"border-amber-300 bg-amber-600 text-white":"border-zinc-600 bg-zinc-800 text-zinc-200"}`}>{i===0?"F":i===4?"B":i===2?"L":i===6?"R":"↗"}</button>})}
      </div>
      <div className="flex-1 min-w-36 space-y-2"><label className="block text-xs text-zinc-300">Camera elevation<select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={current.elevation} onChange={e=>onChange({subjectView:current.direction,cameraAngle:ORBIT_ELEVATIONS.find(x=>x.value===e.target.value)?.cameraAngle||"eye-level"})}>{ORBIT_ELEVATIONS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><p className="text-xs text-amber-200">View: {current.direction}</p><p className="text-xs text-zinc-400">Height: {current.elevation}</p></div>
    </div>
    <p className="text-xs text-zinc-500">This controls prompt guidance. Actual image orientation depends on model and workflow support.</p>
  </div>;
}
