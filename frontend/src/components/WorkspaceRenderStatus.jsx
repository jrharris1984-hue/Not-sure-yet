import {renderFeedback} from "@/lib/renderFeedback";
import { Link } from 'react-router-dom';
export default function WorkspaceRenderStatus({ render, renders = [], dispatching, onResults }) {
  const pending = renders.filter(item => ['queued', 'running', 'processing', 'pending'].includes(item.status)).length;
  const feedback = renderFeedback(render?.status, dispatching);
  return <details className="workspace-render-status" data-state={feedback.state}>
    <summary><span className={`studio-status-dot ${render?.status === 'failed' ? 'text-rose-300' : ''}`} aria-hidden="true" />{feedback.label}{pending > 0 ? ` · ${pending} pending in this batch` : ''}</summary>
    <div className="workspace-render-details">
      <p>{feedback.message}</p>
      {render?.queue_position > 0 && <p>Queue position: {render.queue_position}</p>}
      {render?.error && <p className="text-rose-300 break-words">{render.error}</p>}
      <div className="flex gap-2 flex-wrap">{render && <button type="button" className="chip" onClick={onResults}>View render details</button>}<Link className="chip" to="/queue">Open full queue</Link></div>
    </div>
  </details>;
}
