import { builderDraftKey, clearBuilderDraft, readBuilderDraft, writeBuilderDraft, resetWorkspaceDrafts, startWorkspaceSession } from "./builderDraft";

describe("builder drafts", () => {
  afterEach(() => {window.localStorage.clear();resetWorkspaceDrafts();});

  it("saves and restores a versioned character editing session", () => {
    writeBuilderDraft("character-1", { name: "Still editing", workflowId: "zimage", subjects: [{ id: "a" }] });
    expect(readBuilderDraft("character-1")).toMatchObject({
      version: 1,
      name: "Still editing",
      workflowId: "zimage",
    });
    expect(window.localStorage.getItem(builderDraftKey("character-1"))).toBeNull();
  });

  it("clears only the requested draft", () => {
    writeBuilderDraft(null, { name: "new" });
    clearBuilderDraft(null);
    expect(readBuilderDraft(null)).toBeNull();
  });
});

it('a new app load starts at the roster with no unfinished draft', () => {
  writeBuilderDraft(null,{name:'Unsaved character'});
  window.localStorage.setItem(builderDraftKey(null),JSON.stringify({version:1,name:'Old draft'}));
  const browser={history:{replaceState:jest.fn()}};
  startWorkspaceSession(browser);
  expect(browser.history.replaceState).toHaveBeenCalledWith(null,'','/');
  expect(readBuilderDraft(null)).toBeNull();
});
