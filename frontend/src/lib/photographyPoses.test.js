import { SECTIONS, DEFAULT_DNA } from './dna';
import { PHOTOGRAPHY_POSE_PROMPTS, PHOTOGRAPHY_POSE_GROUPS, POSE_ACTION_PROMPTS, photographyPosePrompt } from './photographyPoses';
import { expandPrompt } from './promptMap';
import { POSE_PACKS, samplePoses } from './posePacks';
import { compileModelPrompts } from './modelPromptCompilers';

it('makes all 127 photography directions selectable in Builder and shoot packs',()=>{
 const choices=SECTIONS.find(s=>s.key==='pose').fields.find(f=>f.key==='action').groups.flatMap(g=>g.options);
 expect(Object.keys(PHOTOGRAPHY_POSE_PROMPTS)).toHaveLength(127);
 expect(choices).toContain('standing back to camera');
 expect(choices).toContain('seated with back to camera');
 expect(choices).toContain('side-saddle on a chair');
 for (const [name,count] of [['Squatting',13],['All Fours',13],['Kneeling',13],['Boudoir editorial',18],['Boudoir studio variations',21]]) {
  const group=PHOTOGRAPHY_POSE_GROUPS.find(item=>item.name===name);
  expect(group.options).toHaveLength(count);
  for (const pose of group.options) expect(POSE_ACTION_PROMPTS[pose]).toBeTruthy();
 }
 PHOTOGRAPHY_POSE_GROUPS.forEach((group,index)=>{
  group.options.forEach(option=>expect(choices).toContain(option));
  expect(POSE_PACKS.find(p=>p.key===`photography_${index}`).poses).toEqual(group.options);
  expect(samplePoses({mode:'pack',packKey:`photography_${index}`,count:8})).toHaveLength(8);
 });
});

it('compiles boudoir layering and garment finish selections into the render prompt',()=>{
 const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));
 dna.wardrobe.layering_piece='silk kimono robe';
 dna.wardrobe.lingerie_cut='longline balconette silhouette';
 dna.wardrobe.trim_detail='scalloped lace edging';
 const positive=compileModelPrompts({promptStyle:'chroma',dna}).positive;
 expect(positive).toContain('silk kimono robe');
 expect(positive).toContain('longline balconette silhouette');
 expect(positive).toContain('scalloped lace edging');
});
it.each(['chroma','krea2'])('sends detailed standing directions to %s',promptStyle=>{
 const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));
 dna.pose.action='standing quarter turn';
 expect(compileModelPrompts({promptStyle,dna}).positive).toContain(POSE_ACTION_PROMPTS['standing quarter turn']);
});

it('uses shared cast pose pools for manual packs and random multi-person shots',()=>{
 const packs=[{key:'shared-lingerie',name:'Lingerie editorial',poses:['pair pose A','pair pose B']}];
 expect(samplePoses({mode:'pack',packKey:'shared-lingerie',count:4,allPoses:packs[0].poses,packs,shared:true}))
  .toEqual(['pair pose A','pair pose B','pair pose A','pair pose B']);
 const randomized=samplePoses({mode:'natural',count:8,allPoses:packs[0].poses,packs,shared:true});
 expect(randomized).toHaveLength(8);
 expect(randomized.every(pose=>packs[0].poses.includes(pose))).toBe(true);
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
