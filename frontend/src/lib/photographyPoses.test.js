import { SECTIONS, DEFAULT_DNA } from './dna';
import { PHOTOGRAPHY_POSE_PROMPTS, PHOTOGRAPHY_POSE_GROUPS, POSE_ACTION_PROMPTS, photographyPosePrompt } from './photographyPoses';
import { expandPrompt } from './promptMap';
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
 expect(compileModelPrompts({promptStyle,dna}).positive).toContain(POSE_ACTION_PROMPTS['standing quarter turn']);
});

it('maps every selectable pose to the supplied phrase without extra wording', () => {
 const choices=SECTIONS.find(section=>section.key==='pose').fields.find(field=>field.key==='action').groups.flatMap(group=>group.options);
 expect(Object.keys(POSE_ACTION_PROMPTS).sort()).toEqual([...choices].sort());
 expect(POSE_ACTION_PROMPTS['standing']).toBe('standing pose, neutral upright stance, basic position, centered composition');
 expect(POSE_ACTION_PROMPTS['lying side']).toBe('lying on side pose, lateral recline, curved body line, relaxed侧卧');
 for (const pose of choices) {
  expect(photographyPosePrompt(pose)).toBe(POSE_ACTION_PROMPTS[pose]);
  expect(expandPrompt('pose', 'action', pose)).toBe(POSE_ACTION_PROMPTS[pose]);
 }
});
