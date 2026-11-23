import {compileModelPrompts} from './modelPromptCompilers';
import {comparisonIsControlled} from './physiqueComparison3';

export const comparisonDispatches=(plan,character,workflow)=>{
 if(!comparisonIsControlled(plan))throw new Error('Comparison settings must match.');
 if(!character?.id)throw new Error('Select a saved character.');
 if(!workflow?.id||!['image','pony'].includes(workflow.kind))throw new Error('Select an image generation workflow.');
 if(!plan.changes?.length)throw new Error('Change a physique setting before comparing.');
 if(!Number.isSafeInteger(plan.fixed.seed)||plan.fixed.seed<0)throw new Error('Enter a valid nonnegative integer seed.');
 const originalSubjects=character.subjects||[];
 return plan.frames.map(frame=>{
  const original=originalSubjects[0]?.dna||character.dna||{};
  const physique={...original.physique,...frame.dna};
  const dna={...original,physique,pose:{...original.pose,action:frame.pose,angle:frame.subjectView},camera:{...original.camera,angle:frame.cameraAngle}};
  const subjects=originalSubjects.map((subject,index)=>index===0?{...subject,dna}:{...subject});
  const compiled=compileModelPrompts({
   promptStyle:workflow.prompt_style,workflowKind:workflow.kind,workflowName:workflow.name,
   promptFormat:'detailed',dna,subjects,isMulti:subjects.length>1,
   raunch:character.raunch||0,fieldLocks:character.field_locks||{},sectionLocks:character.locks||{}
  });
  return {character_id:character.id,dna,subjects,workflow_id:workflow.id,workflow_type:workflow.kind,seed:frame.seed,
   prompt_positive:compiled.positive,prompt_negative:compiled.negative};
 });
};
