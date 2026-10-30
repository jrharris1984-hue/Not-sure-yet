import CreateSetupSummary from './CreateSetupSummary';
import StudioRenderReveal from './StudioRenderReveal';
import {renderFeedback} from '@/lib/renderFeedback';
export default function GuidedCharacterPreview({ preview, name, dna, stages, sections, onSection, onReview, renderStatus, render, live, submitting=false }) {
  const feedback=renderFeedback(renderStatus,submitting);
  return <aside className="guided-preview self-start space-y-3 max-h-[calc(100dvh-8rem)] overflow-y-auto" aria-label="Character preview and setup">
    <section className="pane rounded-2xl overflow-hidden">
      <div className="border-b hairline p-3"><h2 className="text-sm font-semibold">{name || 'Your character'}</h2>
        <p className="mt-1 text-xs text-zinc-400" role="status">{feedback.label}{preview && feedback.busy ? ' · showing previous preview' : ''}</p></div>
      <StudioRenderReveal source={preview} render={render || {status:renderStatus}} live={live} submitting={submitting}/>
      <p className="p-3 text-xs text-zinc-500">Editing choices does not update this image automatically.</p>
    </section>
    <details className="pane rounded-xl p-3"><summary className="cursor-pointer text-sm font-semibold">Your setup</summary><CreateSetupSummary compact dna={dna} stages={stages} sections={sections} onSection={onSection}/></details>
    <button type="button" className="min-h-11 w-full rounded-xl bg-cyan-300 px-3 text-sm font-bold text-black" onClick={onReview}>Review & create</button>
  </aside>;
}
