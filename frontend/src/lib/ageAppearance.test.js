import { ageSkinTexture, ageAppearancePrompt, resolveAgeSkin } from './ageAppearance';
import { DEFAULT_DNA } from './dna';
import { applyCastAppearance, editCastSubjectDna } from './castAppearance';
import { compileModelPrompts } from './modelPromptCompilers';
import { expandPrompt } from './promptMap';
import { subjectPromptText } from './selectionFidelity';

const copy = value => JSON.parse(JSON.stringify(value));
const person = (label, age) => ({id:label,label,dna:{...copy(DEFAULT_DNA),identity:{gender:'female',age},skin:{tone:'warm tan',texture:'smooth'},pose:{action:'standing',distance:'portrait'}},field_locks:{}});

test.each([[26,'natural pores'],[35,'fine lines'],[49,'fine lines'],[50,'mature skin texture'],[72,'mature skin texture'],[80,'mature skin texture']])('age %s has a matching automatic skin texture', (age, texture) => {
  expect(ageSkinTexture(age)).toBe(texture);
});

test('editing age updates the visible skin choice and keeps unrelated traits', () => {
  const a=person('A',26);a.dna.hair={color:'auburn'};
  const subjects=[a];const dna={...a.dna,identity:{...a.dna.identity,age:72}};
  const result=editCastSubjectDna(subjects,'A',dna);
  expect(result[0].dna.skin).toEqual({tone:'warm tan',texture:'mature skin texture'});
  expect(result[0].dna.hair.color).toBe('auburn');
  expect(subjects[0].dna.skin.texture).toBe('smooth');
  const young=editCastSubjectDna(result,'A',{...result[0].dna,identity:{...result[0].dna.identity,age:26}});
  expect(young[0].dna.skin.texture).toBe('natural pores');
  a.dna.skin.texture='matte';
  expect(editCastSubjectDna([a],'A',{...a.dna,identity:{...a.dna.identity,age:72}})[0].dna.skin.texture).toBe('matte');
});

test('a shared age change adjusts each unlocked skin texture independently', () => {
  const subjects=[person('A',72),person('B',26)];
  const resolved=applyCastAppearance(subjects,{cast_age_mode:'same age'});
  expect(resolved[1].dna.identity.age).toBe(72);
  expect(resolved[1].dna.skin.texture).toBe('mature skin texture');
  subjects[1].field_locks={skin:{texture:true}};
  expect(applyCastAppearance(subjects,{cast_age_mode:'same age'})[1].dna.skin.texture).toBe('smooth');
});

test('maturity guidance keeps cosmetic finish separate and rejects contradictory smoothing', () => {
  for(const texture of ['smooth','flawless smooth skin, poreless complexion','wrinkle-free skin']) {
    expect(resolveAgeSkin({identity:{age:72},skin:{texture}}).skin.texture).toBe('mature skin texture');
  }
  expect(resolveAgeSkin({identity:{age:72},skin:{texture:'matte',tone:'warm tan'}}).skin.texture).toBe('matte');
  expect(ageAppearancePrompt(undefined)).toBe('');
  expect(ageAppearancePrompt(72)).toContain('seventies');
  expect(ageAppearancePrompt(62)).toContain('sixties');
  expect(ageAppearancePrompt(52)).toContain('fifties');
});

test.each(['chroma','krea2','sdxl','pony','zimage','qwen_image','qwen_rapid'])('%s preserves 72-year-old facial cues in the positive prompt', promptStyle => {
  const dna=person('A',72).dna;
  const result=compileModelPrompts({promptStyle,dna});
  expect(result.positive).toContain('72-year-old');
  expect(result.positive).toContain('seventies');
  expect(result.positive).toContain('forehead wrinkles');
  expect(result.positive).not.toMatch(/flawless|poreless|smooth skin texture/);
  expect(dna.skin.texture).toBe('smooth');
  const young=compileModelPrompts({promptStyle,dna:person('A',26).dna});
  expect(young.positive).not.toMatch(/seventies|forehead wrinkles|mature neck/);
  if(promptStyle==='qwen_rapid') expect(result.negative).toBe('');
});

test('mixed-age subjects keep their own maturity cues under a dense prompt', () => {
  const subjects=[person('A',26),person('B',72)];
  subjects[0].dna.scenario={cast_size:'duo',cast_age_mode:'individual ages'};
  for(const subject of subjects) subject.dna.style.extra='editorial photograph '.repeat(200);
  const result=compileModelPrompts({promptStyle:'qwen_rapid',subjects,dna:subjects[0].dna});
  expect(result.positive).toContain('Subject A: 26-year-old adult woman');
  expect(result.positive).toContain('Subject B: 72-year-old adult woman');
  expect(result.positive).toContain('seventies');
  expect(subjectPromptText(result.positive,'A',true)).not.toContain('seventies');
});

test('skin texture mappings do not force freckles and include maturity selections', () => {
  expect(expandPrompt('skin','texture','textured')).not.toContain('freckles');
  expect(expandPrompt('skin','texture','mature skin texture')).toContain('facial lines');
});
