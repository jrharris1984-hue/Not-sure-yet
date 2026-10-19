import {workspaceStepEnabled,matchingWorkspaceFields} from './workspaceNavigation';
import {PREVIEW_FLOWS} from './workspacePreview';
import {SECTIONS} from './dna';
test('visited steps stay reachable after going back, while unmet requirements block jumping',()=>{
  const steps=PREVIEW_FLOWS.describe;
  expect(workspaceStepEnabled(steps,2,2,{description:'A portrait'})).toBe(true);
  expect(workspaceStepEnabled(steps,2,2,{description:''})).toBe(false);
  expect(workspaceStepEnabled(steps,2,1,{description:'A portrait'})).toBe(false);
  expect(workspaceStepEnabled(PREVIEW_FLOWS.image,2,2,{image:'',instruction:'Change jacket'})).toBe(false);
});
test('detail search matches across categories and supports several words',()=>{
  const fields=matchingWorkspaceFields(SECTIONS,'hair color');expect(fields.length).toBeGreaterThan(0);
  expect(fields.every(item=>item.section==='hair')).toBe(true);
  expect(matchingWorkspaceFields(SECTIONS,'glute').some(item=>item.section==='physique')).toBe(true);
  expect(matchingWorkspaceFields(SECTIONS,'not-a-field')).toEqual([]);
});
