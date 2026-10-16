export default function FinalPromptSummary({ assembly }) {
  if (!assembly) return null;
  return <div className={`rounded-lg border px-3 py-2 text-xs ${assembly.overBudgetWords ? "border-amber-400/30 text-amber-200" : "hairline text-zinc-400"}`} data-testid="final-prompt-summary">
    <p>Final prompt: {assembly.words} words · ~{assembly.estimatedTokens} estimated tokens</p>
    {assembly.overBudgetWords > 0 && <p className="mt-1">{assembly.overBudgetWords} words above guidance. Your selections were kept; try Compact or simplify optional wording.</p>}
  </div>;
}
