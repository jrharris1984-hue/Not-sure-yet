import {compileModelPrompts} from './modelPromptCompilers';
const portrait = () => ({identity:{age:40,gender:'female'},hair:{color:'silver'},wardrobe:{outfit_mode:'full',outfit_set:'navy pantsuit with white blouse'},pose:{action:'standing with ankles crossed',distance:'full body'},scene:{environment:'photography studio'},lighting:{source:'softbox'}});

test.each(['detailed','compact','scene','ollama'])('%s includes immutable resolved intentions without inventing missing camera settings',promptFormat=>{
  const dna=portrait(),before=JSON.stringify(dna);
  const result=compileModelPrompts({dna,promptFormat,promptStyle:'chroma'});
  expect(result.sceneReview).toMatchObject({version:1,task:'text-to-image',subject_count:1,missing:['camera']});
  expect(JSON.stringify(result.sceneReview.sections)).toContain('navy pantsuit');
  expect(JSON.stringify(result.sceneReview.sections)).toContain('softbox');
  expect(JSON.stringify(dna)).toBe(before);
  dna.wardrobe.outfit_set='gray suit';
  expect(JSON.stringify(result.sceneReview)).not.toContain('gray suit');
});
test('each batch gets its own pose snapshot without changing an earlier review',()=>{
  const first=portrait(),second=portrait();second.pose.action='sitting on a bench';
  const a=compileModelPrompts({dna:first,promptStyle:'kroma'}).sceneReview;
  const b=compileModelPrompts({dna:second,promptStyle:'kroma'}).sceneReview;
  expect(JSON.stringify(a)).toContain('ankles crossed');
  expect(JSON.stringify(a)).not.toContain('sitting on a bench');
  expect(JSON.stringify(b)).toContain('sitting on a bench');
});
test('cast members retain distinct outfits in the saved intentions',()=>{
  const a=portrait(),b=portrait();b.wardrobe.outfit_set='gray suit';
  const review=compileModelPrompts({subjects:[{label:'A',dna:a},{label:'B',dna:b}],promptStyle:'chroma'}).sceneReview;
  expect(review.subject_count).toBe(2);
  expect(review.sections[0].label).toBe('Subject A');
  expect(review.sections[0].details.join(' ')).toContain('navy pantsuit');
  expect(review.sections[1].label).toBe('Subject B');
  expect(review.sections[1].details.join(' ')).toContain('gray suit');
});
test('text-to-video review retains the requested temporal action',()=>{
  const review=compileModelPrompts({dna:portrait(),promptStyle:'wan_t2v',workflowKind:'text_video',videoInstruction:'The subject waves.'}).sceneReview;
  expect(review.task).toBe('text-to-video');
  expect(JSON.stringify(review.sections)).toContain('The subject waves.');
});
test.each(['qwen_edit','flux2_klein_edit','qwen_reference','wan_i2v'])('%s never invents scene intentions from unused DNA',promptStyle=>{
  expect(compileModelPrompts({dna:portrait(),promptStyle,editInstruction:'Change the wall to blue',videoInstruction:'Pan slowly'}).sceneReview).toBeUndefined();
});

test('shared cast pose is retained after individual actions are resolved away',()=>{
  const a=portrait(), b=portrait();
  for (const dna of [a,b]) {dna.pose.action='standing side by side';dna.pose._sharedPose='standing side by side';}
  const review=compileModelPrompts({subjects:[{label:'A',dna:a},{label:'B',dna:b}],promptStyle:'chroma'}).sceneReview;
  expect(review.sections.find(section=>section.label==='Shared scene').details).toContain('Shared pose: standing side by side');
  expect(review.adjustments.join(' ')).toContain('individual pose instructions are inactive');
});
