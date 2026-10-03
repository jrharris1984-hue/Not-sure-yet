import { loadBodyCreationRecipe } from "./bodyCreationRecipe";

it("loads the original DNA and seed without preparing an image reference", async () => {
  const result = { recipe: { operation: "render", dna: { physique: { butt_scale: 50 } }, seed: 123 } };
  const endpoints = { getRenderRecipe: jest.fn().mockResolvedValue(result), prepareRenderReference: jest.fn() };
  expect(await loadBodyCreationRecipe({ id: "original" }, endpoints)).toBe(result);
  expect(endpoints.prepareRenderReference).not.toHaveBeenCalled();
});

it("follows an edit result back to its original creation recipe", async () => {
  const original = { recipe: { operation: "render", dna: { physique: { butt_scale: 10 } }, seed: 123 } };
  const endpoints = {
    getRenderRecipe: jest.fn().mockResolvedValueOnce({ recipe: { operation: "body_adjust_chroma", dna: { physique: { butt_scale: 50 } } } }).mockResolvedValueOnce(original),
    getRender: jest.fn().mockResolvedValue({ id: "original" }),
  };
  expect(await loadBodyCreationRecipe({ id: "edit", parent_render_id: "original" }, endpoints)).toBe(original);
  expect(endpoints.getRender).toHaveBeenCalledWith("original");
});

it("rejects an empty recipe or a parent cycle instead of opening stale DNA", async () => {
  const endpoints = { getRenderRecipe: jest.fn().mockResolvedValue({ recipe: { dna: {} } }), getRender: jest.fn().mockResolvedValue({ id: "a", parent_render_id: "a" }) };
  await expect(loadBodyCreationRecipe({ id: "empty" }, endpoints)).rejects.toThrow("no saved creation setup");
  await expect(loadBodyCreationRecipe({ id: "a", parent_render_id: "a" }, endpoints)).rejects.toThrow("no saved creation setup");
});
