import { WebPromptResearchOptions } from '@/components/WebPromptResearch';
import { useState } from 'react';
import { endpoints } from '@/lib/api';

export default function VariationInstruction({ value, onChange, aiProvider = 'AI' }) {
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState('');
  const clarify = async () => {
    if (busy || !value.trim()) return;
    setBusy(true); setError(''); setProposal('');
    try {
      const result = await endpoints.aiEditPrompt(value.trim(), true, 'variation');
      const prompt = result?.prompt?.trim();
      if (!prompt || prompt.length > 2000) throw new Error('AI returned an unusable instruction. Your wording is unchanged.');
      setProposal(prompt);
    } catch (e) { setError(e?.response?.data?.detail || e.message || 'Could not clarify this variation.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3" data-testid="variation-instruction">
    <label className="block space-y-1"><span className="text-xs text-zinc-400">What should vary?</span>
      <textarea rows={4} value={value} disabled={busy} onChange={event => { onChange(event.target.value); setProposal(''); setError(''); }}
        className="w-full rounded-lg bg-elevated border border-hairline p-2 text-sm" data-testid="textarea-variation-prompt" />
    </label>
    <button type="button" disabled={busy || !value.trim()} onClick={clarify} data-testid="btn-clarify-variation"
      className="rounded-lg border border-purple-500/40 px-3 py-2 text-xs text-purple-100 disabled:opacity-40">
      {busy ? 'Clarifying…' : `Clarify with ${aiProvider}`}
    </button>
      <WebPromptResearchOptions disabled={busy}/>
    {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
    {proposal && <div className="space-y-2 rounded-lg border border-purple-500/30 p-3">
      <label className="block text-xs text-zinc-400">AI suggestion · review before applying
        <textarea aria-label="AI variation suggestion" rows={4} value={proposal} onChange={event => setProposal(event.target.value)}
          className="mt-2 w-full rounded-lg border hairline bg-elevated p-2 text-sm" />
      </label>
      <button type="button" disabled={!proposal.trim()} onClick={() => { onChange(proposal.trim()); setProposal(''); }}
        data-testid="btn-apply-variation-wording" className="rounded-lg border border-purple-500/40 px-3 py-2 text-xs text-purple-100 disabled:opacity-40">Use this wording</button>
      <button type="button" onClick={() => setProposal('')} className="ml-2 text-xs text-zinc-400">Keep my wording</button>
    </div>}
    <p className="text-[11px] text-zinc-500">AI clarifies the requested change. It does not generate an image or change the variation strength.</p>
  </div>;
}
