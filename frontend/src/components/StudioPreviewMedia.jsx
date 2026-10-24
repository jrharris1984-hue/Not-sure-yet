import {useRef, useState} from 'react';
import {ImageIcon, Expand, RefreshCw} from 'lucide-react';
import {mediaUrl} from '@/lib/media';
import {galleryIsVideo} from '@/lib/galleryBrowse';
import {renderFeedback} from '@/lib/renderFeedback';
import './StudioPreviewMedia.css';

export default function StudioPreviewMedia({source, status, submitting=false, alt='Character preview'}) {
  const [failedSource,setFailedSource]=useState(null);
  const [expanded,setExpanded]=useState(false);
  const dialog=useRef(null), trigger=useRef(null);
  const feedback=renderFeedback(status,submitting);
  const failed=!!source && failedSource===source;
  const close=()=>{dialog.current?.close();setExpanded(false);trigger.current?.focus();};
  const media=()=>galleryIsVideo(source)
    ? <video src={mediaUrl(source)} controls playsInline onError={()=>setFailedSource(source)} aria-label={alt}/>
    : <img src={mediaUrl(source)} alt={alt} onError={()=>setFailedSource(source)}/>;
  return <div className="studio-preview-media" data-testid="studio-preview-media">
    {source && !failed ? media() : <div className="studio-preview-placeholder">
      <ImageIcon aria-hidden="true" size={28}/>
      <p>{failed ? 'Preview unavailable' : feedback.label}</p>
      <span>{failed ? 'The image could not load. Retry the preview without starting another render.' : feedback.message}</span>
      {failed && <button type="button" className="chip" onClick={()=>setFailedSource(null)}><RefreshCw size={14} aria-hidden="true"/>Retry preview</button>}
    </div>}
    {source && !failed && <button ref={trigger} type="button" className="chip studio-preview-expand" aria-label="View larger preview"
      onClick={()=>{setExpanded(true);dialog.current.showModal();}}><Expand size={16} aria-hidden="true"/><span>View larger</span></button>}
    <dialog ref={dialog} className="studio-preview-dialog" aria-label="Expanded character preview" onCancel={()=>setExpanded(false)}
      onClose={()=>{setExpanded(false);trigger.current?.focus();}}>
      {expanded && <><header><h2>Character preview</h2><button type="button" className="chip" onClick={close} autoFocus>Close preview</button></header>
        <div className="studio-preview-dialog-media">{failed ? <p>Preview could not load. Close this view and select Retry preview.</p> : media()}</div>
        <p className="studio-preview-caption">Editing choices does not update this image automatically.</p></>}
    </dialog>
  </div>;
}
