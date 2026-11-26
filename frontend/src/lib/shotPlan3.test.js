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
  test('supports a 120-shot plan and merges per-shot foot edits',()=>{
    const p=createShotPlan({count:120});
    expect(p.shots).toHaveLength(120);
    const withFeet=updateShot({...p,shots:p.shots.map((shot,index)=>index===0?{...shot,feet:{hosiery:'sheer stockings',skin_finish:'soft lotion sheen'}}:shot)},'shot-1',{feet:{foot_pose:'ankles crossed'}});
    expect(withFeet.shots[0].feet).toEqual({hosiery:'sheer stockings',skin_finish:'soft lotion sheen',foot_pose:'ankles crossed'});
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
