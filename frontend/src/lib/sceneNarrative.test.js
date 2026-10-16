import { compileModelPrompts, buildWanImageToVideoPrompts } from './modelPromptCompilers';
import { buildSceneNarrative } from './sceneNarrative';

const portrait = () => ({identity:{age:47,gender:'female'},hair:{color:'silver',style:'bob'},
  wardrobe:{outfit_mode:'full',outfit_set:'navy pantsuit with white blouse',set_lingerie_mode:'none',exposure_mode:'use selected outfit'},
  pose:{action:'standing with ankles crossed',distance:'full body',angle:'front view'},
  scene:{environment:'photography studio'},lighting:{source:'softbox'},camera:{angle:'eye-level',lens:'50mm'},style:{render:'photorealistic'}});
const styles=['standard','chroma','chroma_test','chroma_flash','chroma_turbo','krea2','krea2_test','kroma','zimage','flux2_klein','flux1_dev','qwen_image','qwen_rapid','sdxl','sdxl_dmd2','pony'];

test.each(styles)('%s scene format preserves selected facts and adds a connected composition',promptStyle=>{
  const dna=portrait(),before=JSON.stringify(dna);
  const result=compileModelPrompts({dna,promptStyle,promptFormat:'scene',workflowKind:'image'});
  expect(result.profile).toBe('scene-narrative-v1');
  expect(result.scenePlan).toMatchObject({subjectCount:1,task:'text-to-image',present:{setting:true,lighting:true,camera:true,action:true}});
  expect(result.positive).toContain('navy pantsuit with white blouse');
  expect(result.positive).toContain('silver hair');expect(result.positive).toContain('47-year-old adult woman');
  expect(result.positive).toContain('standing with ankles crossed');
  expect(result.positive).toMatch(/head.*both complete feet/);
  expect(result.positive).toContain('photography studio');expect(result.positive).toContain('softbox');
  expect(result.positive).toContain('one coherent scene');expect(result.positive).not.toMatch(/undefined|NaN|\[object Object\]/);
  expect(result.promptBudget).toBeNull();expect(JSON.stringify(dna)).toBe(before);
});

test('unspecified scene context is disclosed rather than silently invented',()=>{
  const result=buildSceneNarrative([{dna:{identity:{age:30,gender:'male'},pose:{distance:'full body'}}}],{sections:[]},'chroma',false);
  expect(result.scenePlan.missing).toEqual(['setting','lighting','camera','action']);
  expect(result.positive).not.toMatch(/studio|softbox|50mm|standing|sitting/i);
  expect(result.scenePlan.defaults).toEqual(['consistent perspective and lighting']);
});

test('two subjects keep their own outfits and descriptions, with one shared scene',()=>{
  const a=portrait(),b=portrait();b.identity.gender='male';b.hair.color='brown';b.wardrobe.outfit_set='gray suit';
  const result=compileModelPrompts({subjects:[{label:'A',dna:a},{label:'B',dna:b}],promptStyle:'kroma',workflowKind:'image',promptFormat:'scene'});
  expect(result.scenePlan.subjectCount).toBe(2);
  expect(result.positive).toContain('Subject A wears navy pantsuit with white blouse');
  expect(result.positive).toContain('Subject B wears gray suit');
  expect(result.positive.match(/The scene is situated/g)).toHaveLength(1);
});

test('custom descriptions and importance weights remain intact',()=>{
  const dna=portrait();dna.hair.color='silver';
  const promptCatalog={sections:[{key:'hair',title:'Hair',fields:[{key:'color',type:'chips',options:[{value:'silver',keywords:'(silver hair with a copper streak:1.2)'}]}]}]};
  const result=compileModelPrompts({dna,promptCatalog,promptStyle:'zimage',promptFormat:'scene'});
  expect(result.positive).toContain('(silver hair with a copper streak:1.2)');
  expect(result.selectionManifest.some(item=>item.section==='hair' || item.key.includes('hair'))).toBe(true);
});

test('Pony keeps its model tags before the scene narrative',()=>{
  const result=compileModelPrompts({dna:portrait(),promptStyle:'pony',promptFormat:'scene'});
  expect(result.positive).toMatch(/^score_9/);
  expect(result.scenePlan.language).toBe('narrative-with-model-tags');
});

test.each(['wan_t2v','wan5b_t2v','ltx_t2v'])('%s scene mode includes temporal action after the scene',promptStyle=>{
  const result=compileModelPrompts({dna:portrait(),promptStyle,workflowKind:'text_video',promptFormat:'scene',videoInstruction:'The camera slowly moves backward as the subject waves.'});
  expect(result.scenePlan.task).toBe('text-to-video');
  expect(result.positive).toContain('One continuous cinematic shot');
  expect(result.positive).toContain('The camera slowly moves backward as the subject waves.');
});

test.each(['qwen_edit','wan_i2v'])('%s keeps its dedicated task instruction in scene mode',promptStyle=>{
  const args={promptStyle,workflowKind:promptStyle==='qwen_edit'?'edit':'video',editInstruction:'Change the wall to blue',videoInstruction:'Slow camera pan'};
  const original=compileModelPrompts({...args,promptFormat:'detailed'});
  const scene=compileModelPrompts({...args,promptFormat:'scene'});
  expect(scene.positive).toBe(original.positive);expect(scene.scenePlan).toBeUndefined();
});

test('long image-to-video instructions retain their ending instead of a silent 180-word cutoff',()=>{
  const instruction='Move slowly. '.repeat(110)+'End with the camera facing the doorway.';
  expect(buildWanImageToVideoPrompts({instruction}).positive).toContain('End with the camera facing the doorway.');
});

test('image-to-video camera movement is not opposed by a fixed composition instruction',()=>{
  const result=buildWanImageToVideoPrompts({instruction:'Move the camera around the subject.'});
  expect(result.positive).toContain('Allow framing and viewpoint to follow the requested camera movement.');
  expect(result.positive).not.toContain('lighting, and composition.');
});

test.each(['flux2_klein_edit','qwen_reference'])('%s preserves numbered-reference instructions instead of creating a scene from DNA',promptStyle=>{
  const result=compileModelPrompts({dna:portrait(),promptStyle,workflowKind:'edit',promptFormat:'scene',editInstruction:'Use the outfit from image 2 on the person in image 1.'});
  expect(result.profile).toBe('reference-edit-instructions');
  expect(result.positive).toContain('Use the outfit from image 2 on the person in image 1.');
  expect(result.positive).not.toContain('navy pantsuit');expect(result.scenePlan).toBeUndefined();
});
