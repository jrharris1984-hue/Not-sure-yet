import {useEffect, useRef, useState} from 'react';
import useTabPreference from '@/hooks/useTabPreference';

export default function WorkspacePreviewLayout({ children, preview, hasPreview = true, editTarget, heading }) {
  const [wide,setWide]=useState(()=>window.innerWidth>=1280);
  useEffect(()=>{
    const resize=()=>setWide(window.innerWidth>=1280);
    window.addEventListener('resize',resize);
    return ()=>window.removeEventListener('resize',resize);
  },[]);
  const [savedView,setView]=useTabPreference('ultra:workspace-view:split-studio','auto');
  const previousTarget=useRef(editTarget);
  useEffect(()=>{
    if(previousTarget.current!==editTarget) {
      if(previousTarget.current!==undefined && editTarget!==undefined && savedView==='preview')setView(wide?'split':'edit');
      previousTarget.current=editTarget;
    }
    // Navigation into a detail should reveal its editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[editTarget]);
  const requested=['edit','split','preview'].includes(savedView)?savedView:'auto';
  const view=requested==='auto' ? wide ? 'split':'edit' : requested==='split' && !wide ? 'edit':requested;
  const [savedWidth, setWidth] = useTabPreference('ultra:preview-width', 320);
  const width = Math.max(260, Math.min(480, Number(savedWidth) || 320));
  return <div className="workspace-preview-layout" data-workspace-mode={view} data-preview-open={view!=='edit'} style={{'--workspace-preview-width':`${width}px`}}>
    <div className="workspace-preview-tools">
      {heading}
      <div className="workspace-view-switch" role="group" aria-label="Editor view">
        {['edit',...(wide?['split']:[]),'preview'].map(mode=><button type="button" key={mode} aria-pressed={view===mode} onClick={()=>setView(mode)}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}
      </div>
      {view==='split' && <details className="workspace-preview-options"><summary>Preview size</summary><label className="workspace-preview-size">Width
        <input type="range" min="260" max="480" step="20" value={width} onChange={event => setWidth(Number(event.target.value))} />
      </label></details>}
    </div>
    <div className="workspace-editor-content" hidden={view==='preview'}>{children}</div>
    {view!=='edit' && <div className="workspace-preview-content">{preview}</div>}
  </div>;
}
