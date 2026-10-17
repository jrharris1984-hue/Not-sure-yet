import { DEFAULT_DNA } from './dna';
import { applyCustomRandomizer } from './customRandomizers';
const person=()=>({id:'a',label:'A',dna:JSON.parse(JSON.stringify(DEFAULT_DNA)),field_locks:{}});
test('uses only selected options and keeps untouched fields and locks',()=>{
 const a=person();a.field_locks={hair:{color:true}};a.dna.hair.color='chestnut';
 const rules=[{section:'hair',field:'color',values:['jet black']},{section:'pose',field:'action',values:['standing']}];
 const result=applyCustomRandomizer([a],{rules});
 expect(result.applied).toBe(true);expect(result.subjects[0].dna.hair.color).toBe('chestnut');
 expect(result.subjects[0].dna.pose.action).toBe('standing');expect(result.subjects[0].dna.wardrobe).toEqual(a.dna.wardrobe);
 expect(a.dna.pose.action).toBe('');
});
test('rejects impossible option combinations atomically instead of adding unselected values',()=>{
 const a=person();const rules=[{section:'scene',field:'environment',values:['beach']},{section:'scene',field:'indoor_outdoor',values:['indoor']}];
 const result=applyCustomRandomizer([a],{rules});expect(result.applied).toBe(false);expect(result.subjects).toEqual([a]);
 expect(result.issues.join(' ')).toContain('conflict');
});
test('outdated options are reported and cannot corrupt the character',()=>{
 const a=person();const result=applyCustomRandomizer([a],{rules:[{section:'camera',field:'lens',values:['invalid lens']}]});
 expect(result.applied).toBe(false);expect(result.subjects).toEqual([a]);
});
test('shared scene fields are sampled once for the cast',()=>{
 const a=person(), b={...person(),id:'b',label:'B'};
 const result=applyCustomRandomizer([a,b],{rules:[{section:'scene',field:'environment',values:['studio','living room']}]});
 expect(result.applied).toBe(true);expect(result.subjects[0].dna.scene.environment).toBe(result.subjects[1].dna.scene.environment);
});
