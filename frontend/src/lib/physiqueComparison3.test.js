import {buildPhysiqueComparison,comparisonIsControlled} from './physiqueComparison3';
describe('3.0 controlled physique comparisons',()=>{
 test('holds all non-target DNA constant',()=>{
  const baseline={hip_scale:10,butt_scale:20,waist_scale:5,hip_roundness:0};
  const candidate={hip_scale:500,butt_scale:30,waist_scale:5,hip_roundness:90};
  const p=buildPhysiqueComparison({baseline,candidate,region:'Hips',seed:44,workflowId:'moss',pose:'standing',subjectView:'back',cameraAngle:'slightly low'});
  expect(p.frames[0].dna.hip_scale).toBe(10);
  expect(p.frames[1].dna.hip_scale).toBe(500);
  expect(p.frames[0].dna.butt_scale).toBe(30);
  expect(p.frames[1].dna.butt_scale).toBe(30);
  expect(comparisonIsControlled(p)).toBe(true);
 });
 test('does not mutate original DNA objects',()=>{
  const a={hip_scale:20};const b={hip_scale:40};
  buildPhysiqueComparison({baseline:a,candidate:b,region:'Hips'});
  expect(a.hip_scale).toBe(20);expect(b.hip_scale).toBe(40);
 });
 test('detects mismatched control parameters',()=>{
  const p=buildPhysiqueComparison({baseline:{},candidate:{hip_scale:100},region:'Hips'});
  p.frames[1].seed=99;
  expect(comparisonIsControlled(p)).toBe(false);
 });
});
