import { GLUTE_SIZE_MAX, GLUTE_SHAPES, GLUTE_TEXTURES } from "./gluteControls";

// Saved design notes live on the subject record, outside generation DNA.
export function normalizeCharacterDesign(value = {}) {
  return {
    size: Math.max(0, Math.min(GLUTE_SIZE_MAX, Math.round(Number(value?.size) || 0))),
    shape: GLUTE_SHAPES.includes(value?.shape) ? value.shape : "",
    texture: GLUTE_TEXTURES.includes(value?.texture) ? value.texture : "",
  };
}

export function characterSubjectRecord(subject) {
  return {
    id: subject.id,
    label: subject.label,
    dna: subject.dna,
    field_locks: subject.field_locks,
    likeness: subject.likeness,
    design_profile: normalizeCharacterDesign(subject.design_profile),
  };
}

export function characterDesignRequest(subject, characterId) {
  const identity = subject?.dna?.identity || {};
  return {
    ...normalizeCharacterDesign(subject?.design_profile),
    character_id: characterId || null,
    age: Math.max(18, Math.min(80, Math.round(Number(identity.age) || 30))),
    gender: identity.gender === "female" ? "woman" : identity.gender === "male" ? "man" : "person",
  };
}
