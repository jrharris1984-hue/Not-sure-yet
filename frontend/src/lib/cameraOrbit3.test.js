import {cameraOrbitSelection,ORBIT_VIEWS,ORBIT_ELEVATIONS} from './cameraOrbit3';
import {rearSubjectView,subjectOrientationDirective} from './cameraViewChoices';
describe('3.0 visual camera orbit',()=>{
 test('covers all eight positions',()=>expect(new Set(ORBIT_VIEWS.map(x=>x.value)).size).toBe(8));
 test('keeps rear orientation independent from elevation',()=>{
  const state=cameraOrbitSelection('back','slightly low');
  expect(state.direction).toBe('back');
  expect(state.elevation).toBe('from below');
 });
 test('recognizes rear three-quarter selections',()=>{
  expect(rearSubjectView('rear left three-quarter')).toBe(true);
  expect(subjectOrientationDirective('rear left three-quarter')).toMatch(/behind the subject/);
 });
 test('provides five camera elevations',()=>expect(ORBIT_ELEVATIONS).toHaveLength(5));
});
