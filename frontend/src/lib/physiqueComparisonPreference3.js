import {regionFields} from '@/lib/physiqueStudio3';

// Copy only the chosen A/B region into the latest saved character record.
// The comparison DNA also carries its fixed test pose/camera; those are intentionally ignored.
export const preferredPhysiquePatch3=(character,candidateDna={},region)=>{
 const savedSubjects=Array.isArray(character?.subjects)?character.subjects:[];
 const base=savedSubjects[0]?.dna||character?.dna||{};
 const physique={...(base.physique||{})};
 const candidate= candidateDna?.physique||{};
 for(const key of regionFields(region)){
  if(Object.prototype.hasOwnProperty.call(candidate,key))physique[key]=candidate[key];
  else delete physique[key];
 }
 const dna={...base,physique};
 const patch={dna};
 if(savedSubjects.length)patch.subjects=savedSubjects.map((subject,index)=>index===0?{...subject,dna}:subject);
 return patch;
};
