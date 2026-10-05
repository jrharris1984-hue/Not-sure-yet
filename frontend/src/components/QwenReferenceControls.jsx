import { QWEN_CAMERA_OPTIONS, QWEN_CAMERA_PRESETS, cameraWarnings } from '@/lib/qwenReferenceEdit';

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
    </div> : <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{Object.entries(QWEN_CAMERA_PRESETS).map(([key, preset]) => <button key={key} type="button" disabled={busy} className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs text-cyan-200" onClick={() => {
        onCamera({ ...camera, distance: preset.distance, denoise: preset.denoise, loraStrength: preset.loraStrength });
      }}>{preset.label}</button>)}</div>
      <p className="text-xs text-zinc-400">Subtle starts with a close crop and reduced reconstruction. This is a starting point to compare, not a guarantee. Full uses the previous reconstruction setting.</p>
      <label className="block space-y-1 text-xs text-zinc-400">Source photo framing
        <select aria-label="Source photo framing" value={camera.sourceFraming || 'unknown'} disabled={busy} onChange={event => onCamera({ ...camera, sourceFraming: event.target.value })} className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100">
          <option value="unknown">Not specified</option><option value="close-up">Close-up / tightly cropped</option><option value="medium shot">Medium shot</option><option value="wide shot">Wide shot / full scene</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">{Object.entries(QWEN_CAMERA_OPTIONS).map(([key, options]) => <label key={key} className="space-y-1 text-xs text-zinc-400">
      <span>{({ azimuth: 'View', elevation: 'Camera height', distance: 'Framing' })[key]}</span>
      <select aria-label={key} value={camera[key]} onChange={event => onCamera({ ...camera, [key]: event.target.value })} disabled={busy}
        className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100">{options.map(option => <option key={option} value={option}>{option}</option>)}</select>
    </label>)}</div>
      <label className="block space-y-2 text-xs text-zinc-400">Reconstruction amount · {Math.round((camera.denoise ?? 1) * 100)}%
        <input aria-label="Camera reconstruction amount" type="range" min="0.5" max="1" step="0.05" value={camera.denoise ?? 1} disabled={busy} onChange={event => onCamera({ ...camera, denoise: Number(event.target.value) })} className="w-full"/>
        <span className="block">Lower stays closer to the source but may barely change the angle. Higher allows more reconstruction. This is not a percentage guarantee of image preservation.</span>
      </label>
      <label className="block space-y-2 text-xs text-zinc-400">Camera LoRA strength · {(camera.loraStrength ?? 0.9).toFixed(2)}
        <input aria-label="Camera LoRA strength" type="range" min="0.8" max="1" step="0.05" value={camera.loraStrength ?? 0.9} disabled={busy} onChange={event => onCamera({ ...camera, loraStrength: Number(event.target.value) })} className="w-full"/>
        <span className="block">Start at 0.90. This controls camera guidance separately from reconstruction.</span>
      </label>
      {cameraWarnings(camera).length > 0 && <div className="rounded-lg border border-amber-400/30 p-3 text-xs text-amber-100" aria-label="Camera render checks"><ul className="list-disc pl-4 space-y-2">{cameraWarnings(camera).map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
      <p className="text-xs text-zinc-400">For a useful comparison, keep the same source and camera choices, then change one setting at a time. Inspect the raw output before enhancement.</p>
    </div>}
    <label className="block space-y-1 text-xs text-zinc-400"><span>Optional direction</span>
      <textarea aria-label="Reference edit direction" maxLength={1000} rows={2} value={notes} onChange={event => onNotes(event.target.value)} disabled={busy}
        placeholder={pose ? 'e.g. Keep the original room and garment details.' : 'e.g. Keep the original room and photographic lighting.'}
        className="w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100" />
    </label>
    <p className="text-[11px] text-zinc-500">Preservation is requested, not guaranteed. Hidden clothing details and backgrounds may be reconstructed. Rotate sideways photographs upright before uploading.</p>
  </div>;
}
