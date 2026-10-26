import {useId} from 'react';
import {VIDEO_CAMERA,VIDEO_PACING,normalizeVideoDirector,supportsVideoAudio} from '@/lib/videoDirector';
const cameraLabels={static:'Stationary',follow:'Follow the subject',push_in:'Slow push-in',pull_back:'Slow pull-back',pan_left:'Pan left',pan_right:'Pan right'};
export default function VideoDirector({value,onChange,workflow,frames=41,fps=24,disabled=false}) {
  const id=useId(),d=normalizeVideoDirector(value);
  const set=(key,next)=>onChange({...d,[key]:next});
  const text=(key,label,placeholder)=><label className="block space-y-1" htmlFor={`${id}-${key}`}><span className="text-xs text-zinc-300">{label}</span><textarea id={`${id}-${key}`} value={d[key]} maxLength={800} rows={2} placeholder={placeholder} onChange={event=>set(key,event.target.value)} className="w-full rounded-lg border hairline bg-elevated p-3 text-sm"/></label>;
  return <fieldset disabled={disabled} className="min-w-0 rounded-xl border hairline p-3 space-y-3" data-testid="video-director">
    <legend className="px-1 text-sm font-semibold">Video director</legend>
    <div role="group" aria-label="Video writing mode" className="flex flex-wrap gap-2">
      <button type="button" className={`chip min-h-11 ${!d.enabled?'active':''}`} aria-pressed={!d.enabled} onClick={()=>set('enabled',false)}>Write freely</button>
      <button type="button" className={`chip min-h-11 ${d.enabled?'active':''}`} aria-pressed={d.enabled} onClick={()=>set('enabled',true)}>Build a shot</button>
    </div>
    <p className="text-xs text-zinc-400">{workflow?.kind==='video'?'The starting image supplies appearance and composition. Direct its movement here.':'Your selected characters and scene supply appearance and setting. Direct what happens here.'}</p>
    {d.enabled && <>
      {text('action','Main action','The subject walks along the path and turns toward the camera')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-zinc-300">Camera movement<select value={d.camera} onChange={event=>set('camera',event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border hairline bg-elevated p-2 text-sm">{Object.keys(VIDEO_CAMERA).map(key=><option key={key} value={key}>{cameraLabels[key] || 'Use existing direction'}</option>)}</select></label>
        <label className="text-xs text-zinc-300">Pacing<select value={d.pace} onChange={event=>set('pace',event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border hairline bg-elevated p-2 text-sm">{Object.keys(VIDEO_PACING).map(key=><option key={key} value={key}>{({slow:'Slow',natural:'Natural',brisk:'Brisk'})[key] || 'Use described pace'}</option>)}</select></label>
      </div>
      <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-cyan-200">Beginning, ending & continuity</summary><div className="space-y-3">
        {text('start','At the start (optional)','The subject stands beside the garden gate')}
        {text('end','At the end (optional)','The subject stops and smiles')}
        {text('continuity','Details to keep consistent (optional)','The blue jacket, face, hairstyle and garden lighting')}
      </div></details>
      {supportsVideoAudio(workflow) && text('audio','Audio direction (optional)','Soft footsteps and birds in the distance')}
      <p className="text-xs text-zinc-400">About {((frames-1)/Math.max(1,fps)).toFixed(1)} seconds. Keep short clips to one simple action; timing and continuity depend on the model.</p>
    </>}
  </fieldset>;
}
