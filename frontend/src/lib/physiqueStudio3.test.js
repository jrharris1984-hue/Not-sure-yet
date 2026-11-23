import {applyPhysiquePreset,restorePhysiqueRegion,physiqueRegionDifferences,regionFields} from './physiqueStudio3';
describe('Physique Studio 3.0 region editing',()=>{
 test('presets modify only selected region',()=>{
  const dna={hip_scale:50,butt_scale:80,waist_scale:12};
  const changed=applyPhysiquePreset(dna,'Hips','pronounced');
  expect(changed.hip_scale).toBeGreaterThan(50);
  expect(changed.butt_scale).toBe(80);
  expect(changed.waist_scale).toBe(12);
  expect(dna.hip_scale).toBe(50);
 });
 test('respects locked fields',()=>{
  const dna={hip_scale:50,hip_roundness:10};
  const changed=applyPhysiquePreset(dna,'Hips','dramatic',{hip_scale:true});
  expect(changed.hip_scale).toBe(50);
  expect(changed.hip_roundness).toBe(95);
 });
 test('restores one region without altering others',()=>{
  const baseline={hip_scale:20,butt_scale:10};
  const changed={hip_scale:500,butt_scale:100};
  const restored=restorePhysiqueRegion(changed,baseline,'Hips');
  expect(restored.hip_scale).toBe(20);
  expect(restored.butt_scale).toBe(100);
 });
 test('reports actual numeric changes',()=>{
  expect(physiqueRegionDifferences({hip_scale:20},{hip_scale:80},'Hips')).toEqual(expect.arrayContaining([{key:'hip_scale',before:20,after:80}]));
  expect(regionFields('Glutes')).toContain('glute_projection_profile');
 });
});


test('includes shoulders arms and calves in region editing and comparison',()=>{
 expect(regionFields('Shoulders')).toEqual(expect.arrayContaining(['shoulder_width','shoulder_slope','clavicle_definition']));
 expect(regionFields('Arms')).toEqual(expect.arrayContaining(['upper_arm_fullness','arm_muscularity','forearm_fullness']));
 expect(regionFields('Calves')).toEqual(expect.arrayContaining(['calf_fullness','ankle_taper','lower_leg_length']));
 const saved=applyPhysiquePreset({shoulder_width:0},'Shoulders','dramatic');
 expect(saved.shoulder_width).toBe(80);
 expect(saved.shoulder_slope).toBe(95);
});

test('adds torso, leg and neck regions to the organized physique editor',()=>{
 expect(regionFields('Torso & Frame')).toEqual(expect.arrayContaining(['torso_width','ribcage_width','abdominal_softness','pelvic_width']));
 expect(regionFields('Legs')).toEqual(expect.arrayContaining(['leg_length','thigh_length','knee_contour']));
 expect(regionFields('Neck')).toEqual(expect.arrayContaining(['neck_length','neck_muscularity','trapezius_definition']));
 expect(applyPhysiquePreset({},'Torso & Frame','pronounced').torso_width).toBe(55);
});
