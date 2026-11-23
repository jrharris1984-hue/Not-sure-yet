// MOSS-specific prompt priorities. Descriptions are visual cues, not promises
// that an image model interprets numeric sliders literally.
const selected = (scale, preset, threshold, values) =>
  Number(scale) > 0 ? Number(scale) >= threshold : values.includes(String(preset || '').toLowerCase());

// Keep volume, contour, and projection as separate conceptual axes.
// Projection is inferred from an explicit shape choice only; it is never
// treated as a new user setting or an exact anatomical measurement.
export function mossBodyGeometry(dna = {}) {
  const ph = dna.physique || {};
  const regions = [
    ['bust', 'bust_scale', 'bust_shape'],
    ['butt', 'butt_scale', 'glute_shape'],
    ['hips', 'hip_scale', null],
    ['thighs', 'thigh_scale', null],
    ['waist', 'waist_scale', null],
  ];
  return regions.reduce((result, [region, slider, shape]) => {
    const amount = Number(ph[slider]);
    const sliderActive = Number.isFinite(amount) && amount > 0;
    const contour = shape ? String(ph[shape] || '').trim() : '';
    result[region] = {
      sizeSource: sliderActive ? 'slider' : (ph[region] ? 'preset' : 'unspecified'),
      size: sliderActive ? amount : (ph[region] || ''),
      contour,
      projection: region === 'butt' && /rear projection|rearward|posterior|upper shelf/i.test(contour)
        ? 'rearward'
        : region === 'butt' && /side projection|lateral/i.test(contour) ? 'lateral' : 'unspecified',
    };
    return result;
  }, {});
}

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
  return { warnings, priority: mossVisualPriority(dna), geometry: mossBodyGeometry(dna) };
}

// Report only high-confidence contradictions in a single-subject positive
// prompt. Never remove a phrase: user-authored wording may be intentional.
const MOSS_OPPOSITES = {
  hips: {
    narrow: /\\b(?:narrow|slim|very narrow) (?:hips?|pelvic silhouette)\\b/i,
    wide: /\\b(?:wide|broad|extremely wide|dramatically broad) (?:hips?|hip silhouette|lateral hip silhouette)\\b/i,
  },
  thighs: {
    narrow: /\\b(?:slim|slender|narrow|very slender) (?:upper )?thighs?\\b/i,
    wide: /\\b(?:thick|massive|extremely thick|extremely broad) (?:upper )?thighs?\\b/i,
  },
};
export function detectMossPromptConflicts(positive = '', dna = {}) {
  const ph = dna.physique || {};
  const warnings = [];
  for (const [region, patterns] of Object.entries(MOSS_OPPOSITES)) {
    const slider = Number(ph[region === 'hips' ? 'hip_scale' : 'thigh_scale']);
    const preset = String(ph[region] || '').toLowerCase();
    const desired = slider > 0
      ? (slider <= 20 ? 'narrow' : slider >= 80 ? 'wide' : '')
      : (region === 'hips'
        ? ({ narrow: 'narrow', wide: 'wide', 'very wide': 'wide', extreme: 'wide' })[preset]
        : ({ slim: 'narrow', thick: 'wide', 'very thick': 'wide', massive: 'wide' })[preset]);
    if (!desired) continue;
    const opposing = desired === 'wide' ? 'narrow' : 'wide';
    if (patterns[opposing].test(positive)) {
      warnings.push({
        region, selected: desired, conflictingDescription: opposing,
        message: `Selected ${region} are ${desired}, but the prompt also describes ${opposing} ${region}`,
      });
    }
  }
  return warnings;
}

// Remove only identical repeated semicolon clauses; preserve wording and order.
export function dedupeMossClauses(value = '') {
  const seen = new Set(), removed = [];
  const retained = String(value || '').split(';').filter(clause => {
    const normalized = clause.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!normalized) return false;
    if (seen.has(normalized)) { removed.push(clause.trim()); return false; }
    seen.add(normalized);
    return true;
  });
  return { positive: retained.map(clause => clause.trim()).join('; '), removed };
}

export function composeMossPrompt(basePositive, subjects = []) {
  const priorities = subjects.map((subject, index) => {
    const priority = mossVisualPriority(subject.dna || {});
    return priority && subjects.length > 1
      ? `Subject ${subject.label || String.fromCharCode(65 + index)}: ${priority}`
      : priority;
  }).filter(Boolean);
  const combined = [priorities.join(' '), String(basePositive || '').trim()].filter(Boolean).join(' ');
  const deduped = dedupeMossClauses(combined);
  const positive = deduped.positive;
  return { positive, promptWords: positive.split(/\s+/).filter(Boolean).length,
    mossRemovedDuplicates: deduped.removed,
    mossPromptConflicts: subjects.length === 1
      ? detectMossPromptConflicts(basePositive, subjects[0].dna || {}) : [],
    mossDiagnostics: subjects.map(subject => inspectMossPhysique(subject.dna || {})) };
}
