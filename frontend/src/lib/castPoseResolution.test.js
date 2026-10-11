import {selectSharedCastPose, editCastPose, sharedCastPose, resolveCastPoses} from './castPoseResolution';
import {compileModelPrompts} from './modelPromptCompilers';
import {applyCharacterTypePreset, CHARACTER_TYPE_PRESETS} from './characterTypePresets';
import {auditSelectionPrompt} from './selectionPromptAudit';
const people = () => ['A','B'].map((label,index)=>({id:label,label,dna:{identity:{age:35+index,gender:index?'male':'female'},pose:{action:index?'sitting':'standing',hands:['behind back'],distance:index?'portrait':'full body',angle:index?'back':'front'},feet:{foot_pose:'tiptoe'},wardrobe:{bottom:'jeans'},camera:{angle:index?'low':'eye-level'}}}));
const catalog={sections:[]};
test('shared selection applies to both people, widens the shot and leaves unrelated data intact',()=>{
 const original=people(), before=JSON.stringify(original);
 const selected=selectSharedCastPose(original,'one seated and one standing');
 expect(selected.map(person=>person.dna.pose.action)).toEqual(['one seated and one standing','one seated and one standing']);
 expect(selected.every(person=>person.dna.pose.distance==='wide shot')).toBe(true);
 expect(selected[1].dna.identity).toEqual(original[1].dna.identity);
 expect(JSON.stringify(original)).toBe(before);
 expect(sharedCastPose(selected,catalog)).toBe('one seated and one standing');
});
test('editing an individual body pose clears the shared pose instead of emitting both',()=>{
 const selected=selectSharedCastPose(people(),'walking together');
 const edited=editCastPose(selected,'B',{...selected[1].dna.pose,action:'sitting'},catalog);
 expect(sharedCastPose(edited,catalog)).toBe('');
 expect(edited[0].dna.pose.action).toBe('');
 expect(edited[1].dna.pose.action).toBe('sitting');
 expect(edited[1].dna.pose._sharedPose).toBe('');
 expect(sharedCastPose(selected,catalog)).toBe('walking together');
});
test('changing framing on Subject B updates the single shared camera without changing body poses',()=>{
 const original=people();
 const edited=editCastPose(original,'B',{...original[1].dna.pose,distance:'waist-up',angle:'3/4'},catalog);
 expect(edited.map(person=>person.dna.pose.distance)).toEqual(['waist-up','waist-up']);
 expect(edited.map(person=>person.dna.pose.angle)).toEqual(['3/4','3/4']);
 expect(edited.map(person=>person.dna.pose.action)).toEqual(['standing','sitting']);
});
test('legacy shared poses suppress contradictory individual body and hand placement on a render copy',()=>{
 const original=people();original[0].dna.pose.action='holding hands';
 const resolved=resolveCastPoses(original,catalog);
 expect(resolved.sharedPose).toBe('holding hands');
 expect(resolved.subjects.every(person=>person.dna.pose.action==='' && person.dna.pose.hands.length===0)).toBe(true);
 expect(resolved.subjects[1].dna.pose.distance).toBe('full body');
 expect(resolved.subjects[1].dna.camera.angle).toBe('eye-level');
 expect(original[1].dna.pose.action).toBe('sitting');
});
test('mixed levels and movement widen a portrait; compatible pair portraits keep their crop',()=>{
 for(const action of ['walking together','one seated and one standing','seated together']) {
  const original=people();original[0].dna.pose={action,distance:'portrait'};
  const result=resolveCastPoses(original,catalog);
  expect(result.subjects.every(person=>person.dna.pose.distance==='wide shot')).toBe(true);
  expect(result.notes.some(note=>note.field==='distance')).toBe(true);
 }
 const original=people();original[0].dna.pose={action:'shoulder to shoulder',distance:'portrait'};
 expect(resolveCastPoses(original,catalog).subjects.every(person=>person.dna.pose.distance==='portrait')).toBe(true);
});
test.each(['standard','chroma','krea2','pony','sdxl','zimage','qwen_image','wan_t2v'])('%s emits the shared action once and preserves both identities',promptStyle=>{
 for(const promptFormat of ['detailed','compact']) {
  const selected=selectSharedCastPose(people(),'holding hands');
  const before=JSON.stringify(selected);
  const prompt=compileModelPrompts({subjects:selected,dna:selected[0].dna,promptStyle,promptFormat,promptCatalog:catalog});
  expect(prompt.positive.match(/holding hands/gi)).toHaveLength(1);
  expect(prompt.positive).not.toMatch(/hands behind back|behind back|tiptoe/);
  expect(prompt.positive).toMatch(/35.year.old/);
  expect(prompt.positive).toMatch(/36.year.old/);
  expect(JSON.stringify(selected)).toBe(before);
  const audit=auditSelectionPrompt(prompt.positive,prompt.selectionManifest);
  expect(audit.rows.find(row=>row.key==='shared-pose').status).toBe('included');
 }
});
test('edited library wording keeps shared-pose behavior and custom shared composition survives exact pose imports',()=>{
 const edited={sections:[{key:'shared_poses',fields:[{key:'two_people',type:'pose_chips',options:[{value:'one seated and one standing',keywords:'PAIR_MARKER',group:'Seated & mixed levels'}]}]},{key:'pose',exact_fields:true,fields:[{key:'distance',type:'chips',options:[{value:'portrait',keywords:'PORTRAIT_MARKER'}]}]}]};
 const selected=selectSharedCastPose(people(),'PAIR_MARKER');selected[0].dna.pose.distance='portrait';
 const prompt=compileModelPrompts({subjects:selected,dna:selected[0].dna,promptStyle:'chroma',promptCatalog:edited});
 expect(prompt.positive).toContain('PAIR_MARKER');
 expect(prompt.positive).not.toContain('PORTRAIT_MARKER');
});

test('a character type change retains a custom shared pose and batch pose changes retain shared ownership',()=>{
 const selected=selectSharedCastPose(people(),'CUSTOM_PAIR_MARKER');
 const revised=selected.map(subject=>({...subject,dna:applyCharacterTypePreset(subject.dna,CHARACTER_TYPE_PRESETS[0])}));
 expect(sharedCastPose(revised,catalog)).toBe('CUSTOM_PAIR_MARKER');
 const batch=revised.map(subject=>({...subject,dna:{...subject.dna,pose:{...subject.dna.pose,action:'BATCH_PAIR_MARKER'}}}));
 expect(sharedCastPose(batch,catalog)).toBe('BATCH_PAIR_MARKER');
});
test('a shared interaction prevents an old foot-only crop from hiding the cast',()=>{
 const selected=selectSharedCastPose(people(),'holding hands');
 selected[0].dna.feet={composition_mode:'feet focus',framing:'sole close-up'};
 selected[0].dna.pose={...selected[0].dna.pose,focus:'feet',distance:'detail shot'};
 const resolved=resolveCastPoses(selected,catalog);
 expect(resolved.subjects.every(subject=>subject.dna.pose.distance==='wide shot' && subject.dna.pose.focus==='full frame')).toBe(true);
 const prompt=compileModelPrompts({subjects:selected,dna:selected[0].dna,promptStyle:'chroma',promptCatalog:catalog});
 expect(prompt.positive).toContain('holding hands');
 expect(prompt.positive).not.toContain('sole close-up');
});

test('reducing a shared cast to one person cannot retain a request for a partner',()=>{
 const selected=selectSharedCastPose(people(),'holding hands');
 for(const promptStyle of ['standard','chroma','krea2','pony','zimage']) {
  const result=compileModelPrompts({subjects:[selected[0]],dna:selected[0].dna,promptStyle,promptCatalog:catalog,promptFormat:'compact'});
  expect(result.positive).not.toContain('holding hands');
 }
 expect(selected[0].dna.pose.action).toBe('holding hands');
});

test('the selection audit labels replaced framing as inactive rather than claiming the saved crop was emitted',()=>{
 const selected=selectSharedCastPose(people(),'one seated and one standing');
 selected[0].dna.pose.distance='portrait';
 const prompt=compileModelPrompts({subjects:selected,dna:selected[0].dna,promptStyle:'chroma',promptCatalog:catalog});
 const audit=auditSelectionPrompt(prompt.positive,prompt.selectionManifest);
 const crop=audit.rows.find(row=>row.subjectLabel==='A' && row.section==='pose' && row.field==='distance');
 expect(crop.status).toBe('inactive');
 expect(crop.reason).toContain('wide shot');
});
