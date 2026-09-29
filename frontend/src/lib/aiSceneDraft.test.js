import { expectedSubjectCount } from "./dna";
import { normalizeAiSceneSubjects } from "./aiSceneDraft";

test("AI scene drafts create distinct adult subjects with matching cast size", () => {
  for (const count of [2, 3, 4]) {
    const subjects = normalizeAiSceneSubjects(Array.from({ length: count }, (_, index) => ({
      dna: { identity: { age: index === 0 ? 18 : 30 + index }, hair: { color: `color ${index}` } },
    })));
    expect(subjects).toHaveLength(count);
    expect(new Set(subjects.map((subject) => subject.id)).size).toBe(count);
    expect(expectedSubjectCount(subjects[0].dna)).toBe(count);
    expect(subjects[0].dna.identity.age).toBe(21);
    expect(subjects[1].dna.hair.color).toBe("color 1");
  }
});
