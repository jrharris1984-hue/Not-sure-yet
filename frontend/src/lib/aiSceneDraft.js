import { DEFAULT_DNA, makeSubject, subjectLabel } from "./dna";

export function normalizeAiSceneSubjects(drafts) {
  if (!Array.isArray(drafts) || drafts.length < 1 || drafts.length > 4) return [];
  const castSize = ["solo", "duo", "trio", "group"][drafts.length - 1];
  return drafts.map((draft, index) => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    for (const [section, values] of Object.entries(draft?.dna || {})) {
      if (!dna[section] || !values || typeof values !== "object" || Array.isArray(values)) continue;
      for (const [field, value] of Object.entries(values)) {
        if (field in dna[section] && value !== null && value !== "") dna[section][field] = value;
      }
    }
    dna.identity.age = Math.max(21, Number(dna.identity.age) || 21);
    if (index === 0) dna.scenario.cast_size = castSize;
    return makeSubject({ label: subjectLabel(index), dna });
  });
}
