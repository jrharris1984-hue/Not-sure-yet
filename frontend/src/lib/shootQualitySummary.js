export function summarizeShootQuality(renders = []) {
  const completed = renders.map((render, index) => ({ render, index }))
    .filter(({ render }) => (render?.output_files?.length || render?.output_variants?.enhanced?.length));
  const reviewed = completed.filter(({ render }) => render?.alignment_review);
  const unreviewed = completed.filter(({ render }) => !render?.alignment_review).map(({ index }) => index);
  const missingFrames = new Set();
  const misses = new Map();
  let uncertainCount = 0;
  for (const { render, index } of reviewed) {
    const report = render.alignment_review;
    if (Array.isArray(report.uncertain)) uncertainCount += report.uncertain.length;
    (report.missing || []).forEach((item) => {
      const detail = typeof item === 'string' ? item : item?.detail;
      if (!detail) return;
      const category = typeof item === 'object' ? item.category || 'other' : 'other';
      const key = `${category}:${detail.trim().toLocaleLowerCase()}`;
      const entry = misses.get(key) || { category, detail: String(detail).slice(0, 180), frames: [] };
      entry.frames.push(index);
      misses.set(key, entry);
      missingFrames.add(index);
    });
  }
  return {
    completed: completed.length,
    reviewed: reviewed.length,
    unreviewed,
    missingFrames: [...missingFrames].sort((a, b) => a - b),
    missingCount: [...misses.values()].reduce((total, item) => total + item.frames.length, 0),
    uncertainCount,
    repeatedMisses: [...misses.values()].filter((item) => item.frames.length > 1)
      .sort((a, b) => b.frames.length - a.frames.length).slice(0, 8),
    misses: [...misses.values()].sort((a, b) => b.frames.length - a.frames.length).slice(0, 12),
  };
}
