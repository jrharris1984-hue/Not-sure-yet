import { DEFAULT_DNA, randomizeDna } from './dna';
import { RANDOM_SCENE_MODES, randomSceneSubjects } from './randomScenes';
import { compileModelPrompts } from './modelPromptCompilers';
const copy=value=>JSON.parse(JSON.stringify(value));
const people=[{id:'a',label:'A',dna:copy(DEFAULT_DNA),field_locks:{}},{id:'b',label:'B',dna:copy(DEFAULT_DNA),field_locks:{}}];

test.each(RANDOM_SCENE_MODES)('$label creates the requested female cast and one shared scene', mode=>{
  const before=JSON.stringify(people);
  const result=randomSceneSubjects(people,mode.id,'adventurous');
  const count=mode.id.startsWith('duo')?2:1;
  expect(result).toHaveLength(count);
  result.forEach(subject=>expect(subject.dna.identity.gender).toBe('female'));
  expect(result[0].dna.scenario.cast_size).toBe(count===2?'duo':'solo');
  expect(JSON.stringify(people)).toBe(before);
  if(count===2){expect(result[1].dna.scene).toEqual(result[0].dna.scene);expect(result[1].dna.scene).not.toBe(result[0].dna.scene);}
});

test('two-person foot mode keeps both bodies and foot ownership in the compiled prompt',()=>{
  const result=randomSceneSubjects(people,'duo_feet','balanced');
  result.forEach(subject=>{expect(subject.dna.feet.composition_mode).toBe('feet focus');expect(subject.dna.feet.framing).toBe('full body');expect(['sitting on edge', 'seated hands folded in lap', 'seated leaning on chair arm']).toContain(subject.dna.pose.action);});
  const prompt=compileModelPrompts({promptStyle:'chroma',subjects:result,dna:result[0].dna}).positive;
  expect(prompt).toContain('Exactly 2 separate adult people');
  expect(prompt).toMatch(/Subject B: \d+-year-old adult woman/);
  expect(prompt).toMatch(/feet|foot/i);
});

test('adventurous random restores the full scale range without changing protected fields',()=>{
  const spy=jest.spyOn(Math,'random').mockReturnValue(.99);
  try {
    const adventurous=randomizeDna(DEFAULT_DNA,{}, {},{profile:'adventurous'});
    const balanced=randomizeDna(DEFAULT_DNA);
    expect(adventurous.physique.implant_volume).toBeGreaterThan(1200);
    expect(adventurous.physique.butt_scale).toBeGreaterThan(100);
    expect(balanced.physique.butt_scale).toBeLessThanOrEqual(100);
    expect(adventurous.feet).toEqual(DEFAULT_DNA.feet);
  } finally {spy.mockRestore();}
});

test('other locks survive scene modes and new subjects receive independent DNA',()=>{
  const current=copy(people);current[0].dna.identity.age=75;current[0].field_locks={identity:{age:true}};
  const result=randomSceneSubjects(current,'duo','balanced',{hair:true});
  expect(result[0].dna.identity.age).toBe(75);
  expect(result[0].dna.hair).toEqual(current[0].dna.hair);
  const added=randomSceneSubjects(current.slice(0,1),'duo','balanced');
  expect(added[1].id).not.toBe(added[0].id);expect(added[1].dna).not.toBe(added[0].dna);
});

test.each(RANDOM_SCENE_MODES)('$label changes unlocked choices even with repeated RNG values', mode => {
  const spy = jest.spyOn(Math, 'random').mockReturnValue(.25);
  try {
    const first = randomSceneSubjects(people, mode.id, 'balanced');
    const second = randomSceneSubjects(first, mode.id, 'balanced');
    for (let i=0; i<first.length; i++) {
      expect(second[i].dna.hair.color).not.toBe(first[i].dna.hair.color);
      expect(second[i].dna.scene.environment).not.toBe(first[i].dna.scene.environment);
      if (mode.id.includes('feet')) {
        expect(second[i].dna.pose.action).not.toBe(first[i].dna.pose.action);
        expect(second[i].dna.feet.pedicure).not.toBe(first[i].dna.feet.pedicure);
        if (mode.id === 'duo_feet') expect(second[i].dna.feet.framing).toBe('full body');
      }
    }
  } finally { spy.mockRestore(); }
});

test('custom outfits clear unlocked stale dress overrides but preserve locked garments', () => {
  const source = copy(people);
  source[0].dna.wardrobe = {...source[0].dna.wardrobe, outfit_mode:'custom', dress_style:'mermaid gown', skirt_style:'pencil skirt'};
  const result = randomSceneSubjects(source, 'solo');
  expect(result[0].dna.wardrobe.dress_style).toBe('');
  expect(result[0].dna.wardrobe.skirt_style).toBe('');
  expect(result[0].dna.wardrobe.outfit_set).toBe('');
  source[0].field_locks = {wardrobe:{dress_style:true}};
  expect(randomSceneSubjects(source,'solo')[0].dna.wardrobe.dress_style).toBe('mermaid gown');
  expect(source[0].dna.wardrobe.skirt_style).toBe('pencil skirt');
});

test('foot templates preserve locked pose and pedicure choices', () => {
  const source = copy(people);
  source[0].dna.pose.action = 'standing';
  source[0].dna.feet.pedicure = 'painted french';
  source[0].field_locks = {pose:{action:true}, feet:{pedicure:true}};
  const result = randomSceneSubjects(source,'feet');
  expect(result[0].dna.pose.action).toBe('standing');
  expect(result[0].dna.feet.pedicure).toBe('painted french');
  const locked = randomSceneSubjects(source,'feet','balanced',{pose:true,feet:true,wardrobe:true});
  expect(locked[0].dna.pose).toEqual(source[0].dna.pose);
  expect(locked[0].dna.feet).toEqual(source[0].dna.feet);
  expect(locked[0].dna.wardrobe).toEqual(source[0].dna.wardrobe);
});
