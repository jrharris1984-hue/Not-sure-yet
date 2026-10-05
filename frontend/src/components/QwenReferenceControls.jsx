import { QWEN_CAMERA_OPTIONS } from '@/lib/qwenReferenceEdit';

export default function QwenReferenceControls({ variant, camera, onCamera, notes, onNotes, poseSource, posePreview, uploading, busy, onUpload, onRemove }) {
  const pose = variant === 'pose';
  return <div className="pane p-4 space-y-4" data-testid="qwen-reference-controls">
    <div className="section-label">{pose ? 'Qwen · Change pose with AnyPose' : 'Qwen · Change camera angle'}</div>
    <p className="text-xs text-zinc-400">{pose
      ? 'The original photo supplies the person and outfit. The second image supplies the target pose and framing. A clear mannequin or single-person photograph works best.'
      : 'Choose a new viewpoint around the person. The workflow requests the same pose, person and outfit.'}</p>
    {pose ? <div className="space-y-2">
      {poseSource?.name ? <>
        {posePreview && <img src={posePreview} alt="Target pose" className="w-full max-h-64 rounded-lg object-contain" />}
        <p className="break-all text-xs text-zinc-400">{poseSource.name}</p>
        <button type="button" disabled={busy || uploading} onClick={onRemove} className="rounded-lg border hairline px-3 py-2 text-xs">Replace target pose</button>
      </> : <label className="block cursor-pointer rounded-lg border border-dashed border-cyan-400/40 p-4 text-sm text-cyan-100">
        {uploading ? 'Uploading target pose…' : 'Choose target pose image'}
        <input type="file" aria-label="Target pose image" accept="image/jpeg,image/png,image/webp" disabled={busy || uploading} onChange={event => onUpload(event.target.files?.[0])} className="mt-2 block w-full text-xs" />
      </label>}
    </div> : <div className="grid gap-3 sm:grid-cols-3">{Object.entries(QWEN_CAMERA_OPTIONS).map(([key, options]) => <label key={key} className="space-y-1 text-xs text-zinc-400">
      <span>{({ azimuth: 'View', elevation: 'Camera height', distance: 'Framing' })[key]}</span>
      <select aria-label={key} value={camera[key]} onChange={event => onCamera({ ...camera, [key]: event.target.value })} disabled={busy}
        className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100">{options.map(option => <option key={option} value={option}>{option}</option>)}</select>
    </label>)}</div>}
    <label className="block space-y-1 text-xs text-zinc-400"><span>Optional direction</span>
      <textarea aria-label="Reference edit direction" maxLength={1000} rows={2} value={notes} onChange={event => onNotes(event.target.value)} disabled={busy}
        placeholder={pose ? 'e.g. Keep the original room and garment details.' : 'e.g. Keep the original room and photographic lighting.'}
        className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100" />
    </label>
    <p className="text-[11px] text-zinc-500">Preservation is requested, not guaranteed. Hidden clothing details and backgrounds may be reconstructed. Rotate sideways photographs upright before uploading.</p>
  </div>;
}
