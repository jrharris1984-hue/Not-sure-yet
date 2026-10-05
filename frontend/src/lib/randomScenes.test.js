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
  result.forEach(subject=>{expect(subject.dna.feet.composition_mode).toBe('feet focus');expect(subject.dna.feet.framing).toBe('full body');expect(subject.dna.pose.action).toBe('sitting on edge');});
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
