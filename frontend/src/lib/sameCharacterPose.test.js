import { buildSameCharacterPoseInstruction, DEFAULT_POSE_LOCKS } from "./sameCharacterPose";

describe("same character pose instruction", () => {
  it("requires a pose or custom motion note", () => {
    expect(buildSameCharacterPoseInstruction()).toBe("");
  });

  it("preserves appearance while replacing the old pose", () => {
    const prompt = buildSameCharacterPoseInstruction({ poseId: "walking" });
    expect(prompt).toContain("walking naturally in mid-step");
    expect(prompt).toContain("same face, identity, age");
    expect(prompt).toContain("exact same clothing");
    expect(prompt).toContain("Do not retain or overlay the old limb positions");
    expect(prompt).toContain("exactly two arms");
  });

  it("omits unlocked properties and accepts custom notes", () => {
    const prompt = buildSameCharacterPoseInstruction({
      notes: "leaning forward with the left hand on a chair",
      locks: { ...DEFAULT_POSE_LOCKS, clothing: false, background: false },
    });
    expect(prompt).toContain("left hand on a chair");
    expect(prompt).not.toContain("exact same clothing");
    expect(prompt).toContain("scene may be reframed naturally");
  });
});
