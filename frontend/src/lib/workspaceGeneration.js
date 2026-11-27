import { builderCatalogWorkflows } from './workflowCatalog';
import { compileModelPrompts, resolvePromptCompiler } from './modelPromptCompilers';
import { assembleFinalPrompts } from './finalPromptAssembly';
import { freeformPayload } from './freeformGeneration';
import { likenessOverrides } from '@/components/LikenessLoraPanel';
import { skinAfterAgeChange } from './ageAppearance';

export function workspaceWorkflows(rows, settings, mode) {
  return builderCatalogWorkflows(rows, settings.default_workflow_id, '', settings.builder_hidden_workflow_ids)
    .filter(w => mode === 'image' ? w.kind === 'edit' : w.kind === 'image');
}
const FEATURE_LINKED_PAIRINGS=new Set(['twins','identical twins','triplets','sisters','mother and daughter']);
// Keep family resemblance editable as a group while leaving expression, hairstyle,
// and physique individual. Heritage and selected identifying traits stay aligned.
const RELATIONSHIP_FEATURE_FIELDS={identity:['ethnicity'],face:['eye_shape','eye_color','jawline','nose','lips'],hair:['color','texture'],skin:['tone']};
const adultAge=value=>Math.max(18,Math.min(80,Math.round(Number(value)||30)));
function ageFromRelationship(value,active,index,pairing) {
  const age=adultAge(value);
  if(['twins','identical twins','triplets'].includes(pairing))return age;
  if(pairing==='sisters') {
    const offset=i=>i===0?0:3+(i-1)*3;
    const base=age-offset(active);
    return adultAge(base+offset(index));
  }
  if(pairing==='mother and daughter') {
    const daughterOffset=i=>i===0?0:-23+Math.max(0,i-1)*3;
    const motherAge=active===0?age:age-daughterOffset(active);
    return adultAge(index===0?Math.max(40,motherAge):Math.max(21,motherAge-23+Math.max(0,index-1)*3));
  }
  return age;
}
function copyLinkedFeatures(source,target) {
  let next=target;
  for(const [section,fields] of Object.entries(RELATIONSHIP_FEATURE_FIELDS))for(const field of fields){
    if(next.locks?.[section] || next.field_locks?.[section]?.[field])continue;
    const value=source.dna?.[section]?.[field];if(value===undefined)continue;
    const sections={...(next.dna._catalogSelections || {})};
    const selections={...(sections[section] || {})};
    selections[field]=source.dna._catalogSelections?.[section]?.[field] ?? value;
    sections[section]=selections;
    next={...next,dna:{...next.dna,[section]:{...(next.dna[section] || {}),[field]:value},_catalogSelections:sections}};
  }
  return next;
}
export function editWorkspaceRelationshipFeature(people,relationship,active,section,field,value) {
  const person=people[active];if(!person)return people;
  const next=[...people];
  next[active]=updateWorkspaceField(person,section,field,value);
  if(!FEATURE_LINKED_PAIRINGS.has(relationship))return next;
  if(section==='identity' && field==='age') {
    for(let index=0;index<next.length;index++)if(index!==active) {
      const previousAge=adultAge(next[index].dna?.identity?.age);
      const nextAge=ageFromRelationship(next[active].dna.identity.age,active,index,relationship);
      const updated=updateWorkspaceField(next[index],'identity','age',nextAge);
      if(updated!==next[index])next[index]={...updated,dna:skinAfterAgeChange(updated.dna,previousAge)};
    }
    return next;
  }
  if(!RELATIONSHIP_FEATURE_FIELDS[section]?.includes(field))return next;
  for(let index=0;index<next.length;index++)if(index!==active)next[index]=copyLinkedFeatures(next[active],next[index]);
  return next;
}
export function applyWorkspaceRelationship(people, relationship) {
  if(!people.length)return people;
  const aliases={Friends:'best friends',Colleagues:'colleagues'};
  const pairing=aliases[relationship] || relationship || 'Choose later';
  const castSize=people.length===1?'solo':people.length===2?'duo':people.length===3?'trio':'foursome';
  const ageFor=(person,index)=>{
    const firstAge=adultAge(people[0]?.dna?.identity?.age);
    if(['twins','identical twins','triplets'].includes(pairing))return firstAge;
    if(pairing==='sisters')return index===0?firstAge:adultAge(firstAge+(firstAge<=77?3:-3)+(index>1?(index-1)*3:0));
    if(pairing==='mother and daughter'){
      const parentAge=index===0?Math.max(40,firstAge):firstAge;
      return index===0?adultAge(parentAge):adultAge(Math.max(21,parentAge-23+(index>1?(index-1)*3:0)));
    }
    return adultAge(person.dna?.identity?.age);
  };
  const resemblance=['twins','identical twins','triplets'].includes(pairing)?'matching faces':['sisters','mother and daughter'].includes(pairing)?'similar facial features':'individual faces';
  return people.map((person,index)=>{
    const previousAge=adultAge(person.dna?.identity?.age);
    const locks=person.field_locks || {};
    const ageLocked=!!person.locks?.identity || !!locks.identity?.age;
    const nextAge=ageLocked?previousAge:ageFor(person,index);
    let linked=person;
    if(index>0 && FEATURE_LINKED_PAIRINGS.has(pairing))linked=copyLinkedFeatures(people[0],person);
    let dna={...linked.dna,identity:{...linked.dna.identity,age:nextAge}};
    dna=skinAfterAgeChange(dna,previousAge);
    const scenario={...dna.scenario,cast_size:castSize,cast_type:people.length>1 && pairing!=='Choose later'?pairing:'none',cast_age_mode:'individual ages',cast_resemblance:resemblance};
    const selections={...(dna._catalogSelections || {}),scenario:{...(dna._catalogSelections?.scenario || {}),cast_size:castSize,cast_type:scenario.cast_type,cast_age_mode:'individual ages',cast_resemblance:resemblance}};
    return {...person,dna:{...dna,scenario,_catalogSelections:selections}};
  });
}
export function workspaceSubjects(people, relationship) {
  const castSize=people.length===1?'solo':people.length===2?'duo':people.length===3?'trio':'foursome';
  const explicitPairing=({Friends:'best friends',Colleagues:'colleagues'}[relationship] || (relationship && !['none','Choose later'].includes(relationship)?relationship:''));
  const pairing=people.length>1?(explicitPairing || people[0]?.dna?.scenario?.cast_type || 'none'):'none';
  return people.map((person,index) => ({id:`person-${index+1}`,label:String.fromCharCode(65+index),
    dna:{...person.dna,scenario:{...person.dna.scenario,cast_size:castSize,cast_type:pairing},_catalogSelections:{...(person.dna._catalogSelections || {}),scenario:{...(person.dna._catalogSelections?.scenario || {}),cast_size:castSize,cast_type:pairing}}},
    likeness:person.likeness,field_locks:person.field_locks || {}}));
}
export function workspacePrompt({mode,workflow,people,relationship,description,instruction,negative='',lora,settings={},sceneName}) {
  if(!workflow) return {positive:'',negative:''};
  const subjects=workspaceSubjects(people,relationship);
  const compiled=mode==='character' ? compileModelPrompts({promptFormat:'compact',promptCatalog:settings.prompt_catalog,
    promptStyle:workflow.prompt_style,workflowKind:workflow.kind,workflowName:workflow.name,
    dna:subjects[0].likeness?.enabled?{...subjects[0].dna,identity:{...subjects[0].dna.identity,name:''}}:subjects[0].dna,subjects:subjects.map(s=>s.likeness?.enabled?{...s,dna:{...s.dna,identity:{...s.dna.identity,name:''}}}:s),isMulti:subjects.length>1,fieldLocks:subjects[0].field_locks,sectionLocks:people[0].locks})
    : mode==='describe' ? freeformPayload({mode:'image',workflow,prompt:[description,...(sceneName && sceneName!=='Use current scene'?[`Setting: ${people[0].dna.scene?.environment}. Lighting: ${Object.values(people[0].dna.lighting || {}).join(', ')}.`]:[])].join(' '),negative,loras:[]}) : null;
  const positive=mode==='character'?compiled.positive:mode==='describe'?compiled.prompt_positive:instruction.trim();
  return assembleFinalPrompts({positive,negative:mode==='character'?[compiled.negative,negative].filter(Boolean).join(', '):mode==='describe'?compiled.prompt_negative:negative,
    compiler:resolvePromptCompiler({promptStyle:workflow.prompt_style,workflowKind:workflow.kind,workflowName:workflow.name}),
    negativeStrategy:compiled?.negativeStrategy || 'text',photographic:mode==='character',
    loraTriggers:[...(lora?.name?lora.triggerWords || []:[]),...subjects.filter(s=>mode==='character' && s.likeness?.enabled).map(s=>s.likeness.trigger || '')]});
}
export function workspacePayload({mode,workflow,people,relationship,prompt,shape,seed,source,lora}) {
  if(!workflow || !prompt.positive.trim()) throw new Error('Choose a workflow and complete your image description.');
  if(seed!=='' && (!Number.isSafeInteger(Number(seed)) || Number(seed)<0 || Number(seed)>2147483646)) throw new Error('Use a seed between 0 and 2147483646, or leave it blank.');
  if(mode==='image' && !source?.name) throw new Error('Choose a starting image.');
  if(lora?.name && mode!=='image')freeformPayload({mode:'image',workflow,prompt:prompt.positive,loras:[lora]});
  const subjects=mode==='character'?workspaceSubjects(people,relationship):[];
  return {workflow_id:workflow.id,workflow_type:workflow.kind,prompt_positive:prompt.positive,prompt_negative:prompt.negative,
    ...(subjects.length?{subjects,dna:subjects[0].dna,locks:people[0].locks,lora_overrides:likenessOverrides(subjects)}:{}),
    ...(mode==='image'?{reference_image:[source.subfolder,source.name].filter(Boolean).join('/'),edit_instruction:prompt.positive,preserve_unmentioned:true,operation:'edit'}:
      {width:shape==='Landscape'?1024:768,height:shape==='Portrait'?1024:768,batch_size:1}),
    ...(seed!==''?{seed:Number(seed)}:{}),
    selected_loras:lora?.name && mode!=='image'?[{name:lora.name,strength:lora.strength,triggers:lora.triggerWords || []}]:[]};
}
