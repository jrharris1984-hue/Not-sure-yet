import { skinAfterAgeChange } from './ageAppearance';
import { catalogSelection } from './promptCatalog';
export const CAST_AGE_OPTIONS = ["individual ages", "same age", "age contrast"];
export const CAST_RESEMBLANCE_OPTIONS = ["from cast pairing", "individual faces", "similar facial features", "matching faces"];
const FACE_STRUCTURE = ["eye_shape", "eye_color", "jawline", "nose", "lips"];
const clone = value => JSON.parse(JSON.stringify(value));
const age = value => Math.min(80, Math.max(18, Math.round(Number(value) || 30)));

// Shared cast choices apply to existing subjects as well as newly added people.
// Field locks retain the user's explicitly protected traits.
export function applyCastAppearance(subjects = [], scenario = {}, sectionLocks = {}) {
  if (subjects.length < 2) return subjects;
  const primary = subjects[0]?.dna || {};
  const primaryAge = age(primary.identity?.age);
  const gap = Math.min(50, Math.max(1, Math.round(Number(scenario.cast_age_gap) || 20)));
  const contrastAge = primaryAge + gap <= 80 ? primaryAge + gap : Math.max(18, primaryAge - gap);
  return subjects.map((subject, index) => {
    if (!index) return subject;
    let dna = clone(subject.dna || {});
    const locked = (section, key) => sectionLocks[section] || subject.field_locks?.[section]?.[key];
    if (["same age", "age contrast"].includes(scenario.cast_age_mode) && !locked("identity", "age")) {
      dna.identity = { ...dna.identity, age: scenario.cast_age_mode === "same age" ? primaryAge : contrastAge };
      if (!locked('skin','texture')) dna = skinAfterAgeChange(dna, subject.dna?.identity?.age);
    }
    if (["similar facial features", "matching faces"].includes(scenario.cast_resemblance)) {
      dna.face = { ...dna.face };
      const keys = scenario.cast_resemblance === "matching faces" ? FACE_STRUCTURE : ["eye_shape", "jawline", "nose"];
      for (const key of keys) if (!locked("face", key) && primary.face?.[key]) dna.face[key] = primary.face[key];
    }
    return { ...subject, dna };
  });
}

export function castAppearancePrompt(subjects = []) {
  if (subjects.length < 2) return "";
  const primary = subjects[0]?.dna || {};
  const cast = subjects.map((subject, index) => {
    const identity = subject.dna?.identity || {};
    const label = subject.label || String.fromCharCode(65 + index);
    return `Subject ${label}: ${age(identity.age)}-year-old adult ${catalogSelection(subject.dna, 'identity', 'gender') === "male" ? "man" : "woman"}`;
  }).join("; ");
  const resemblance = {
    "individual faces": "Each person has a distinct face; preserve each person's selected facial features",
    "similar facial features": "Shared eye shape, nose structure and jawline create visible resemblance, while each person remains individually recognizable",
    "matching faces": "Matching eye shape, eye color, nose, jawline and lip shape; separate individuals with their own expressions and selected ages",
  }[catalogSelection(primary, 'scenario', 'cast_resemblance')] || "";
  return [`Exactly ${subjects.length} separate adult people`, cast, resemblance].filter(Boolean).join("; ") + ".";
}

// A direct per-person edit is authoritative. Clear a conflicting shared preset
// so compilation cannot silently put the old age or face back.
export function editCastSubjectDna(subjects, subjectId, dna) {
  const previous = subjects.find(subject => subject.id === subjectId)?.dna || {};
  const ageChanged = previous.identity?.age !== dna.identity?.age;
  const subject = subjects.find(item => item.id === subjectId);
  if (!subject?.field_locks?.skin?.texture) dna = skinAfterAgeChange(dna, previous.identity?.age);
  const faceChanged = FACE_STRUCTURE.some(key => previous.face?.[key] !== dna.face?.[key]);
  return subjects.map((subject, index) => {
    const nextDna = subject.id === subjectId ? dna : subject.dna;
    if (index !== 0) return { ...subject, dna: nextDna };
    const scenario = { ...nextDna.scenario };
    if (ageChanged) scenario.cast_age_mode = "individual ages";
    if (faceChanged && ["similar facial features", "matching faces"].includes(scenario.cast_resemblance)) scenario.cast_resemblance = "individual faces";
    return { ...subject, dna: { ...nextDna, scenario } };
  });
}
