import { batchPoseVariation } from "./batchPoseVariation";

const subject = (action = "standing") => ({
  id: "a",
  label: "A",
  dna: { pose: { action, distance: "full body" } },
});

const sections = [{
  key: "pose",
  fields: [{
    key: "action",
    options: ["standing", "seated", "walking", "kneeling"],
  }],
}];

test("single-person pose variety changes pose and stays deterministic", () => {
  const first = batchPoseVariation({ subjects: [subject()], sections, index: 0, seed: 10 });
  const second = batchPoseVariation({ subjects: [subject()], sections, index: 1, seed: 10 });

  expect(first.pose.value).not.toBe("standing");
  expect(second.pose.value).not.toBe(first.pose.value);
  expect(first.subjects[0].dna.pose.action).toBe(first.pose.value);
  expect(first.subjects[0].dna.pose.distance).toBe("full body");
});

test("multi-person pose variety uses shared pose prompts and wide framing", () => {
  const promptCatalog = {
    sections: [{
      key: "shared_poses",
      title: "Shared Poses",
      fields: [{
        key: "two_people",
        label: "2 people",
        type: "pose_chips",
        options: [
          { value: "side by side", label: "Side by side", keywords: "standing together side by side", group: "Portrait" },
          { value: "walking together", label: "Walking together", keywords: "walking together in sync", group: "Movement" },
        ],
      }],
    }],
  };
  const subjects = [subject("standing together side by side"), { ...subject("standing together side by side"), id: "b", label: "B" }];
  const result = batchPoseVariation({ subjects, sections, promptCatalog, index: 0, seed: 0 });

  expect(result.pose.prompt).toBe("walking together in sync");
  expect(result.subjects.every(item => item.dna.pose.action === "walking together in sync")).toBe(true);
  expect(result.subjects.every(item => item.dna.pose.distance === "wide shot")).toBe(true);
});
