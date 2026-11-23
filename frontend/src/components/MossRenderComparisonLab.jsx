import { useEffect, useState } from 'react';
import { ArrowLeftRight, Copy, ImagePlus, RotateCcw } from 'lucide-react';

// Manual comparison of two locally generated renders. No backend generation
// or claims of identical sampler/seed settings are made by this component.
export default function MossRenderComparisonLab({ positive = '', workflow, recipe = {}, compilerMeta = {} }) {
  const [open, setOpen] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const [variant, setVariant] = useState(null);
  const [notes, setNotes] = useState('');
  const [baselineMeta, setBaselineMeta] = useState(null);
  const [variantMeta, setVariantMeta] = useState(null);
  useEffect(() => () => {
    if (baseline?.url) URL.revokeObjectURL(baseline.url);
  }, [baseline]);
  useEffect(() => () => {
    if (variant?.url) URL.revokeObjectURL(variant.url);
  }, [variant]);
  if (!Array.isArray(compilerMeta.mossDiagnostics)) return null;

  const snapshot = () => ({
    workflow: workflow?.name || 'Unknown workflow',
    profile: compilerMeta.mossProfile || 'generic',
    seed: recipe?.seed ?? null,
    width: recipe?.width ?? null,
    height: recipe?.height ?? null,
    steps: recipe?.steps ?? null,
    cfg: recipe?.cfg ?? null,
    sampler: recipe?.sampler ?? null,
    scheduler: recipe?.scheduler ?? null,
    prompt: positive,
  });
  const selectImage = (event, side) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const item = { url: URL.createObjectURL(file), name: file.name };
    if (side === 'baseline') { setBaseline(item); setBaselineMeta(snapshot()); }
    else { setVariant(item); setVariantMeta(snapshot()); }
    event.target.value = '';
  };
  const comparable = baselineMeta && variantMeta;
  const fields = ['workflow', 'seed', 'width', 'height', 'steps', 'cfg', 'sampler', 'scheduler'];
  const differences = comparable ? fields.filter(key =>
    baselineMeta[key] == null || variantMeta[key] == null ||
    String(baselineMeta[key]) !== String(variantMeta[key])) : [];
  const copyReport = () => {
    const report = {
      baseline: baselineMeta && { image: baseline?.name, ...baselineMeta },
      variant: variantMeta && { image: variant?.name, ...variantMeta },
      controlledFieldsVerified: comparable && differences.length === 0,
      missingOrDifferentFields: differences,
      notes,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  };
  return <section className="rounded-lg border hairline bg-black/20 p-3 space-y-3" data-testid="moss-render-comparison">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}
      className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-zinc-200">
      <span className="inline-flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-cyan-300"/> MOSS Render Comparison Lab</span>
      <span className="text-[11px] font-normal text-zinc-400">{open ? 'Hide' : 'Compare images'}</span>
    </button>
    {open && <>
      <p className="text-[11px] text-zinc-400">Generate your images normally, then load each result here. Uploads stay in this browser session; this panel does not generate images or change your settings.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['baseline', baseline, baselineMeta],
          ['variant', variant, variantMeta],
        ].map(([side, image, meta]) => <div key={side} className="min-w-0 space-y-2 rounded-lg border hairline p-2">
          <div className="text-xs font-semibold capitalize">{side}</div>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border hairline px-2 py-1.5 text-[11px] text-cyan-200">
            <ImagePlus className="h-3.5 w-3.5"/> Load {side} image
            <input type="file" accept="image/*" className="sr-only" onChange={event => selectImage(event, side)}/>
          </label>
          {image ? <img src={image.url} alt={side + ' comparison render'} className="w-full rounded-md object-contain max-h-80"/> :
            <div className="flex min-h-32 items-center justify-center rounded-md bg-elevated text-[11px] text-zinc-500">No image selected</div>}
          <p className="break-words text-[11px] text-zinc-400">{image?.name || 'Awaiting image'}</p>
          {meta && <div className="text-[11px] text-zinc-400">Seed: {meta.seed ?? 'unknown'} · {meta.width ?? '?'} × {meta.height ?? '?'} · Steps: {meta.steps ?? '?'} · CFG: {meta.cfg ?? '?'} · {meta.profile}</div>}
        </div>)}
      </div>
      {comparable && <div className={`text-[11px] ${differences.length ? 'text-amber-200' : 'text-emerald-300'}`}>
        {differences.length
          ? `Not a controlled comparison: missing or different settings — ${differences.join(', ')}. The images may have been rendered with different actual settings.`
          : 'Recorded settings match. Confirm both images were actually rendered with those settings; uploads alone cannot verify metadata.'}
      </div>}
      <label className="block space-y-1 text-[11px] text-zinc-300">
        <span>Observations (silhouette, contour, prompt adherence)</span>
        <textarea value={notes} onChange={event => setNotes(event.target.value)}
          className="w-full rounded-md border hairline bg-elevated p-2 text-xs" rows={3} placeholder="What changed between the two renders?"/>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyReport} className="inline-flex items-center gap-1 rounded-md border hairline px-2 py-1.5 text-[11px] text-cyan-200"><Copy className="h-3.5 w-3.5"/> Copy comparison report</button>
        <button type="button" onClick={() => {setBaseline(null);setVariant(null);setBaselineMeta(null);setVariantMeta(null);setNotes('');}} className="inline-flex items-center gap-1 rounded-md border hairline px-2 py-1.5 text-[11px] text-zinc-300"><RotateCcw className="h-3.5 w-3.5"/> Reset</button>
      </div>
    </>}
  </section>;
}
