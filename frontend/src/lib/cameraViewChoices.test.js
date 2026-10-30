import {EXTRA_CAMERA_ANGLES,EXTRA_SUBJECT_VIEWS} from './cameraViewChoices';
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
