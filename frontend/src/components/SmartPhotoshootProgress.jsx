import { mediaUrl } from '@/lib/media';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const TERMINAL = new Set(['done', 'failed', 'offline', 'cancelled']);
export function photoshootRunRows(run, renders = []) {
  if (!run) return [];
  const latest = new Map(renders.filter(Boolean).map(render => [render.id, render]));
  return run.shots.map((shot, index) => {
    const request = run.requests[index];
    const render = request && (latest.get(request.id) || request);
    return { ...shot, render, status: render?.status || (run.queuing ? 'Preparing' : 'Not queued') };
  });
}
export function photoshootRunPending(run, renders) {
  return !!run && (run.queuing || photoshootRunRows(run, renders).some(row => row.render && !TERMINAL.has(row.status)));
}

export default function SmartPhotoshootProgress({ run, renders, onSelectRender }) {
  const [preview, setPreview] = useState(null);
  if (!run) return null;
  const rows = photoshootRunRows(run, renders);
  const done = rows.filter(row => row.status === 'done').length;
  const processed = rows.filter(row => TERMINAL.has(row.status) || row.status === 'Not queued').length;
  const pending = photoshootRunPending(run, renders);
  return <section className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3" aria-label="Photoshoot progress" data-testid="smart-shoot-progress">
    <div role="status" aria-live="polite" className="text-xs font-semibold text-cyan-200">
      {run.queuing ? 'Adding photoshoot to queue' : pending ? 'Photoshoot in progress' : 'Photoshoot finished'} · {run.label}
      <span className="mt-1 block text-zinc-300">{done} of {rows.length} images completed · {run.requests.length} submitted</span>
    </div>
    <progress className="mt-2 h-2 w-full accent-cyan-400" value={processed} max={rows.length || 1} aria-label="Photoshoot shots processed" />
    {run.error && <p role="alert" className="mt-2 text-xs text-rose-300">{run.error}</p>}
    <p className="mt-2 text-[11px] text-zinc-400">These are the shots submitted for this shoot. Queued shots wait for ComfyUI.</p>
    <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
      {rows.map((row, index) => <div key={index} className="flex items-start gap-2 rounded-lg border hairline p-2 text-xs">
        {row.render?.output_files?.[0] && <button type="button" onClick={() => { setPreview({ render: row.render, title: `Shot ${index + 1}: ${row.title}` }); onSelectRender?.(row.render); }} aria-label={`View photoshoot shot ${index + 1}`} className="shrink-0">
          <img src={mediaUrl(row.render.output_files[0])} alt={`Shot ${index + 1}: ${row.title}`} className="h-16 w-12 rounded object-cover" />
        </button>}
        <div className="min-w-0 flex-1"><div className="font-semibold text-zinc-200">{index + 1}. {row.title}</div>
          <div className="break-words text-[11px] text-zinc-400">{[row.framing, row.pose?.label, row.camera?.label, row.expression].filter(Boolean).join(' · ')}</div>
          {row.render?.error && <div className="mt-1 text-rose-300">{row.render.error}</div>}
        </div>
        <span className={`shrink-0 rounded px-2 py-1 ${row.status === 'done' ? 'bg-emerald-500/15 text-emerald-200' : TERMINAL.has(row.status) || row.status === 'Not queued' ? 'text-rose-300' : 'animate-pulse bg-cyan-500/10 text-cyan-200'}`}>{row.status}</span>
      </div>)}
    </div>
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}>
      <DialogContent data-smart-shoot-viewer="true" className="max-w-5xl bg-zinc-950 p-4">
        <DialogTitle className="pr-12 text-sm text-zinc-100">{preview?.title}</DialogTitle>
        <DialogDescription className="sr-only">Full image from the selected photoshoot shot.</DialogDescription>
        {preview && <img src={mediaUrl(preview.render.output_files[0])} alt={preview.title} className="max-h-[75dvh] w-full object-contain" data-testid="smart-shoot-full-image" />}
      </DialogContent>
    </Dialog>
  </section>;
}
