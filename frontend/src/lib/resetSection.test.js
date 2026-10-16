import { resetSection, DEFAULT_DNA } from "./dna";

test("reset restores defaults while preserving locked fields and their values", () => {
  const current = { color: "red", style: "custom", extra: "keep" };
  const next = resetSection("hair", current, { color: true, extra: true, style: false });
  expect(next.color).toBe("red"); expect(next.extra).toBe("keep");
  expect(next.style).toBe(DEFAULT_DNA.hair.style);
  expect(current.style).toBe("custom");
});

test("reset clones arrays and preserves locked empty and zero values", () => {
  const current = { toes: ["custom"], customZero: 0, customEmpty: "" };
  const next = resetSection("feet", current, { toes: true, customZero: true, customEmpty: true });
  expect(next.toes).toEqual(["custom"]); expect(next.toes).not.toBe(current.toes);
  expect(next.customZero).toBe(0); expect(next.customEmpty).toBe("");
  const defaults = resetSection("feet");
  if (Array.isArray(defaults.toes)) { defaults.toes.push("changed"); expect(DEFAULT_DNA.feet.toes).not.toContain("changed"); }
});

test("unknown sections reset to empty while keeping locked custom choices", () => {
  expect(resetSection("custom_example", { chosen: ["a"], remove: "b" }, { chosen: true })).toEqual({ chosen: ["a"] });
  expect(resetSection("hair", {}, { color: true }).color).toBeUndefined();
});
