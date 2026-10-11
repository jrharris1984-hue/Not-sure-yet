import {SECTIONS} from './dna';
import {compileModelPrompts} from './modelPromptCompilers';
import {sharedPoseGroups} from './promptCatalog';
import {selectSharedCastPose,resolveCastPoses} from './castPoseResolution';
const catalog={sections:[]};
const pose=SECTIONS.find(section=>section.key==='pose');
const choices=field=>{const f=pose.fields.find(item=>item.key===field);return f.groups?.flatMap(group=>group.options)||f.options;};
const sample=()=>({identity:{age:35,gender:'female'},physique:{},hair:{},skin:{},wardrobe:{bottom:'jeans'},feet:{},pose:{},camera:{},scene:{}});
test.each(['standard','chroma','krea2','pony','zimage','qwen_image'])('%s compiles every body pose against every built-in crop without altering saved selections',promptStyle=>{
 for(const action of choices('action')) for(const distance of choices('distance')) {
  const dna=sample();dna.pose={action,distance};const before=JSON.stringify(dna);
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:catalog});
  expect(result.positive.length).toBeGreaterThan(0);
  expect(result.positive).not.toMatch(/\b(?:undefined|NaN)\b/);
  expect(JSON.stringify(dna)).toBe(before);
 }
});
test.each(['standard','chroma','krea2','pony','zimage','qwen_image'])('%s checks every shared pose against every crop for two and three people',promptStyle=>{
 for(const count of [2,3]) for(const group of sharedPoseGroups(count,catalog)) for(const choice of group.poses) for(const distance of choices('distance')) {
  const original=Array.from({length:count},(_,index)=>({id:String(index),label:String.fromCharCode(65+index),dna:sample()}));
  const selected=selectSharedCastPose(original,choice.prompt);selected[0].dna.pose.distance=distance;
  const before=JSON.stringify(selected), resolution=resolveCastPoses(selected,catalog);
  expect(resolution.subjects.every(subject=>subject.dna.pose.distance===resolution.subjects[0].dna.pose.distance)).toBe(true);
  const result=compileModelPrompts({subjects:selected,dna:selected[0].dna,promptStyle,promptCatalog:catalog});
  expect(result.positive).toContain(choice.prompt);
  expect(result.positive).not.toMatch(/\b(?:undefined|NaN)\b/);
  expect(JSON.stringify(selected)).toBe(before);
 }
});
