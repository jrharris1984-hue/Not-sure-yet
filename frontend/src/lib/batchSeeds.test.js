import { batchSeed } from "./batchSeeds";

test("batch variety retains the first seed and explores distinct later seeds", () => {
  expect(batchSeed(1234, 0)).toBe(1234);
  expect(batchSeed(1234, 1, "nearby")).toBe(1235);
  expect(batchSeed(1234, 1, "explore")).toBe(105963);
  expect(new Set(Array.from({ length: 10 }, (_, index) => batchSeed(1234, index))).size).toBe(10);
});
