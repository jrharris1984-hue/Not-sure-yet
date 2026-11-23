// MOSS-specific prompt priorities. Descriptions are visual cues, not promises
// that an image model interprets numeric sliders literally.
const selected = (scale, preset, threshold, values) =>
  Number(scale) > 0 ? Number(scale) >= threshold : values.includes(String(preset || '').toLowerCase());

export function mossVisualPriority(dna = {}) {
  const ph = dna.physique || {};
  const features = [];
  if (selected(ph.hip_scale, ph.hips, 80, ['extreme'])) features.push('dramatically broad lateral hip silhouette');
  if (selected(ph.thigh_scale, ph.thighs, 80, ['massive'])) features.push('exceptionally full upper-thigh volume');
  if (selected(ph.butt_scale, ph.butt, 200, ['hyper'])) features.push('fantasy-scale rearward glute projection');
  if (selected(ph.bust_scale, ph.bust, 80, ['hyper', 'enormous'])) features.push('dramatically enlarged bust silhouette');
  return features.length
    ? `PRIMARY VISUAL REQUIREMENTS: ${features.join('; ')}; preserve the selected contours and connected anatomy in the chosen camera framing.`
    : '';
}

// Return diagnostics separately: never mutate or silently replace a selection.
export function inspectMossPhysique(dna = {}) {
  const ph = dna.physique || {};
  const axes = [
    ['bust', 'bust_scale'], ['butt', 'butt_scale'],
    ['hips', 'hip_scale'], ['thighs', 'thigh_scale'], ['waist', 'waist_scale'],
  ];
  const warnings = axes.filter(([preset, scale]) => Number(ph[scale]) > 0 && Boolean(ph[preset]))
    .map(([preset, scale]) => `${scale} overrides the competing ${preset} preset`);
  if (ph.proportions && axes.some(([, scale]) => Number(ph[scale]) > 0)) {
    warnings.push('Detailed regional controls override general proportions notes');
  }
  return { warnings, priority: mossVisualPriority(dna) };
}

export function composeMossPrompt(basePositive, subjects = []) {
  const priorities = subjects.map((subject, index) => {
    const priority = mossVisualPriority(subject.dna || {});
    return priority && subjects.length > 1
      ? `Subject ${subject.label || String.fromCharCode(65 + index)}: ${priority}`
      : priority;
  }).filter(Boolean);
  const positive = [priorities.join(' '), String(basePositive || '').trim()].filter(Boolean).join(' ');
  return { positive, promptWords: positive.split(/\s+/).filter(Boolean).length,
    mossDiagnostics: subjects.map(subject => inspectMossPhysique(subject.dna || {})) };
}
