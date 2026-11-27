import {workspaceWorkflows,workspacePrompt,workspacePayload,workspaceSubjects} from './workspaceGeneration';
import {previewPerson} from './workspacePreview';
const image={id:'image',name:'Krea 2',kind:'image',prompt_style:'krea2'};
const edit={id:'edit',name:'Qwen edit',kind:'edit',prompt_style:'qwen_edit'};
const values=()=>({mode:'character',workflow:image,people:[previewPerson()],relationship:'Choose later',shape:'Portrait',seed:'',prompt:{positive:'A portrait',negative:''}});

test('honors hidden workflows and excludes incompatible tools',()=>{
  expect(workspaceWorkflows([image,edit,{id:'video',kind:'video'}],{},'image')).toEqual([edit]);
  expect(workspaceWorkflows([image,edit],{builder_hidden_workflow_ids:['image']},'character')).toEqual([]);
});
test('uses the model-aware compiler and final assembly without mutating selected DNA',()=>{
  const v=values(),before=JSON.stringify(v.people);
  const prompt=workspacePrompt({...v,description:'',instruction:'',negative:'watermark'});
  expect(prompt.positive.length).toBeGreaterThan(50);expect(prompt.negative).toContain('watermark');
  expect(prompt.assembly.compiler).toBe('krea2');expect(JSON.stringify(v.people)).toBe(before);
});
test('description scene choice is included while an unselected scene leaves the words alone',()=>{
  const v=values();v.people[0].dna.scene.environment='beach';
  const prompt=workspacePrompt({...v,mode:'describe',description:'A sailboat',sceneName:'Coastal daylight'});
  expect(prompt.positive).toContain('A sailboat');expect(prompt.positive).toContain('Setting: beach');
  expect(workspacePrompt({...v,mode:'describe',description:'A sailboat'}).positive).not.toContain('Setting:');
});
test('payload validates seeds and references, keeps workflow sampling defaults and edit preservation',()=>{
  const v=values();expect(()=>workspacePayload({...v,seed:'1.2'})).toThrow('seed');
  expect(()=>workspacePayload({...v,mode:'image',workflow:edit})).toThrow('starting image');
  expect(workspacePayload(v)).toMatchObject({workflow_id:'image',width:768,height:1024,batch_size:1});
  expect(workspacePayload(v).steps).toBeUndefined();
  const result=workspacePayload({...v,mode:'image',workflow:edit,source:{name:'photo.png',subfolder:'references'}});
  expect(result).toMatchObject({reference_image:'references/photo.png',preserve_unmentioned:true,edit_instruction:'A portrait'});
  expect(result.width).toBeUndefined();
});
test('cast size matches the visible people and relationship does not leak after removing a person',()=>{
  const a=previewPerson();a.dna.scenario.cast_size='duo';a.dna.scenario.cast_type='twins';
  expect(workspaceSubjects([a],'Friends')[0].dna.scenario).toMatchObject({cast_size:'solo',cast_type:'none'});
  expect(workspaceSubjects([a,previewPerson()],'Friends')[0].dna.scenario.cast_type).toBe('best friends');
  const v=values();v.people=[previewPerson(),previewPerson()];
  const payload=workspacePayload(v);
  expect(payload).toMatchObject({batch_size:1});
  expect(payload.subjects).toHaveLength(2);
});
test('group pairing selections such as sisters and adult mother-daughter reach every subject and respect cast size',()=>{
  const cast=[previewPerson(),previewPerson(),previewPerson()];
  const family=workspaceSubjects(cast,'mother and daughter');
  expect(family.map(subject=>subject.dna.scenario)).toEqual(expect.arrayContaining([
    expect.objectContaining({cast_size:'trio',cast_type:'mother and daughter'}),
  ]));
  expect(family.every(subject=>subject.dna._catalogSelections.scenario.cast_type==='mother and daughter')).toBe(true);
  const sisters=workspaceSubjects(cast.slice(0,2),'sisters');
  expect(sisters[0].dna.scenario).toMatchObject({cast_size:'duo',cast_type:'sisters'});
  expect(workspaceSubjects([...cast,previewPerson()],'none')[0].dna.scenario.cast_size).toBe('foursome');
});
