import { DEFAULT_DNA, SECTIONS } from './dna';
import { HERITAGE_OUTFIT_GROUP } from './heritageStyling';
export const PREVIEW_FLOWS = {
  character: [{key:'person',label:'Person'},{key:'appearance',label:'Appearance'},{key:'outfit',label:'Outfit'},{key:'scene',label:'Scene'},{key:'review',label:'Review'}],
  describe: [{key:'description',label:'Describe'},{key:'scene',label:'Scene'},{key:'review',label:'Review'}],
  image: [{key:'source',label:'Image'},{key:'instruction',label:'Change'},{key:'review',label:'Review'}],
};
export const PREVIEW_SCENES = [
  {name:'Soft studio',description:'Plain background · soft light',scene:{environment:'studio',indoor_outdoor:'indoor',era:'contemporary'},lighting:{source:'softbox',direction:'side',mood:'soft',color_temp:'neutral',style:'high-key'}},
  {name:'City afternoon',description:'Street setting · natural light',scene:{environment:'urban street',indoor_outdoor:'outdoor',era:'contemporary'},lighting:{source:'natural',direction:'side',mood:'soft',color_temp:'neutral',style:'cinematic'}},
  {name:'Coastal daylight',description:'Beach setting · warm light',scene:{environment:'beach',indoor_outdoor:'outdoor',era:'contemporary'},lighting:{source:'natural',direction:'front',mood:'soft',color_temp:'warm',style:'cinematic'}},
];
export const PREVIEW_OUTFITS = HERITAGE_OUTFIT_GROUP.options.slice(0,3);
export const previewCopy = value => JSON.parse(JSON.stringify(value));
export function previewPerson(character) {
  const dna=previewCopy(character?.dna || character?.subjects?.[0]?.dna || DEFAULT_DNA);
  if(!character) {dna.identity={...dna.identity,age:30};dna.pose={...dna.pose,action:'standing',distance:'full body'};dna.style={...dna.style,render:'photorealistic'};}
  return {likeness:previewCopy(character?.subjects?.[0]?.likeness || {}),name:character?.name || 'New character',dna,thumbnail:character?.thumbnail || '',locks:character?.locks || {},field_locks:character?.field_locks || character?.subjects?.[0]?.field_locks || {}};
}
export function previewOptions(section,field) {
  const f=SECTIONS.find(s=>s.key===section)?.fields.find(f=>f.key===field);
  return [...new Set(f?.groups ? f.groups.flatMap(g=>g.options) : f?.options || [])].map(value=>({value,label:f?.optionLabels?.[value] || value}));
}
export function previewCanContinue(key,{description,instruction,image}) {
  if(key==='description')return !!description.trim();
  if(key==='source')return !!image;
  if(key==='instruction')return !!instruction.trim();
  return true;
}
