import {workflowSampling,prepareStudioSurprise} from './studioGeneration';
import {DEFAULT_DNA} from './dna';
const workflow=inputs=>({kind:'image',json_str:JSON.stringify({one:{class_type:'KSampler',inputs}})});
test('sampling shortcuts preserve each graph recipe without inventing canvas settings',()=>{
  expect(workflowSampling(workflow({steps:6,cfg:2.7,sampler_name:'euler_ancestral',scheduler:'simple'}))).toEqual({steps:6,cfg:2.7,sampler:'euler_ancestral',scheduler:'simple'});
  expect(workflowSampling(workflow({steps:40,cfg:4,sampler_name:'er_sde',scheduler:'simple'})).steps).toBe(40);
});
test('unsupported graphs and unresolved node links are excluded rather than guessed',()=>{
  expect(workflowSampling({kind:'video',json_str:'{}'})).toBeNull();
  expect(workflowSampling({kind:'image',json_str:'invalid'})).toBeNull();
  expect(workflowSampling(workflow({steps:['node',0],cfg:1,sampler_name:'euler',scheduler:'simple'}))).toBeNull();
  expect(workflowSampling({kind:'image',json_str:JSON.stringify({a:{class_type:'KSampler'},b:{class_type:'KSampler'}})})).toBeNull();
});
test('surprise preserves people, clothing, locks and source data',()=>{
  const original=[{id:'a',label:'A',dna:JSON.parse(JSON.stringify(DEFAULT_DNA)),field_locks:{camera:{lens:true}}}];
  original[0].dna.scene.extra='Keep my custom setting note';
  const before=JSON.parse(JSON.stringify(original));
  for(let i=0;i<30;i++){
    const result=prepareStudioSurprise(original,{pose:true});
    expect(result.subjects[0].dna.scene.extra).toBe(before[0].dna.scene.extra);
    expect(result.subjects[0].dna.identity).toEqual(before[0].dna.identity);
    expect(result.subjects[0].dna.wardrobe).toEqual(before[0].dna.wardrobe);
    expect(result.subjects[0].dna.pose).toEqual(before[0].dna.pose);
    expect(result.subjects[0].dna.camera.lens).toBe(before[0].dna.camera.lens);
  }
  expect(original).toEqual(before);
});
