import { mediaUrl } from '@/lib/media';

export default function CharacterPreviewPanel({ preview, onUpdate, disabled, reason, width, height, seed, seedLocked = true, onSeedChange, onToggleSeedLock, onNewSeed, controlsDisabled }) {
  return <section className="pane overflow-hidden" aria-label="Character preview" data-testid="character-preview-panel">
    <div className="border-b hairline p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Character preview</h2>
        <span className="text-xs text-cyan-300">Test lab</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">Update after changing the character. Each preview uses your GPU. Lock the seed to compare character changes.</p>
      {onSeedChange && <div className="mt-3 space-y-2">
        <label className="block text-xs text-zinc-300">Seed
          <input aria-label="Preview seed" type="number" min="0" max="2147483646" step="1" value={seed} disabled={controlsDisabled}
            onChange={event => onSeedChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-sm" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2 text-xs text-zinc-300">
            <input aria-label="Lock preview seed" type="checkbox" checked={seedLocked} onChange={onToggleSeedLock} disabled={controlsDisabled} />Lock seed
          </label>
          <button type="button" onClick={onNewSeed} disabled={controlsDisabled} className="min-h-11 rounded-lg border hairline px-3 text-xs text-zinc-300 disabled:opacity-40">New seed</button>
        </div>
        <p className="text-[11px] text-zinc-500">{seedLocked ? 'Updates reuse this seed.' : 'Each preview update chooses a new seed. Capture reuses the displayed preview seed.'}</p>
      </div>}
      <button type="button" onClick={onUpdate} disabled={disabled || preview.busy}
        className="mt-3 min-h-11 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">
        {preview.busy ? 'Preview in progress…' : 'Update Preview'}
      </button>
      {reason && <p className="mt-2 text-xs text-amber-200">{reason}</p>}
      <div role="status" aria-live="polite" className="mt-2 text-xs text-zinc-400">
        {preview.busy ? `Preview ${preview.render?.status || 'submitting'}${preview.render?.queue_position ? ` · queue position ${preview.render.queue_position}` : ''}`
          : preview.stale ? 'Selections changed — update the preview.' : preview.image ? 'Preview matches the submitted selections.' : 'Ready for your first preview.'}
      </div>
      {preview.pendingStale && <p className="mt-1 text-xs text-amber-200">This job uses your earlier selections. Update again when it finishes.</p>}
      {preview.error && <p role="alert" className="mt-2 text-xs text-rose-300">{preview.error}</p>}
    </div>
    <details open className="group">
      <summary className="min-h-11 cursor-pointer px-4 py-3 text-xs text-zinc-300">Preview image · tap to collapse</summary>
      <div className="relative grid min-h-48 place-items-center bg-black/25 p-3">
        {preview.image ? <img src={mediaUrl(preview.image)} alt="AI character preview" className="max-h-[55dvh] w-full object-contain" />
          : <p className="p-6 text-center text-sm text-zinc-500">Your character preview will appear here.</p>}
        {preview.stale && <span className="absolute left-3 top-3 rounded-lg bg-amber-950/90 px-3 py-2 text-xs text-amber-100">Earlier selections</span>}
      </div>
    </details>
    <p className="border-t hairline p-3 text-[11px] text-zinc-500">{width && height ? `${width} × ${height} · ` : ''}One image per update. Previews are hidden from Gallery. Final renders can differ.</p>
  </section>;
}
