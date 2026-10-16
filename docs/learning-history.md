# Learning History — framing recommendations

Expand **Learning History · framing recommendations** in Builder's Prompt String, or in mobile Create output controls. The panel loads on opening and includes a manual refresh. Rate framing in Gallery using the feedback controls introduced in PR #360.

This release learns observational patterns in image size, not model weights. A candidate requires at least three framing matches across two different successful prompts, and a matched rate of at least 75% among assessed results at that size. The panel displays the counts, model filenames and links to up to six supporting renders. Neither this threshold nor the observed rate is a statistical confidence estimate or evidence that image size caused an improvement.

Evidence comes from completed, visible image renders with an output, a known seed, and framing rated matched/missed. Unassessed and not-applicable ratings do not contribute. Copies with the same actual graph, prompt, seed and dimensions count once, using the newest feedback. Size suggestions stay separate by workflow graph revision, requested LoRAs and node overrides, normalized sampling settings, subject count and resolved framing. Explicit camera aspect-ratio selections take priority: candidates must match that ratio within 0.5% pixel rounding; unrecognized custom ratios receive no size recommendations. Actual graph signatures further separate different resolved model/adapter setups. Filenames identify model files; file contents are not hashed. Changed weights under an unchanged filename cannot be detected.

Only new renders that record learning context can contribute. Historical records are not assigned a guessed model setup. The API checks the latest 2,000 rated renders for the selected workflow and discloses when that cap is reached. This is local feedback processing and does not require an AI service.

**Apply image size** rechecks evidence with the server, records approval, then changes only width and height in the open Builder. It never renders automatically or changes prompts, DNA, field locks, steps, guidance, LoRAs or seeds. Exact recipe mode blocks application. **Undo image size** restores the prior dimensions while the panel remains open, provided dimensions have not since been edited. Leaving the setup cancels pending application. Approvals are not permanent defaults or automatic preferences.

**Dismiss** persists across sessions. Dismissed candidates remain under a disclosure with **Restore recommendation**. Candidates disappear if feedback is removed or their evidence falls below the threshold. The stored approval/dismissal remains available should the same supported pattern recur.

Endpoints:
- `POST /api/learning/history`: inspect candidates for a workflow and current creation context.
- `POST /api/learning/recommendations/{id}/decision`: persist applied/dismissed/active decisions after revalidating evidence. A stale candidate returns 409; unsupported workflows return 400.

The system does not train an image model, silently tune workflows, modify existing renders, or claim automatic visual assessment. Controlled comparisons and additional recommendation types can be added after these recommendations are evaluated in actual use.
