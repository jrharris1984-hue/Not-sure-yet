import { builderDraftKey, clearBuilderDraft, readBuilderDraft, writeBuilderDraft } from "./builderDraft";

describe("builder drafts", () => {
  afterEach(() => window.localStorage.clear());

  it("saves and restores a versioned character editing session", () => {
    writeBuilderDraft("character-1", { name: "Still editing", workflowId: "zimage", subjects: [{ id: "a" }] });
    expect(readBuilderDraft("character-1")).toMatchObject({
      version: 1,
      name: "Still editing",
      workflowId: "zimage",
    });
    expect(window.localStorage.getItem(builderDraftKey("character-1"))).toContain("Still editing");
  });

  it("clears only the requested draft", () => {
    writeBuilderDraft(null, { name: "new" });
    clearBuilderDraft(null);
    expect(readBuilderDraft(null)).toBeNull();
  });
});
