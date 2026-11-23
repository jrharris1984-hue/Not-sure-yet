import {comparisonDispatches} from './physiqueComparisonDispatch3';
import {buildPhysiqueComparison} from './physiqueComparison3';
jest.mock('./modelPromptCompilers',()=>({compileModelPrompts:({dna})=>({positive:'hip '+dna.physique.hip_scale,negative:''})}));
describe('3.0 comparison queue payloads',()=>{
 const plan=buildPhysiqueComparison({baseline:{hip_scale:20},candidate:{hip_scale:200},region:'Hips',seed:42,workflowId:'wf',pose:'standing',subjectView:'back',cameraAngle:'slightly low'});
 const character={id:'char',dna:{physique:{hip_scale:20},face:{expression:'neutral'}},subjects:[]};
 const workflow={id:'wf',kind:'image',name:'Image',prompt_style:'moss'};
 test('keeps seed, pose, view and workflow fixed',()=>{
  const [a,b]=comparisonDispatches(plan,character,workflow);
  expect(a.seed).toBe(42);expect(b.seed).toBe(42);
  expect(a.dna.pose.angle).toBe('back');expect(b.dna.pose.angle).toBe('back');
  expect(a.dna.camera.angle).toBe('slightly low');
  expect(a.workflow_id).toBe(b.workflow_id);
  expect(a.dna.physique.hip_scale).toBe(20);
  expect(b.dna.physique.hip_scale).toBe(200);
  expect(a.dna.face).toEqual(b.dna.face);
 });
 test('rejects non-image workflow',()=>expect(()=>comparisonDispatches(plan,character,{...workflow,kind:'video'})).toThrow(/image generation/));
 test('rejects unchanged region',()=>expect(()=>comparisonDispatches({...plan,changes:[]},character,workflow)).toThrow(/Change a physique/));
});
