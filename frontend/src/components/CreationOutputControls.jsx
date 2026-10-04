export default function CreationOutputControls({ workflows, workflowId, onWorkflow, tier, onTier,
  count, onCount, settings, onSettings, fixedSampling = false, family = "image", busy = false, countLocked = false }) {
  const set = (key, value) => onSettings({ ...settings, [key]: value });
  return (
    <div className="space-y-3" data-testid="creation-output-controls">
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">Model
          <select aria-label="Generation model" value={workflowId || ""} onChange={(event) => onWorkflow(event.target.value)}
            className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2 text-sm text-white">
            <option value="" disabled>Choose a model</option>
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-zinc-400">Quality
          <select aria-label="Generation quality" value={tier} onChange={(event) => onTier(event.target.value)}
            className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2 text-sm text-white">
            <option value="draft">Draft</option><option value="balanced">Balanced</option><option value="quality">Quality</option>
          </select>
        </label>
        {family === "image" && <>
          <label className="text-xs text-zinc-400">Images
            <select aria-label="Image count" disabled={countLocked} value={count} onChange={(event) => onCount(Number(event.target.value))}
              className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2 text-sm text-white">
              {[1, 2, 4, 6, 8, 10].map((n) => <option key={n} value={n}>{`${n} image${n === 1 ? "" : "s"}`}</option>)}
            </select>
          </label>
          <label className="text-xs text-zinc-400">Canvas · {settings.width} × {settings.height}
            <select aria-label="Canvas format" value={settings.width === settings.height ? "square" : settings.width < settings.height ? "portrait" : "landscape"}
              onChange={(event) => {
                const long = Math.max(settings.width, settings.height);
                const short = Math.max(256, Math.floor(long * 2 / 3 / 8) * 8);
                onSettings({ ...settings, width: event.target.value === "portrait" ? short : long,
                  height: event.target.value === "landscape" ? short : long });
              }} className="mt-1 block w-full rounded-lg border hairline bg-elevated p-2 text-sm text-white">
              <option value="portrait">Portrait</option><option value="square">Square</option><option value="landscape">Landscape</option>
            </select>
          </label>
        </>}
      </fieldset>
      {family === "image" && <details className="rounded-xl border hairline bg-black/15 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Advanced generation settings</summary>
        <fieldset disabled={busy} className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-400">Steps
            <input aria-label="Sampling steps" type="number" min="1" max="100" value={settings.steps} disabled={fixedSampling}
              onChange={(event) => set("steps", Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50" />
          </label>
          <label className="text-xs text-zinc-400">CFG
            <input aria-label="Sampling CFG" type="number" min="0" max="30" step="0.1" value={settings.cfg} disabled={fixedSampling}
              onChange={(event) => set("cfg", Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50" />
          </label>
          <label className="col-span-2 text-xs text-zinc-400">Sampler
            <select aria-label="Sampling method" value={settings.sampler || "euler"} disabled={fixedSampling}
              onChange={(event) => set("sampler", event.target.value)}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white disabled:opacity-50">
              <option value="euler">Euler</option>
              <option value="dpmpp_2m">DPM++ 2M</option>
              <option value="dpmpp_2m_sde">DPM++ 2M SDE</option>
              {settings.sampler && !["euler", "dpmpp_2m", "dpmpp_2m_sde"].includes(settings.sampler)
                && <option value={settings.sampler}>{settings.sampler}</option>}
            </select>
          </label>
          <label className="col-span-2 text-xs text-zinc-400">Seed · leave blank for a new seed
            <input aria-label="Generation seed" type="number" min="0" max="2147483647" value={settings.seed ?? ""}
              onChange={(event) => set("seed", event.target.value === "" ? "" : Math.max(0, Math.min(2147483647, Math.trunc(Number(event.target.value) || 0))))}
              className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-white" />
          </label>
        </fieldset>
        {fixedSampling && <p className="mt-2 text-[11px] text-zinc-500">This distilled model uses a fixed sampling recipe. Canvas and seed remain adjustable.</p>}
      </details>}
    </div>
  );
}
