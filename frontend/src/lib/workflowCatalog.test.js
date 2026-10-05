import { workflowCatalog, selectableCatalogWorkflows, builderCatalogWorkflows } from "./workflowCatalog";

const workflow = (id, overrides = {}) => ({
  id, name: id, kind: "image", prompt_style: "sdxl", positive_node_id: "2", negative_node_id: "3",
  json_str: JSON.stringify({ "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "model-a.safetensors" } } }),
  ...overrides,
});

test("exact graph copies leave one selectable entry and preserve the chosen default", () => {
  const first = workflow("first"), second = workflow("default");
  const catalog = workflowCatalog([first, second], "default");
  expect(catalog.primary.map((w) => w.id)).toEqual(["default"]);
  expect(catalog.redundant[0].catalogReason).toBe("Exact copy of default");
  expect(first.id).toBe("first");
});

test("different checkpoints, prompt bindings, and edit actions are not duplicates", () => {
  const catalog = workflowCatalog([workflow("one"), workflow("checkpoint", { json_str: workflow("one").json_str.replace("model-a", "model-b") }),
    workflow("binding", { positive_node_id: "4" }), workflow("edit", { kind: "edit" }), workflow("repair", { kind: "enhance" })]);
  expect(catalog.primary).toHaveLength(5);
  expect(catalog.redundant).toEqual([]);
});

test("metadata and JSON key ordering do not create separate executable workflows", () => {
  const other = workflow("copy", { json_str: JSON.stringify({ "1": { _meta: { title: "Renamed node" }, inputs: { ckpt_name: "model-a.safetensors" }, class_type: "CheckpointLoaderSimple" } }) });
  expect(workflowCatalog([workflow("one"), other]).redundant).toHaveLength(1);
});

test("internal stages and legacy Krea presets leave the main list while unique user workflows remain", () => {
  const catalog = workflowCatalog([workflow("base", { prompt_style: "krea2" }),
    workflow("style", { name: "Krea 2 Turbo · Private Magazine", kind: "krea_style", prompt_style: "krea2" }),
    workflow("pose", { kind: "pose" }), workflow("refine", { kind: "refine" }), workflow("custom", { json_str: "not yet configured" })]);
  expect(catalog.primary.map((w) => w.id)).toEqual(["base", "custom"]);
  expect(catalog.internal).toHaveLength(2);
  expect(catalog.redundant).toHaveLength(1);
});

test("a standalone Krea style remains available when its replacement is absent", () => {
  expect(workflowCatalog([workflow("style", { name: "Krea 2 Turbo · Private Magazine", kind: "krea_style", prompt_style: "krea2" })]).primary).toHaveLength(1);
});

test("a saved recipe can still select a duplicate by its original ID", () => {
  const workflows = [workflow("primary"), workflow("copy")];
  expect(selectableCatalogWorkflows(workflows, "", "").map((w) => w.id)).toEqual(["primary"]);
  expect(selectableCatalogWorkflows(workflows, "", "copy").map((w) => w.id)).toEqual(["primary", "copy"]);
  expect(selectableCatalogWorkflows(workflows, "", "copy")[1].name).toContain("saved recipe");
});


test("builder visibility hides the default without deleting it and can leave the list empty", () => {
  const workflows=[workflow("default"),workflow("other",{json_str:"{}"})];
  expect(builderCatalogWorkflows(workflows,"default","default",["default"]).map(w => w.id)).toEqual(["other"]);
  expect(builderCatalogWorkflows(workflows,"default","default",["default","other"])).toEqual([]);
  expect(workflows).toHaveLength(2);
  expect(builderCatalogWorkflows(workflows,"default","").map(w => w.id)).toEqual(["default","other"]);
});

test("an explicitly opened recipe can retain a hidden workflow without revealing other hidden choices", () => {
  const workflows=[workflow("default"),workflow("other",{json_str:"{}"})];
  expect(builderCatalogWorkflows(workflows,"default","default",["default","other"],true).map(w => w.id)).toEqual(["default"]);
  expect(selectableCatalogWorkflows(workflows,"default","")).toHaveLength(2);
});
