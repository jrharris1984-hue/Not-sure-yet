import { applyCastAppearance, castAppearancePrompt, editCastSubjectDna } from "./castAppearance";
import { compileModelPrompts } from "./modelPromptCompilers";
import { DEFAULT_DNA } from "./dna";
const copy = value => JSON.parse(JSON.stringify(value));
const person = (label, age, face = {}, gender = "female") => ({ id:label, label, dna:{ ...copy(DEFAULT_DNA), identity:{ age, gender }, face, pose:{ distance:"full body", action:"standing" }, scenario:{ cast_size:"group" } }, field_locks:{} });
const families = ["chroma", "krea2", "zimage", "sdxl", "pony", "flux2_klein", "standard", "wan_t2v"];

test("age and similarity presets update existing people without copying outfits or expressions", () => {
  const input = [person("A",30,{eye_shape:"almond",nose:"straight",expression:"smile"}),person("B",55,{nose:"aquiline",expression:"serious"})];
  input[1].dna.wardrobe.top = "blouse";
  const result = applyCastAppearance(input,{cast_age_mode:"same age",cast_resemblance:"matching faces"});
  expect(result[1].dna.identity.age).toBe(30);
  expect(result[1].dna.face.nose).toBe("straight");
  expect(result[1].dna.face.expression).toBe("serious");
  expect(result[1].dna.wardrobe.top).toBe("blouse");
  expect(input[1].dna.identity.age).toBe(55);
  expect(input[1].dna.face.nose).toBe("aquiline");
});

test("age contrast honors the selected gap at either end of the adult range", () => {
  for (const [start, expected] of [[25,45],[75,55],[18,38]]) {
    const result = applyCastAppearance([person("A",start),person("B",30)],{cast_age_mode:"age contrast",cast_age_gap:20});
    expect(result[1].dna.identity.age).toBe(expected);
  }
});

test("locked ages and face fields survive presets", () => {
  const subjects = [person("A",30,{nose:"straight"}),person("B",60,{nose:"aquiline"})];
  subjects[1].field_locks = {identity:{age:true},face:{nose:true}};
  const result = applyCastAppearance(subjects,{cast_age_mode:"same age",cast_resemblance:"matching faces"});
  expect(result[1].dna.identity.age).toBe(60);
  expect(result[1].dna.face.nose).toBe("aquiline");
  expect(applyCastAppearance(subjects,{cast_age_mode:"same age"},{identity:true})[1].dna.identity.age).toBe(60);
});

test.each(families)("%s preserves all four ages, mixed genders, and late subject traits", promptStyle => {
  const subjects = [person("A",25),person("B",40,{},"male"),person("C",55),person("D",70,{nose:"aquiline",eye_color:"hazel",jawline:"square"})];
  const result = compileModelPrompts({promptStyle,dna:subjects[0].dna,subjects});
  expect(result.positive).toContain("Exactly 4 separate adult people");
  expect(result.positive).toContain("Subject B: 40-year-old adult man");
  expect(result.positive).toContain("Subject D: 70-year-old adult woman");
  expect(result.positive).toContain("aquiline");
  expect(result.positive).toContain("hazel");
  expect(result.positive).not.toContain("five women");
  expect(result.positive).not.toContain("four women");
});

test.each(families)("%s keeps selected general appearance and photography settings", promptStyle => {
  const dna = copy(DEFAULT_DNA);
  dna.face={eye_shape:"round",eye_color:"green",jawline:"square",nose:"aquiline",lips:"full",expression:"serious"};
  dna.hair={color:"auburn",length:"shoulder",style:"wavy",texture:"coarse",bangs:"curtain"};
  dna.skin={tone:"warm tan",texture:"matte",freckles:"heavy",tattoos:"floral sleeve"};
  dna.wardrobe={nail_color:"burgundy",nail_shape:"coffin",glasses_style:"cat-eye frames",glasses_color:"tortoiseshell"};
  dna.pose={distance:"full body",action:"standing"};
  dna.lighting={source:"softbox",direction:"rim",color_temp:"cool"};
  dna.camera={lens:"85mm",aperture:"f/8",angle:"eye-level",aspect_ratio:"4:5"};
  const result=compileModelPrompts({promptStyle,dna});
  for(const value of ["green","square","aquiline","auburn","coarse","curtain","warm tan","matte","floral sleeve","softbox","rim","cool","85mm","f/8","4:5","burgundy","coffin","cat-eye frames","tortoiseshell"]) expect(result.positive.toLowerCase()).toContain(value);
});

test("cast resemblance and ages are present in every generation compiler", () => {
  for(const promptStyle of families) {
    const subjects=[person("A",35,{nose:"straight"}),person("B",60,{nose:"aquiline"})];
    subjects[0].dna.scenario={cast_size:"duo",cast_age_mode:"same age",cast_resemblance:"matching faces"};
    const result=compileModelPrompts({promptStyle,subjects,dna:subjects[0].dna});
    expect(result.positive).toContain("Subject B: 35-year-old adult woman");
    expect(result.positive).toContain("Matching eye shape");
    expect(subjects[1].dna.identity.age).toBe(60);
  }
});

test("direct editing and image-to-video retain instruction-only behavior", () => {
  const subjects=[person("A",30),person("B",60)];
  const edit=compileModelPrompts({promptStyle:"qwen_edit",subjects,isMulti:true,editInstruction:"Change the background to blue"});
  const video=compileModelPrompts({promptStyle:"wan_i2v",subjects,isMulti:true,videoInstruction:"Slow camera pan"});
  expect(edit.positive).not.toContain("Selected appearance");
  expect(video.positive).not.toContain("Exactly 2");
});

test("individual resemblance describes different faces without altering their traits", () => {
  const subjects=[person("A",30,{nose:"straight"}),person("B",60,{nose:"aquiline"})];
  subjects[0].dna.scenario.cast_resemblance="individual faces";
  expect(castAppearancePrompt(subjects)).toContain("distinct face");
  expect(applyCastAppearance(subjects,subjects[0].dna.scenario)[1].dna.face.nose).toBe("aquiline");
});


test("direct individual edits clear conflicting shared presets", () => {
  const subjects=[person("A",30,{nose:"straight"}),person("B",30,{nose:"straight"})];
  subjects[0].dna.scenario={cast_age_mode:"same age",cast_resemblance:"matching faces"};
  const edited=editCastSubjectDna(subjects,"B",{...subjects[1].dna,identity:{age:65,gender:"female"},face:{nose:"aquiline"}});
  expect(edited[0].dna.scenario.cast_age_mode).toBe("individual ages");
  expect(edited[0].dna.scenario.cast_resemblance).toBe("individual faces");
  const prompt=compileModelPrompts({promptStyle:"chroma",subjects:edited,dna:edited[0].dna}).positive;
  expect(prompt).toContain("Subject B: 65-year-old adult woman");
  expect(prompt).toContain("aquiline");
});


test("matching faces does not fight a duplicate-face negative prompt", () => {
  const subjects=[person("A",30),person("B",30)];
  subjects[0].dna.scenario.cast_resemblance="matching faces";
  const result=compileModelPrompts({promptStyle:"chroma",subjects,dna:subjects[0].dna});
  expect(result.negative).not.toContain("duplicate face");
  expect(result.negative).toContain("shared limbs");
});


test("explicit absence selections remain visible in creator prompts", () => {
  const dna=copy(DEFAULT_DNA);dna.hair.bangs="none";dna.skin.freckles="none";
  for(const promptStyle of families) {
    const result=compileModelPrompts({promptStyle,dna});
    expect(result.positive).toContain("no bangs");
    expect(result.positive).toContain("no freckles");
  }
});
