import { mediaPeopleMetadata, mediaLibraryTraits } from "./mediaLibraryMetadata";
import { buildMediaSubjects } from "./mediaLibraryImport";
import { expectedSubjectCount } from "./dna";

test("reads structured counts, JSON analysis and per-person records", () => {
  const result = mediaPeopleMetadata({ analysis_json: JSON.stringify({ person_count: "2", people: [{ hair_color: "black" }, { hair_color: "blonde" }] }) });
  expect(result.personCount).toBe(2);
  expect(result.people.map(person => person.hairColor)).toEqual(["black", "blonde"]);
  expect(mediaPeopleMetadata({ people: [{}, {}, {}] }).personCount).toBe(3);
});

test("unknown, zero and malformed counts stay distinct", () => {
  expect(mediaPeopleMetadata({ search_description: "two people in a photo" }).personCount).toBeNull();
  expect(mediaPeopleMetadata({ person_count: 0 }).personCount).toBe(0);
  expect(mediaPeopleMetadata({ person_count: -2 }).personCount).toBeNull();
  expect(mediaPeopleMetadata({ person_count: 2.5 }).personCount).toBeNull();
  expect(mediaPeopleMetadata({ person_count: true }).personCount).toBeNull();
  expect(mediaPeopleMetadata({ analysis_json: "broken" }).personCount).toBeNull();
});

test("manual count wins and imports at most four subjects", () => {
  expect(mediaLibraryTraits({ person_count: 2 }, 3).personCount).toBe(3);
  expect(mediaLibraryTraits({ person_count: 8 }).personCount).toBe(4);
  expect(mediaLibraryTraits({}).personCount).toBe(1);
});

test("separate people retain separate traits and share scene framing", () => {
  const imported = buildMediaSubjects(mediaLibraryTraits({ person_count: 2, environment: "studio", framing: "full body", people: [{ gender: "male", hair_color: "black" }, { gender: "female", hair_color: "blonde" }] }));
  expect(imported.subjects).toHaveLength(2);
  expect(imported.subjects.map(person => person.label)).toEqual(["A", "B"]);
  expect(imported.subjects.map(person => person.dna.identity.gender)).toEqual(["male", "female"]);
  expect(imported.subjects[0].dna.hair.color).toBe("jet black");
  expect(imported.subjects[1].dna.hair.color).toBe("golden blonde");
  expect(imported.subjects.every(person => person.dna.scene.environment === "studio")).toBe(true);
  expect(imported.subjects.every(person => person.dna.pose.distance === "full body")).toBe(true);
  expect(expectedSubjectCount(imported.subjects[0].dna)).toBe(2);
  expect(imported.subjects[0].id).not.toBe(imported.subjects[1].id);
  imported.subjects[0].dna.scene.environment = "beach";
  expect(imported.subjects[1].dna.scene.environment).toBe("studio");
});

test("flat appearance metadata is never copied across multiple people", () => {
  const item = { person_count: 2, hair_color: "blonde", environment: "studio" };
  const imported = buildMediaSubjects(mediaLibraryTraits(item));
  expect(imported.subjects.every(person => person.dna.hair.color !== "golden blonde")).toBe(true);
  const solo = buildMediaSubjects(mediaLibraryTraits(item, 1));
  expect(solo.subjects[0].dna.hair.color).toBe("golden blonde");
});

test("three and four person casts survive the Builder cast-size synchronizer", () => {
  for (const personCount of [3, 4]) {
    const imported = buildMediaSubjects({ personCount });
    expect(imported.subjects).toHaveLength(personCount);
    expect(expectedSubjectCount(imported.subjects[0].dna)).toBe(personCount);
  }
});
