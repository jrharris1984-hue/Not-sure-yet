import { preservationStrengthInstruction, referenceStudioSummary, REFERENCE_RECIPES } from "./referenceStudio";

describe("Reference Studio", () => {
  it("builds graduated preservation language", () => {
    const prompt = preservationStrengthInstruction({ face: 100, body: 85, clothing: 70, background: 40, lighting: 20 });
    expect(prompt).toContain("preserve exactly the source face");
    expect(prompt).toContain("strongly preserve the source body");
    expect(prompt).toContain("allow natural adaptation of the source lighting");
  });

  it("requires a source and a pose", () => {
    expect(referenceStudioSummary().ready).toBe(false);
    expect(referenceStudioSummary({ sourceReady: true, poseId: "walking" }).ready).toBe(true);
  });

  it("warns when strict preservation can fight a pose change", () => {
    const strict = REFERENCE_RECIPES.find((recipe) => recipe.id === "strict");
    const result = referenceStudioSummary({ sourceReady: true, poseId: "reclining", strengths: strict.strengths });
    expect(result.warnings).toHaveLength(2);
  });
});
