import {rearSubjectView,subjectOrientationDirective} from './cameraViewChoices';
export const shotOrientationWarning=(shot,prompt='')=>{
  const requested=shot?.subjectView;
  if(!requested)return null;
  const directive=subjectOrientationDirective(requested);
  if(!directive)return null;
  const normalized=String(prompt).toLowerCase();
  if(rearSubjectView(requested) && /(?:required view[^.;]*front view|primary composition[^.;]*face clearly visible|subject facing the camera)/i.test(prompt)) return 'Conflicting face-forward language detected for a rear-view shot.';
  if(!normalized.includes('behind the subject') && rearSubjectView(requested))return 'Rear orientation is missing from the compiled prompt.';
  return null;
};
export const validateShotFrames=(plan,frames)=>{
  const enabled=plan.shots.filter(s=>s.enabled);
  const errors=[];
  if(!enabled.length)errors.push('Enable at least one shot.');
  if(enabled.length!==frames.length)errors.push('Enabled shot count does not match compiled frames.');
  enabled.forEach((shot,i)=>{
    const frame=frames[i];
    if(!frame)return;
    const warning=shotOrientationWarning(shot,frame.prompt_positive);
    if(warning)errors.push(`${shot.label}: ${warning}`);
    if(shot.subjectView && frame.pose_overrides?.angle!==shot.subjectView)errors.push(`${shot.label}: subject orientation override was lost.`);
    if(shot.cameraAngle && frame.camera_overrides?.angle!==shot.cameraAngle)errors.push(`${shot.label}: camera elevation override was lost.`);
  });
  return errors;
};
