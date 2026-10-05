import { resolveReferenceNotes, translatePlainLanguage } from "./plainLanguagePrompt";
import { compileModelPrompts } from "./modelPromptCompilers";
import { DEFAULT_DNA } from "./dna";

test("back-view controls replace stale imported front-facing instructions in the submitted prompt", () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.pose = { ...dna.pose, angle: "back", distance: "waist-up", action: "squatting" };
  dna.camera.angle = "eye-level";
  const notes = "Body orientation: front-facing\nCamera angle: eye level\nPose: standing\nBackground: pink wall\nKeep the floral painting";
  const resolved = resolveReferenceNotes(notes, dna);
  const compiled = compileModelPrompts({ promptStyle: "chroma", dna });
  const submitted = [compiled.positive, translatePlainLanguage(resolved, "chroma").text].join(", ");
  expect(submitted).toContain("camera behind the subject");
  expect(submitted).toContain("subject facing away from the camera");
  expect(submitted).not.toMatch(/front-facing|Pose: standing|Camera angle: eye level/);
  expect(submitted).toContain("pink wall");
  expect(submitted).toContain("Keep the floral painting");
  expect(notes).toContain("front-facing");
});

test("reference note ownership keeps elevation separate and resolves each subject independently", () => {
  expect(resolveReferenceNotes("Body orientation: front\nCamera angle: eye level", { pose: { angle: "back" } })).toBe("Camera angle: eye level");
  const input = "Subject A — Body orientation: front\nSubject B — Body orientation: front\nTurn toward the window";
  const result = resolveReferenceNotes(input, {}, [{ label: "A", dna: { pose: { angle: "back" } } }, { label: "B", dna: {} }]);
  expect(result).not.toContain("Subject A");
  expect(result).toContain("Subject B — Body orientation: front");
  expect(result).toContain("Turn toward the window");
});

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
