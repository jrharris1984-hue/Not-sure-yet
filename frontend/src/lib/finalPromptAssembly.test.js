import { assembleFinalPrompts } from "./finalPromptAssembly";
import { compileModelPrompts } from "./modelPromptCompilers";
import { PHOTO_DETAIL, LIMB_DETAIL } from "./photographicGuidance";
import { analyzePromptQuality, promptProfile } from "./promptQuality";
const dna = { identity:{age:35,gender:"female"}, hair:{color:"brown"}, wardrobe:{outfit_preset:"pantsuit",garment_color:"navy"}, pose:{action:"standing",distance:"full body"}, scene:{environment:"studio"}, lighting:{style:"softbox"}, camera:{lens:"85mm"}, scenario:{cast_size:"solo"} };

test.each(["detailed", "compact", "scene"])("%s Pony preserves score lead after all additions and trigger order", (promptFormat) => {
  const compiled = compileModelPrompts({dna,promptStyle:"pony",promptFormat});
  expect(compiled.positive).toMatch(/^score_9, score_8_up,/);
  const assembled = assembleFinalPrompts({positive:`Editorial photograph, ${compiled.positive}, gray background`,negative:compiled.negative,compiler:"pony",photographic:true,loraTriggers:["studio_style", "portrait_style", "STUDIO_STYLE"]});
  expect(assembled.positive).toMatch(/^score_9, score_8_up, studio_style, portrait_style,/);
  expect(assembled.positive).toContain("gray background");
  expect(assembled.positive.match(/score_9/g)).toHaveLength(1);
  expect(assembled.positive.match(/studio_style/g)).toHaveLength(1);
  const repeat = assembleFinalPrompts({...assembled,compiler:"pony",photographic:true,loraTriggers:["studio_style","portrait_style"]});
  expect(repeat.positive).toBe(assembled.positive); expect(repeat.negative).toBe(assembled.negative);
});

test("final length includes additions without dropping selected details", () => {
  const selected = "navy pantsuit, full body, brown hair, softbox studio";
  const assembled = assembleFinalPrompts({positive:`${selected}, ${"optional wording ".repeat(100)}`,compiler:"sdxl",budgetWords:20,loraTriggers:["studio_style"]});
  expect(assembled.positive).toContain(selected);
  expect(assembled.assembly.words).toBe(assembled.positive.trim().split(/\s+/).length);
  expect(assembled.assembly.overBudgetWords).toBe(assembled.assembly.words-20);
  expect(assembled.assembly.truncated).toBe(false);
  const analysis = analyzePromptQuality({positive:assembled.positive,workflow:{prompt_style:"sdxl"},compilerMeta:{finalAssembly:assembled.assembly}});
  expect(analysis.issues.map((issue)=>issue.code)).toContain("final-word-budget");
  expect(analysis.blockers.map((issue)=>issue.code)).not.toContain("final-word-budget");
});

test("exact recipes retain whitespace, weights, and negatives", () => {
  const positive="  score_9, (blue jacket:1.2)\nOriginal  spacing. ", negative="  Blurry, blurry\n";
  const assembled=assembleFinalPrompts({positive,negative,compiler:"pony",photographic:true,loraTriggers:["new_style"],exact:true});
  expect(assembled.positive).toBe(positive); expect(assembled.negative).toBe(negative); expect(assembled.assembly.exact).toBe(true);
});

test("trigger detection respects boundaries and regex characters", () => {
  const assembled=assembleFinalPrompts({positive:"annual portrait with C++ lighting and Style.Token",loraTriggers:["ann","C++","style.token","ann",null]});
  expect(assembled.positive).toBe("ann, annual portrait with C++ lighting and Style.Token");
});

test("direct instructions and empty prompts are not filled with photographic boilerplate", () => {
  const positive="Change only the jacket to blue. Preserve the face.";
  expect(assembleFinalPrompts({positive,compiler:"qwen_edit"}).positive).toBe(positive);
  expect(assembleFinalPrompts({positive:"",photographic:true,loraTriggers:["style"]}).positive).toBe("");
});

test("zeroed conditioning and Kroma model profile remain consistent", () => {
  const assembled=assembleFinalPrompts({positive:"A clothed studio portrait",negative:"original",compiler:"krea2",negativeStrategy:"zeroed",photographic:true});
  expect(assembled.negative).toBe("original");
  expect(assembled.positive.match(new RegExp(PHOTO_DETAIL,"g"))).toHaveLength(1);
  expect(assembled.positive).toContain(LIMB_DETAIL);
  expect(promptProfile({prompt_style:"kroma",name:"Kroma · v0.3.1 Turbo OPD"})).toBe("krea2");
});

test("weighted score syntax is retained inside its group", () => {
  const positive="A studio image, (score_9, blue jacket:1.2), [score_8_up, natural light]";
  expect(assembleFinalPrompts({positive,compiler:"pony"}).positive).toBe(positive);
});
