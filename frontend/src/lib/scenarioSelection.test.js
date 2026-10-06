import { applyScenarioSelection } from './scenarioSelection';
import { expectedSubjectCount } from './dna';
const person=(id,scenario={})=>({id,dna:{identity:{age:30},scenario},field_locks:{}});

test('Solo removes the second person and stale pairing so it cannot be added back',()=>{
  const current=[person('a',{cast_size:'duo',cast_type:'best friends'}),person('b')];
  const next=applyScenarioSelection(current,{...current[0].dna.scenario,cast_size:'solo'});
  expect(next.map(s=>s.id)).toEqual(['a']);
  expect(next[0].dna.scenario.cast_type).toBe('none');
  expect(expectedSubjectCount(next[0].dna)).toBe(1);
  expect(current).toHaveLength(2);
});
test('new pairings enable the appropriate multi-person count',()=>{
  const current=[person('a',{cast_size:'solo',cast_type:'none'})];
  for(const [pairing,count] of [['best friends',2],['triplets',3]]){
    const next=applyScenarioSelection(current,{...current[0].dna.scenario,cast_type:pairing});
    expect(expectedSubjectCount(next[0].dna)).toBe(count);
  }
});
test('unrelated scenario edits preserve each person and their traits',()=>{
  const current=[person('a',{cast_size:'duo',cast_type:'best friends'}),person('b')];
  const next=applyScenarioSelection(current,{...current[0].dna.scenario,extra_notes:'evening portrait'});
  expect(next).toHaveLength(2);expect(next[1]).toBe(current[1]);
});
