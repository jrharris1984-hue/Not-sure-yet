import { translatePlainLanguage } from "./plainLanguagePrompt";

test("translates shorthand and volumes into visual attributes", () => {
  const result = translatePlainLanguage("adult woman, implants 3,000 cc, BBL, fitted dress", "krea2");
  expect(result.attributes).toHaveLength(2);
  expect(result.text).toContain("fantasy-scale augmented bust");
  expect(result.text).toContain("rounded buttocks");
  expect(result.text).toContain("fitted dress");
  expect(result.text).not.toMatch(/3000|3,000|\bBBL\b/i);
});

test("editing gives a scoped instruction, while image-to-video does not redesign proportions", () => {
  const edit = translatePlainLanguage("BBL", "qwen_edit");
  expect(edit.text).toContain("Change only the requested features");
  expect(edit.text).toContain("Preserve the subject's identity");
  const video = translatePlainLanguage("BBL", "wan_i2v");
  expect(video.text).toBe("");
  expect(video.attributes).toHaveLength(1);
});
