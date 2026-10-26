import { getRenderRecipe, recipeFamily, recipeSummary, renderRecipeStyle } from "./renderRecipes";

test('downloaded models retain their own sampling recipe across builder entry points', () => {
  const style=renderRecipeStyle('krea2_test','krea2');
  expect(getRenderRecipe(style)).toMatchObject({steps:8,cfg:1,scheduler:'beta',sampler:'euler'});
  expect(getRenderRecipe(renderRecipeStyle('krea2','krea2')).scheduler).toBe('simple');
  expect(getRenderRecipe(renderRecipeStyle('chroma_test','chroma'))).toMatchObject({compiler:'chroma',steps:26});
});

test.each(['draft', 'balanced', 'quality'])('DanrisiMix Turbo retains its own %s recipe', tier => {
  const recipe = getRenderRecipe(renderRecipeStyle('chroma_turbo', 'chroma'), tier);
  expect(recipe).toMatchObject({compiler:'chroma_turbo',family:'image',steps:12,cfg:1,sampler:'heun'});
  expect(recipe.scheduler).toBeUndefined();
  expect(recipe.note).toMatch(/DanrisiMix/);
  expect(getRenderRecipe('chroma').steps).toBe(26);
});

test.each(['draft', 'balanced', 'quality'])('Clyb Flash retains its own %s recipe', tier => {
  const recipe = getRenderRecipe(renderRecipeStyle('chroma_flash', 'chroma'), tier);
  expect(recipe).toMatchObject({compiler:'chroma_flash',family:'image',steps:8,cfg:1,sampler:'heun'});
  expect(recipe.scheduler).toBeUndefined();
  expect(recipe.note).toContain('Clyb');
  expect(renderRecipeStyle('chroma_flash', 'chroma')).not.toBe(renderRecipeStyle('chroma_turbo', 'chroma'));
  expect(getRenderRecipe(renderRecipeStyle('chroma_test', 'chroma')).steps).toBe(26);
});

describe("model-aware render recipes", () => {
  test("uses the Juggernaut XL portrait baseline and scales by tier", () => {
    const draft = getRenderRecipe("sdxl", "draft");
    const balanced = getRenderRecipe("sdxl", "balanced");
    const quality = getRenderRecipe("sdxl", "quality");
    expect([balanced.width, balanced.height, balanced.steps, balanced.cfg, balanced.sampler]).toEqual([832, 1216, 35, 5, "dpmpp_2m"]);
    expect(draft.width * draft.height).toBeLessThan(balanced.width * balanced.height);
    expect(quality.width * quality.height).toBeGreaterThan(balanced.width * balanced.height);
  });

  test("carries the matching scheduler only for recipes that use a named scheduler", () => {
    expect(getRenderRecipe("sdxl").scheduler).toBe("karras");
    expect(getRenderRecipe("sdxl_dmd2").scheduler).toBe("normal");
    expect(getRenderRecipe("zimage").scheduler).toBe("simple");
    expect(getRenderRecipe("krea2").scheduler).toBe("simple");
    // Chroma's BetaSamplingScheduler has no scheduler dropdown input.
    expect(getRenderRecipe("chroma").scheduler).toBeUndefined();
  });

  test("uses a separate low-step DMD2 sampler recipe", () => {
    const recipe = getRenderRecipe("sdxl_dmd2", "balanced");
    expect([recipe.steps, recipe.cfg, recipe.sampler]).toEqual([4, 1.2, "lcm"]);
  });
  test("uses conservative Z-Image Turbo settings", () => {
    const draft = getRenderRecipe("zimage", "draft");
    const quality = getRenderRecipe("zimage", "quality");
    expect(draft.steps).toBeLessThan(quality.steps);
    expect(draft.cfg).toBe(1);
    expect(quality.width * quality.height).toBeGreaterThan(draft.width * draft.height);
  });

  test("keeps model families separate", () => {
    expect(recipeFamily("chroma")).toBe("image");
    expect(recipeFamily("krea2")).toBe("image");
    expect(recipeFamily("qwen_edit")).toBe("edit");
    expect(recipeFamily("wan_i2v")).toBe("video");
    expect(recipeFamily("wan_t2v")).toBe("video");
  });

  test("increases WAN duration and size by tier", () => {
    const draft = getRenderRecipe("wan_i2v", "draft");
    const balanced = getRenderRecipe("wan_i2v", "balanced");
    const quality = getRenderRecipe("wan_i2v", "quality");
    expect([draft.videoFrames, balanced.videoFrames, quality.videoFrames]).toEqual([41, 81, 121]);
    expect(quality.videoWidth).toBeGreaterThan(draft.videoWidth);
  });

  test("uses repair strength instead of sampler settings for Qwen repair", () => {
    const recipe = getRenderRecipe("qwen_edit", "balanced");
    expect(recipe.repairStrength).toBe(0.45);
    expect(recipe.steps).toBeUndefined();
    expect(recipeSummary(recipe)).toContain("45%");
  });

  test("keeps Krea 2 Turbo on its 8-step distilled recipe", () => {
    const draft = getRenderRecipe("krea2", "draft");
    const balanced = getRenderRecipe("krea2", "balanced");
    const quality = getRenderRecipe("krea2", "quality");
    expect([draft.steps, balanced.steps, quality.steps]).toEqual([8, 8, 8]);
    expect(balanced.cfg).toBe(1);
    expect(balanced.sampler).toBe("euler");
    expect(quality.height).toBeGreaterThan(balanced.height);
  });

  test("falls back to standard image settings", () => {
    const flux2 = getRenderRecipe("flux2_klein", "balanced");
    expect([flux2.width, flux2.height, flux2.steps, flux2.cfg, flux2.sampler]).toEqual([1024, 1024, 4, 1, "euler"]);
    const recipe = getRenderRecipe("unknown-model", "balanced");
    expect(recipe.family).toBe("image");
    expect(recipe.width).toBeGreaterThan(0);
    expect(recipe.steps).toBeGreaterThan(0);
  });
});


test("downloaded AIO and LTX recipes use their own sampling and frame families", () => {
  const krea = getRenderRecipe("krea2_aio");
  expect([krea.steps, krea.cfg, krea.sampler, krea.scheduler]).toEqual([12, 1, "euler_ancestral", "beta"]);
  expect(recipeFamily("ltx_t2v")).toBe("video");
  const video = getRenderRecipe("ltx_t2v");
  expect([video.videoFrames, video.videoFps, video.videoWidth, video.videoHeight]).toEqual([73, 24, 832, 480]);
});

test.each(['draft','balanced','quality'])('Kroma keeps its own %s Turbo recipe', tier => {
  const recipe = getRenderRecipe(renderRecipeStyle('kroma','krea2'), tier);
  expect(recipe).toMatchObject({compiler:'kroma',family:'image',cfg:1,sampler:'euler',scheduler:'simple'});
  expect(recipe.steps).toBe(tier === 'quality' ? 12 : 8);
  expect(getRenderRecipe('krea2_test').scheduler).toBe('beta');
});

test('new local model workflows retain their generation families and recipes', () => {
  expect(getRenderRecipe(renderRecipeStyle('flux1_dev','flux1_dev'))).toMatchObject({family:'image',steps:28,cfg:1,sampler:'euler',scheduler:'simple'});
  expect(getRenderRecipe(renderRecipeStyle('wan5b_t2v','wan_t2v'))).toMatchObject({family:'video',videoFrames:81,videoWidth:640,videoHeight:384});
});

describe('MOSS checkpoint sampling', () => {
  const cases = [
    ['moss_stardust_bf16',25,3,'er_sde'],
    ['moss_jib_realistic_bf16',8,1,'euler'],
    ['moss_finalcut_universal',6,2.5,'euler'],
  ];
  test.each(cases)('%s retains its own sampling at every canvas tier', (file,steps,cfg,sampler) => {
    const graph = require(`../../../backend/seed_workflows/${file}.json`);
    const workflow = {prompt_style:'moss_image',json_str:JSON.stringify(graph)};
    const style=renderRecipeStyle(workflow.prompt_style,'standard');
    expect(style).toBe('moss_image');
    const recipes=['draft','balanced','quality'].map(tier=>getRenderRecipe(style,tier,workflow));
    for(const recipe of recipes) {
      expect(recipe).toMatchObject({steps,cfg,sampler,scheduler:'simple',family:'image'});
      expect(recipe.width % 16).toBe(0);expect(recipe.height % 16).toBe(0);
    }
    expect(recipes[0].width).toBeLessThan(recipes[1].width);
    expect(recipes[2].width).toBeGreaterThan(recipes[1].width);
    expect(recipes[1].width).toBe(graph['6'].inputs.width);
  });
  test('invalid or absent MOSS graphs never fall back to generic sampling',()=>{
    for (const workflow of [null,{prompt_style:'moss_image',json_str:'broken'}]) {
      const recipe=getRenderRecipe('moss_image','balanced',workflow);
      expect(recipe.unavailable).toBe(true);
      expect(recipe.steps).toBeUndefined();expect(recipe.cfg).toBeUndefined();
    }
  });
});
