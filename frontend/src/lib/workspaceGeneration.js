import { builderCatalogWorkflows } from './workflowCatalog';
import { compileModelPrompts, resolvePromptCompiler } from './modelPromptCompilers';
import { assembleFinalPrompts } from './finalPromptAssembly';
import { freeformPayload } from './freeformGeneration';
import { likenessOverrides } from '@/components/LikenessLoraPanel';

export function workspaceWorkflows(rows, settings, mode) {
  return builderCatalogWorkflows(rows, settings.default_workflow_id, '', settings.builder_hidden_workflow_ids)
    .filter(w => mode === 'image' ? w.kind === 'edit' : w.kind === 'image');
}
export function workspaceSubjects(people, relationship) {
  return people.map((person,index) => ({id:`person-${index+1}`,label:String.fromCharCode(65+index),
    dna:{...person.dna,scenario:{...person.dna.scenario,cast_size:people.length>1?'duo':'solo',cast_type:people.length>1?({Friends:'best friends',Colleagues:'colleagues'}[relationship] || 'none'):'none'}},
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
