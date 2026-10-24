import useTabPreference from '@/hooks/useTabPreference';
export default function WorkspacePreviewLayout({ children, preview }) {
  const [open, setOpen] = useTabPreference('ultra:preview-open', true);
  const [savedWidth, setWidth] = useTabPreference('ultra:preview-width', 320);
  const width = Math.max(260, Math.min(480, Number(savedWidth) || 320));
  return <div className="workspace-preview-layout" data-preview-open={open} style={{'--workspace-preview-width':`${width}px`}}>
    <div className="workspace-preview-tools">
      <button type="button" className="chip" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide preview' : 'Show preview'}</button>
      {open && <label className="workspace-preview-size">Preview width
        <input type="range" min="260" max="480" step="20" value={width} onChange={event => setWidth(Number(event.target.value))} />
      </label>}
    </div>
    <div className="workspace-editor-content">{children}</div>
    {open && <div className="workspace-preview-content">{preview}</div>}
  </div>;
}
