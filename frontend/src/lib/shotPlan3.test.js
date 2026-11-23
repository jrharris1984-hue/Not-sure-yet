import {createShotPlan,updateShot,reorderShot,duplicateShot,activeShots} from './shotPlan3';
describe('3.0 shot plan',()=>{
  test('creates independent template shots',()=>{
    const p=createShotPlan({count:3,template:{id:'editorial',scene:{environment:'studio'},lighting:{style:'cinematic'}}});
    expect(p.shots).toHaveLength(3);
    const edited=updateShot(p,'shot-2',{subjectView:'back from below',scene:{environment:'beach'}});
    expect(edited.shots[1].subjectView).toBe('back from below');
    expect(edited.shots[0].scene.environment).toBe('studio');
    expect(p.shots[1].scene.environment).toBe('studio');
  });
  test('reorders without losing shot identity',()=>{
    const p=createShotPlan({count:3});
    expect(reorderShot(p,0,2).shots.map(s=>s.id)).toEqual(['shot-2','shot-3','shot-1']);
  });
  test('duplicates with unique IDs and filters disabled shots',()=>{
    const p=createShotPlan({count:2});
    const copy=duplicateShot(p,'shot-1');
    expect(new Set(copy.shots.map(s=>s.id)).size).toBe(3);
    expect(activeShots(updateShot(copy,'shot-1',{enabled:false}))).toHaveLength(2);
  });
});
