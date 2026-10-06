import { DEFAULT_DNA } from './dna';
import { compileModelPrompts } from './modelPromptCompilers';
import { appearanceSignature, preserveGeneralSelections, subjectPromptText } from './selectionFidelity';
import { resolveBuilderControls, sliderPromptSignature } from './builderControlResolution';
import { POSE_ACTION_PROMPTS } from './photographyPoses';

const sample = () => ({ ...DEFAULT_DNA, identity:{age:42,gender:'female',ethnicity:'nordic'},
  physique:{body_type:'athletic',height:'petite'}, face:{eye_color:'brown'},
  hair:{color:'jet black',bangs:'none'}, skin:{tone:'deep brown',freckles:'none'},
  pose:{action:'standing arms loosely crossed',hands:'on hips',body_language:'relaxed',distance:'full body',angle:'front'},
  wardrobe:{outfit_preset:'pantsuit'}, scenario:{} });
const families=['chroma','krea2','zimage','qwen_image','pony','sdxl'];

test.each(families)('%s keeps supplied pose wording without competing hands or duplicate age', promptStyle => {
  const dna=sample(), before=JSON.stringify(dna);
  const result=compileModelPrompts({promptStyle,dna});
  expect(result.positive).toContain(POSE_ACTION_PROMPTS[dna.pose.action]);
  expect(result.positive).not.toMatch(/hands (?:placed |resting )?on hips/);
  expect(result.positive).not.toContain('age 42 years');
  expect(result.positive).toContain('42-year-old');
  expect(result.positive).toContain('no bangs');
  expect(result.positive).toContain('no freckles');
  expect(JSON.stringify(dna)).toBe(before);
});

test('preservation pass is idempotent and recognizes build synonyms and heritage aliases', () => {
  const dna={identity:{ethnicity:'blasian'},physique:{body_type:'athletic'},hair:{bangs:'none'},skin:{freckles:'none'}};
  const initial={positive:'Photograph. Black and Asian mixed heritage, athletic body type, no bangs, no freckles'};
  expect(appearanceSignature(dna,initial.positive)).toBe('');
  expect(preserveGeneralSelections(initial,[{dna}])).toBe(initial);
  const first=preserveGeneralSelections({positive:'Photograph.'},[{dna}]);
  expect(preserveGeneralSelections(first,[{dna}])).toBe(first);
  expect(first.positive).not.toContain('blasian heritage');
});

test('dark hair alone does not falsely satisfy a selected Black heritage', () => {
  expect(appearanceSignature({identity:{ethnicity:'black'}},'black hair')).toContain('Black heritage');
});

test('subject-specific preservation never borrows a different person’s features', () => {
  const result={positive:'Subject A: red hair, no bangs; Subject B: black hair, bangs'};
  const subjects=[{label:'A',dna:{hair:{color:'red',bangs:'none'}}},{label:'B',dna:{hair:{color:'black',bangs:'none'}}}];
  const preserved=preserveGeneralSelections(result,subjects);
  expect(preserved.positive).toContain('Subject B appearance: no bangs');
  expect(preserved.positive).not.toContain('Subject A appearance');
  expect(subjectPromptText(result.positive,'A',true)).not.toContain('black hair');
  expect(sliderPromptSignature({identity:{age:42}},'43-year-old adult')).toBe('age 42 years');
});

test('pose directions own camera height while lens choices and custom instructions are retained', () => {
  const dna=sample();dna.pose={action:'reverse view',angle:'front',hands:'in hair'};dna.camera={angle:'eye-level',lens:'85mm'};
  const rear=resolveBuilderControls(dna);
  expect(rear.dna.pose.angle).toBe('back');
  expect(rear.dna.pose.hands).toBe('in hair');
  expect(rear.dna.camera.angle).toBe('eye-level');
  dna.pose={action:'standing',angle:'from above'};dna.camera.angle='eye-level';
  const high=resolveBuilderControls(dna);
  expect(high.dna.camera.angle).toBe('');
  expect(high.dna.camera.lens).toBe('85mm');
  dna.camera.angle='dutch';expect(resolveBuilderControls(dna).dna.camera.angle).toBe('dutch');
  dna.pose={action:'My custom arm pose',hands:'on hips',body_language:'relaxed'};
  expect(resolveBuilderControls(dna).dna.pose).toEqual(dna.pose);
});


test('full-length Krea framing satisfies the crop requirement without another fallback', () => {
  const result=compileModelPrompts({promptStyle:'krea2',dna:sample()});
  expect(result.positive).toContain('Full-length photograph');
  expect(result.positive).not.toContain('Required details: full body framing');
});


test.each(families)('%s cannot restore a front view behind a reverse-view pose', promptStyle => {
  const dna=sample();dna.pose={...dna.pose,action:'reverse view',angle:'front'};
  const result=compileModelPrompts({promptStyle,dna});
  expect(result.positive).toContain(POSE_ACTION_PROMPTS['reverse view']);
  expect(result.positive).not.toMatch(/front-facing view|front view|subject facing the camera/i);
});
