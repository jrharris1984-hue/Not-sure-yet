import { resolveWardrobeLayers } from './wardrobeLayers';

export const CONCEALED_ANATOMY_FIELDS = [
  'pubic_hair', 'pussy', 'clit', 'asshole', 'nipples', 'areolas',
  'nipple_size', 'nipple_shape', 'areola_size', 'areola_shape', 'areola_color', 'areola_detail',
];

// Compatibility exports share the same layer plan as garment guidance.
export function hasCoveringOuterOutfit(dna = {}) {
  return resolveWardrobeLayers(dna).fullOuterCoverage;
}
export function concealedAnatomyFields(dna = {}) {
  const { covered } = resolveWardrobeLayers(dna);
  return CONCEALED_ANATOMY_FIELDS.filter(field =>
    (covered.upper && /^(?:nipple|areola)/.test(field))
    || (covered.lower && ['pubic_hair', 'pussy', 'clit', 'asshole'].includes(field)));
}
