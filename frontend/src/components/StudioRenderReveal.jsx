import StudioPreviewMedia from './StudioPreviewMedia';
import {renderFeedback} from '@/lib/renderFeedback';
export default function StudioRenderReveal({render,live={},source,submitting=false}) {
  const feedback=renderFeedback(render?.status,submitting);
  const busy=feedback.busy;
  const currentLive=busy&&live.previewUrl;
  const max=Number(live.max),step=Number(live.step);
  const measured=busy&&live.connected&&Number.isFinite(max)&&max>0&&Number.isFinite(step);
  const percent=measured?Math.max(0,Math.min(100,Math.round(step/max*100))):null;
  return <div className="studio-render-reveal" aria-busy={busy}>
    <div className={`studio-reveal-image ${busy&&!currentLive&&!source?'is-developing':''}`}>
      {currentLive?<img src={currentLive} alt="Live draft from ComfyUI; final image is still generating"/>:<StudioPreviewMedia source={source} status={render?.status} submitting={submitting}/>}
    </div>
    <div className="studio-reveal-status"><p role="status">{feedback.label}{render?.queue_position>0?` · position ${render.queue_position}`:''}</p>
      {measured?<><progress max="100" value={percent} aria-label="Current sampling stage"/><small>Sampling step {step}/{max} · {percent}% of this stage</small></>:busy?<><div className="studio-wait-track" aria-hidden="true"/><small>{live.error||live.connected===false?'Live progress unavailable; checking render status.':'Waiting for sampling progress…'}</small></>:null}
      {busy&&source&&!currentLive&&<small>Previous image shown until a live preview arrives.</small>}
      {render?.error&&<p className="text-rose-300">{render.error}</p>}
    </div>
  </div>;
}
