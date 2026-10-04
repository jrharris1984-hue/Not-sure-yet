import { characterSubjectRecord, normalizeCharacterDesign } from "./characterDesign";
import { makeSubject, subjectsFromCharacter } from "./dna";

test("old characters load with unspecified design notes", () => {
  expect(subjectsFromCharacter({ dna: {} })[0].design_profile).toEqual({ size: 0, shape: "", texture: "" });
});

test("normalizes out-of-range and unknown selections", () => {
  expect(normalizeCharacterDesign({ size: 900, shape: "unknown", texture: "unknown" })).toEqual({ size: 300, shape: "", texture: "" });
  expect(normalizeCharacterDesign({ size: -10 })).toEqual({ size: 0, shape: "", texture: "" });
  expect(normalizeCharacterDesign(null)).toEqual({ size: 0, shape: "", texture: "" });
});

test("saved subjects retain separate design notes after JSON round trip", () => {
  const subjects = [makeSubject({ label: "A", designProfile: { size: 25, shape: "naturally round", texture: "smooth" } }),
    makeSubject({ label: "B", designProfile: { size: 40, shape: "athletic round", texture: "firm" } })];
  const payload = JSON.parse(JSON.stringify({ subjects: subjects.map(characterSubjectRecord) }));
  const restored = subjectsFromCharacter(payload);
  expect(restored.map(s => s.design_profile)).toEqual(subjects.map(s => s.design_profile));
  expect(restored.map(s => s.id)).toEqual(subjects.map(s => s.id));
  expect(restored.map(s => s.dna)).toEqual(subjects.map(s => s.dna));
  expect(restored[0].dna.design_profile).toBeUndefined();
});
