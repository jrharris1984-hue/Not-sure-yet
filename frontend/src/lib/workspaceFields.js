import { SECTIONS } from './dna';
import { editWardrobeField, wardrobeFieldDisabled } from './wardrobeMode';
import { SIZE_CONTROL_PAIRS } from './physiqueControlPriority';

export const BODY_GROUPS = [
  {key:'build',label:'Build',fields:['height','body_type','muscularity','shoulders','legs','proportions']},
  {key:'bust',label:'Bust',fields:['bust','bust_scale','bust_shape','implant_volume']},
  {key:'glutes',label:'Glutes',fields:['butt','butt_scale','glute_shape']},
  {key:'waist',label:'Waist & hips',fields:['waist','waist_scale','hips','hip_scale']},
  {key:'thighs',label:'Thighs',fields:['thighs','thigh_scale']},
];
export const workspaceSection = key => SECTIONS.find(section=>section.key===key);
export function workspaceFieldPatch(person,section,field,value) {
  const current=person.dna[section] || {};
  if(section==='wardrobe')return editWardrobeField(current,field,value);
  const next={...current,[field]:value};
  if(section==='physique') {
    if(SIZE_CONTROL_PAIRS[field]) {
      next[SIZE_CONTROL_PAIRS[field][0]]=0;
      next[`${field}_control_mode`]='preset';
      if(field==='bust')next.implant_volume=0;
    }
    const preset=Object.keys(SIZE_CONTROL_PAIRS).find(key=>SIZE_CONTROL_PAIRS[key][0]===field);
    if(preset){next[`${preset}_control_mode`]=Number(value)>0?'slider':'preset';if(preset==='bust' && Number(value)>0)next.implant_volume=0;}
    if(field==='implant_volume' && Number(value)>0){next.bust_scale=0;next.bust_control_mode='implant';}
    if(field==='bust_shape')next.implant_volume=0;
  }
  return next;
}
export function workspaceFieldLocked(person,section,field,value) {
  if(person.locks?.[section] || person.field_locks?.[section]?.[field])return true;
  // Mode and paired size transitions must not overwrite a different locked field.
  const patch=workspaceFieldPatch(person,section,field,value);
  return Object.entries(patch).some(([key,next])=>key!==field && person.field_locks?.[section]?.[key] && next!==person.dna[section]?.[key]);
}
export function updateWorkspaceField(person,section,field,value) {
  if(workspaceFieldLocked(person,section,field,value))return person;
  return {...person,dna:{...person.dna,[section]:workspaceFieldPatch(person,section,field,value)}};
}
export {wardrobeFieldDisabled};
