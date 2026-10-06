export default function PromptFormatControl({value, onChange, meta}) {
  return <div className="space-y-2" data-testid="prompt-format-control">
    <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">Prompt format
      <select aria-label="Prompt format" value={value} onChange={event => onChange(event.target.value)} className="rounded-lg border hairline bg-elevated px-2 py-1.5">
        <option value="detailed">Detailed · existing compiler</option>
        <option value="compact">Compact · ordered description</option>
      </select>
    </label>
    <p className="text-xs text-zinc-400">Compact organizes resolved selections by person, clothing, pose and scene. Custom keywords stay intact unless you supply compact wording in the library.</p>
    {value === 'compact' && meta?.detailedPromptWords != null && <p className="text-xs text-cyan-300">{meta.detailedPromptWords} detailed words → {meta.promptWords} compact words. Word counts, not model tokens.</p>}
  </div>;
}
