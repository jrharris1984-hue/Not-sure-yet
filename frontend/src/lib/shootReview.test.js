import { orderedShootFrames, shootReviewRank } from "./shootReview";

test("ranks reviewed frames by match evidence and leaves unreviewed frames in order", () => {
  const frames = [{}, {}, {}, {}];
  const renders = [
    { alignment_review: { matched: ["pose"], missing: ["shoes"], uncertain: [] } },
    {},
    { alignment_review: { matched: ["pose", "shoes"], missing: [], uncertain: ["hair"] } },
    {},
  ];
  expect(shootReviewRank(renders[2].alignment_review)).toBeGreaterThan(shootReviewRank(renders[0].alignment_review));
  expect(orderedShootFrames(frames, renders, true).map((entry) => entry.index)).toEqual([2, 0, 1, 3]);
  expect(orderedShootFrames(frames, renders, false).map((entry) => entry.index)).toEqual([0, 1, 2, 3]);
});
