import {preferredPhysiquePatch3} from './physiqueComparisonPreference3';

test('saving an A/B preference changes only the selected region on the latest saved character',()=>{
 const character={id:'c1',dna:{pose:{action:'saved pose'},camera:{angle:'saved camera'},physique:{hip_scale:20,butt_scale:30,hip_roundness:10}},subjects:[{id:'a',dna:{pose:{action:'saved pose'},camera:{angle:'saved camera'},physique:{hip_scale:20,butt_scale:30,hip_roundness:10}}},{id:'b',dna:{identity:{name:'B'}}}]};
 const candidate={pose:{action:'test pose'},camera:{angle:'test camera'},physique:{hip_scale:500,hip_roundness:75,butt_scale:900}};
 const patch=preferredPhysiquePatch3(character,candidate,'Hips');
 expect(patch.dna.pose.action).toBe('saved pose');expect(patch.dna.camera.angle).toBe('saved camera');
 expect(patch.dna.physique).toEqual({hip_scale:500,butt_scale:30,hip_roundness:75});
 expect(patch.subjects[0].dna).toEqual(patch.dna);expect(patch.subjects[1]).toEqual(character.subjects[1]);
 expect(character.subjects[0].dna.physique.hip_scale).toBe(20);
});
