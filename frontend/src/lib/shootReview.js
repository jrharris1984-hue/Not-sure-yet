export function shootReviewRank(review) {
  if (!review) return null;
  const matched = Array.isArray(review.matched) ? review.matched.length : 0;
  const missing = Array.isArray(review.missing) ? review.missing.length : 0;
  const uncertain = Array.isArray(review.uncertain) ? review.uncertain.length : 0;
  // A sorting signal, not a calibrated image-quality percentage.
  return matched * 2 - missing * 3 - uncertain;
}

export function orderedShootFrames(frames, renders, bestFirst) {
  const entries = frames.map((frame, index) => ({ frame, index, render: renders?.[index] }));
  if (!bestFirst) return entries;
  return entries.sort((a, b) => {
    const left = shootReviewRank(a.render?.alignment_review);
    const right = shootReviewRank(b.render?.alignment_review);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    return (right ?? 0) - (left ?? 0) || a.index - b.index;
  });
}
