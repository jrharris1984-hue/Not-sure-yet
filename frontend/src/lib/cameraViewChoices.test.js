import {EXTRA_CAMERA_ANGLES,EXTRA_SUBJECT_VIEWS,SPHERICAL_SUBJECT_VIEWS,subjectOrientationDirective,rearSubjectView} from './cameraViewChoices';
import {DEFAULT_DNA,SECTIONS} from './dna';
import {expandPrompt} from './promptMap';
import {resolveBuilderControls} from './builderControlResolution';
import {compileModelPrompts} from './modelPromptCompilers';
test('every added camera position and subject view is selectable and mapped',()=>{
  for(const [section,entries] of [['camera',EXTRA_CAMERA_ANGLES],['pose',EXTRA_SUBJECT_VIEWS]]){
    const options=SECTIONS.find(s=>s.key===section).fields.find(f=>f.key==='angle').options;
    for(const [value,prompt] of Object.entries(entries)){
      expect(options).toContain(value);expect(expandPrompt(section,'angle',value)).toBe(prompt);
    }
  }
});
test.each(Object.keys(EXTRA_CAMERA_ANGLES))('explicit from-above framing takes precedence over %s',angle=>{
  const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));dna.pose.angle='from above';dna.camera.angle=angle;
  expect(resolveBuilderControls(dna).dna.camera.angle).toBe('');
  expect(dna.camera.angle).toBe(angle);
});
test.each(['chroma','krea2','zimage','sdxl','pony','flux2_klein'])('%s retains the added camera height',promptStyle=>{
  const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));dna.camera.angle='chest level';dna.pose.angle='front left three-quarter';
  const {positive}=compileModelPrompts({promptStyle,dna});
  expect(positive).toMatch(/chest (?:height|level)/i);
  expect(positive).toMatch(/(?:front.*three.quarter|three.quarter.*left)/i);
});
test('spherical camera choices include all eight subject directions at five elevations',()=>{
  expect(Object.keys(SPHERICAL_SUBJECT_VIEWS)).toHaveLength(40);
  expect(SPHERICAL_SUBJECT_VIEWS['back from below']).toMatch(/back view.*below.*upward/i);
  expect(SPHERICAL_SUBJECT_VIEWS['left profile from high overhead']).toMatch(/left-side profile.*high above.*downward/i);
  expect(rearSubjectView('back from below')).toBe(true);
  expect(subjectOrientationDirective('back from below')).toMatch(/subject facing away.*camera positioned below/i);
});
