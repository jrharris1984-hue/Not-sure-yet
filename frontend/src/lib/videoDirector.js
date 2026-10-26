export const VIDEO_CAMERA = {
  '':'Use the existing camera direction', static:'Keep the camera stationary.',
  follow:'Track the subject smoothly while maintaining the selected framing.',
  push_in:'Move the camera slowly closer to the subject.', pull_back:'Move the camera slowly away from the subject.',
  pan_left:'Pan the camera slowly to the left.', pan_right:'Pan the camera slowly to the right.',
};
export const VIDEO_PACING = {'':'Use the described pace',slow:'The movement is slow and deliberate.',natural:'The movement has natural, unhurried timing.',brisk:'The movement is brisk and controlled.'};
export const VIDEO_DIRECTOR_DEFAULTS = {enabled:false,start:'',action:'',end:'',camera:'',pace:'',continuity:'',audio:''};
export function normalizeVideoDirector(value = {}) {
  const source=value && typeof value==='object'?value:{};
  const result={...VIDEO_DIRECTOR_DEFAULTS,enabled:source.enabled===true};
  for(const key of ['start','action','end','continuity','audio'])result[key]=typeof source[key]==='string'?source[key].slice(0,800):'';
  result.camera=Object.hasOwn(VIDEO_CAMERA,source.camera)?source.camera:'';
  result.pace=Object.hasOwn(VIDEO_PACING,source.pace)?source.pace:'';
  return result;
}
export function supportsVideoAudio(workflow) {
  if (workflow?.prompt_style !== 'ltx_t2v') return false;
  try {
    const nodes=Object.values(JSON.parse(workflow.json_str));
    return nodes.some(node=>node.class_type==='LTXVAudioVAEDecode') &&
      nodes.some(node=>node.class_type==='CreateVideo' && Array.isArray(node.inputs?.audio));
  } catch {return false;}
}
const sentence=text=>{const value=String(text || '').trim();return value?value+(/[.!?]$/.test(value)?'':'.'):'';};
export function compileVideoDirection({director,notes='',workflow} = {}) {
  const d=normalizeVideoDirector(director);
  if (!d.enabled) return notes;
  // Camera/pace alone must not satisfy the required action/description check.
  if (![d.start,d.action,d.end,notes].some(value=>String(value).trim())) return '';
  return [
    d.start.trim() && sentence(`At the start, ${d.start.trim()}`),
    d.action.trim() && sentence(`${d.start.trim()?'Then, ':''}${d.action.trim()}`),
    d.end.trim() && sentence(`By the end, ${d.end.trim()}`),
    d.camera && VIDEO_CAMERA[d.camera], d.pace && VIDEO_PACING[d.pace],
    d.continuity.trim() && sentence(`Keep these details consistent unless explicitly changed by the action: ${d.continuity.trim()}`),
    sentence(notes),
    supportsVideoAudio(workflow) && d.audio.trim() && sentence(`Audio: ${d.audio.trim()}`),
  ].filter(Boolean).join(' ');
}
