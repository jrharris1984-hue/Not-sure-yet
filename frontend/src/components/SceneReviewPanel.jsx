export default function SceneReviewPanel({plan, saved = false}) {
  if (!plan) return null;
  return <details className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs" data-testid="scene-review">
    <summary className="cursor-pointer font-semibold text-cyan-100">{saved ? 'Saved scene intentions' : 'Scene review'} · {plan.subject_count} {plan.subject_count === 1 ? 'subject' : 'subjects'}</summary>
    <p className="mt-2 text-zinc-400">{saved ? 'Selections saved when this render was queued.' : 'Resolved selections for the next render.'} Manual prompt edits and AI suggestions may differ; the final prompt is available below. This does not verify image accuracy.</p>
    <div className="mt-3 space-y-3">{plan.sections.map((section, index) => <div key={index}>
      <h4 className="font-semibold text-zinc-200">{section.label}</h4>
      <ul className="mt-1 space-y-1 text-zinc-300 break-words">{section.details.map((detail, i) => <li key={i}>{detail}</li>)}</ul>
    </div>)}</div>
    {!!plan.missing.length && <p className="mt-3 text-zinc-400">Not specified: {plan.missing.join(', ')}. The model will choose these details.</p>}
    {!!plan.adjustments.length && <div className="mt-3 text-amber-200"><p>Selection adjustments</p><ul className="mt-1 space-y-1">{plan.adjustments.map((text, index) => <li key={index}>{text}</li>)}</ul></div>}
  </details>;
}
