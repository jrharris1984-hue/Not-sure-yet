import { SECTIONS, DEFAULT_DNA } from './dna';
import { PHOTOGRAPHY_POSE_PROMPTS, PHOTOGRAPHY_POSE_GROUPS } from './photographyPoses';
import { POSE_PACKS, samplePoses } from './posePacks';
import { compileModelPrompts } from './modelPromptCompilers';

it('makes all sixteen photography directions selectable in Builder and shoot packs',()=>{
 const choices=SECTIONS.find(s=>s.key==='pose').fields.find(f=>f.key==='action').groups.flatMap(g=>g.options);
 expect(Object.keys(PHOTOGRAPHY_POSE_PROMPTS)).toHaveLength(16);
 PHOTOGRAPHY_POSE_GROUPS.forEach((group,index)=>{
  group.options.forEach(option=>expect(choices).toContain(option));
  expect(POSE_PACKS.find(p=>p.key===`photography_${index}`).poses).toEqual(group.options);
  expect(samplePoses({mode:'pack',packKey:`photography_${index}`,count:8})).toHaveLength(8);
 });
});
it.each(['chroma','krea2'])('sends detailed standing directions to %s',promptStyle=>{
 const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));
 dna.pose.action='standing quarter turn';
 expect(compileModelPrompts({promptStyle,dna}).positive).toContain('torso turned forty-five degrees');
});
