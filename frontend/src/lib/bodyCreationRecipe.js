// Restore generation parameters, never image pixels, for the body sliders.
export async function loadBodyCreationRecipe(render, endpoints) {
  let current = render;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const result = await endpoints.getRenderRecipe(current.id);
    const recipe = result.recipe || {};
    const parentId = current.parent_render_id || recipe.parent_render_id;
    if (parentId && recipe.operation && recipe.operation !== "render") {
      current = await endpoints.getRender(parentId);
      continue;
    }
    if (Object.keys(recipe.dna || {}).length || recipe.subjects?.length) return result;
    if (!parentId) break;
    current = await endpoints.getRender(parentId);
  }
  throw new Error("This image has no saved creation setup. Open Create and set the body sliders there.");
}
