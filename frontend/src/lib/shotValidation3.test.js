import {validateShotFrames,shotOrientationWarning} from './shotValidation3';
import {createShotPlan,updateShot} from './shotPlan3';
describe('3.0 orientation preflight',()=>{
 test('detects conflicting frontal instructions on rear shots',()=>{
   expect(shotOrientationWarning({subjectView:'back'},'REQUIRED VIEW — front view; subject facing the camera.')).toMatch(/Conflicting/);
 });
 test('checks per-frame overrides',()=>{
   const plan=updateShot(createShotPlan({count:1}),'shot-1',{subjectView:'back',cameraAngle:'low'});
   const errors=validateShotFrames(plan,[{pose_overrides:{angle:'front'},camera_overrides:{angle:'high'},prompt_positive:'Portrait'}]);
   expect(errors.join(' ')).toMatch(/subject orientation override was lost/);
   expect(errors.join(' ')).toMatch(/camera elevation override was lost/);
 });
 test('rejects empty queues',()=>{
   const plan=updateShot(createShotPlan({count:1}),'shot-1',{enabled:false});
   expect(validateShotFrames(plan,[])).toContain('Enable at least one shot.');
 });
});
