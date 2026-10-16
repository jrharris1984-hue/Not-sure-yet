export default function PromptFormatControl({value, onChange, meta, status, formats = ["detailed","scene","compact","ollama"]}) {
  return <div className="space-y-2" data-testid="prompt-format-control">
    <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">Prompt format
      <select aria-label="Prompt format" value={value} onChange={event => onChange(event.target.value)} className="rounded-lg border hairline bg-elevated px-2 py-1.5">
        {formats.includes("detailed") && <option value="detailed">Detailed · existing compiler</option>}
        {formats.includes("scene") && <option value="scene">Scene · connected composition</option>}
        {formats.includes("compact") && <option value="compact">Compact · ordered description</option>}
        {formats.includes("ollama") && <option value="ollama">Ollama · checked description</option>}
      </select>
    </label>
    {value === 'scene' ? <p className="text-xs text-zinc-400">Scene connects the setting, subjects, clothing, action, lighting and camera using your resolved selections.</p> : <p className="text-xs text-zinc-400">Compact organizes resolved selections by person, clothing, pose and scene. Custom keywords stay intact unless you supply compact wording in the library.</p>}
    {value !== 'detailed' && meta?.detailedPromptWords != null && <p className="text-xs text-cyan-300">{meta.detailedPromptWords} detailed words → {meta.promptWords} {value === 'scene' ? 'scene' : 'compact'} words. Word counts, not model tokens.</p>}
    {value === 'scene' && meta?.scenePlan && <details className="rounded-lg border hairline p-2 text-xs text-zinc-400">
      <summary className="cursor-pointer text-cyan-200">Scene plan · {meta.scenePlan.subjectCount} subject{meta.scenePlan.subjectCount === 1 ? '' : 's'}</summary>
      <p className="mt-2">Selected context: {Object.entries(meta.scenePlan.present).filter(([,present]) => present).map(([key]) => key).join(', ') || 'none'}.</p>
      {!!meta.scenePlan.missing.length && <p className="mt-1">Not specified: {meta.scenePlan.missing.join(', ')}. No specific details are invented for these.</p>}
      {meta.scenePlan.selectedSubjects < meta.scenePlan.subjectCount && <p className="mt-1">{meta.scenePlan.selectedSubjects} of {meta.scenePlan.subjectCount} people have individual character descriptions.</p>}
      <p className="mt-1">Wording review checks the prompt; image accuracy still needs a render test.</p>
    </details>}
    {value === 'scene' && !meta?.scenePlan && <p className="text-xs text-zinc-400">Edit and image-to-video workflows use their task instructions.</p>}
    {status && <p role="status" className="text-xs text-cyan-300">{status}</p>}
    <p className="text-xs text-zinc-500">Your format stays saved until you change it.</p>
  </div>;
}
