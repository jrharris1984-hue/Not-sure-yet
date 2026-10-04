import { Upload, Loader2, X, Play } from "lucide-react";

export default function ImageSourceFlow({ animation = false, variation, source, preview, uploading, busy, onUpload, onRemove, onRender, renderCount, onRenderCount, children }) {
  const ready = !!source?.name;
  return <section className="space-y-4" data-testid="image-source-flow">
    <div className="pane p-4 sm:p-5">
      <div className="section-label">{animation ? "WAN · Image to video" : variation ? "Chroma · Image variations" : "Qwen · Image editing"}</div>
      <h2 className="mt-1 font-display text-xl font-bold">Start with your image</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {["Source image", animation ? "Motion & duration" : variation ? "Variation controls" : "Edit controls", "Render"].map((label,index)=><div key={label} className={`rounded-lg border p-2.5 ${index===0 || ready ? "border-cyan-400/30 text-cyan-100" : "hairline text-zinc-500"}`}><span className="mr-2 font-mono">{index+1}</span>{label}</div>)}
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,.8fr)_minmax(0,1.2fr)]">
      <div className="pane p-4 space-y-3" data-testid="source-image-step">
        <div className="section-label">1 · Source image</div>
        <p className="text-xs text-zinc-400">{animation ? "The starting frame supplies appearance, clothing and scene. Describe movement instead of rebuilding the character." : variation ? "Upload the original image. Its composition and aspect ratio provide the starting point." : "Upload the image you want to edit, then describe the changes."}</p>
        {ready ? <div className="space-y-3">
          {preview && <img src={preview} alt="Source image" className="w-full max-h-96 rounded-lg bg-black/30 object-contain"/>}
          <div className="break-all text-xs text-zinc-400">{source.name}</div>
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300"><X className="h-4 w-4"/>Replace source image</button>
        </div> : <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 p-5 text-center hover:bg-cyan-500/10">
          {uploading ? <Loader2 className="h-7 w-7 animate-spin text-cyan-300"/> : <Upload className="h-7 w-7 text-cyan-300"/>}
          <span className="text-sm font-semibold text-cyan-100">{uploading ? "Uploading…" : "Choose source image"}</span>
          <span className="text-xs text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || busy} onChange={event=>onUpload(event.target.files?.[0])} className="hidden" data-testid={animation ? "input-wan-source" : variation ? "input-variation-source" : "input-qwen-edit-source"}/>
        </label>}
      </div>
      <div className="space-y-4" data-testid="source-changes-step">
        {ready ? children : <div className="pane p-5 text-sm text-zinc-400">Upload a source image to open {animation ? "animation" : variation ? "variation" : "editing"} controls.</div>}
        <div className="pane p-4 space-y-3">
          <div className="section-label">3 · Render</div>
          {variation && <label className="block text-xs text-zinc-400">Images
            <select value={renderCount} onChange={event=>onRenderCount(Number(event.target.value))} disabled={busy || !ready} className="mt-1 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100">
              {[1,2,4,6,8,10].map(count=><option key={count} value={count} label={`${count} image${count>1?"s":""}`}/>)}
            </select>
          </label>}
          <button type="button" onClick={onRender} disabled={!ready || uploading || busy} data-testid="btn-source-workflow-render" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}{animation ? "Create video" : variation ? "Create variations" : "Apply edit"}
          </button>
        </div>
      </div>
    </div>
  </section>;
}
