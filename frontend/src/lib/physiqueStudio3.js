import {PHYSIQUE_DETAIL_GROUPS} from './physiqueDetails';
export const PHYSIQUE_REGIONS=[
 {name:'Breasts',key:'bust_scale',axis:'bust',max:2000},
 {name:'Hips',key:'hip_scale',axis:'hips',max:2000},
 {name:'Waist',key:'waist_scale',axis:null,max:500},
 {name:'Glutes',key:'butt_scale',axis:'butt',max:2000},
 {name:'Thighs',key:'thigh_scale',axis:'thighs',max:750},
 {name:'Shoulders',key:'shoulder_width',axis:null,max:100},
 {name:'Arms',key:'upper_arm_fullness',axis:null,max:100},
 {name:'Calves',key:'calf_fullness',axis:null,max:100},
 {name:'Torso & Frame',key:'torso_width',axis:null,max:100},
 {name:'Legs',key:'leg_length',axis:null,max:100},
 {name:'Neck',key:'neck_length',axis:null,max:100},
];
export const regionFields=name=>{
 const region=PHYSIQUE_REGIONS.find(r=>r.name===name);
 const detail=PHYSIQUE_DETAIL_GROUPS.find(g=>g.name===name);
 return [...new Set([region?.key,...(detail?.controls||[]).map(([key])=>key)].filter(Boolean))];
};
export const physiqueRegionSnapshot=(dna={},name)=>Object.fromEntries(regionFields(name).map(key=>[key,Number(dna[key]||0)]));
export const applyPhysiquePreset=(dna={},name,preset,fieldLocks={})=>{
 const region=PHYSIQUE_REGIONS.find(r=>r.name===name);
 if(!region)return {...dna};
 const configs={
  subtle:{volume:0.12,detail:25},
  balanced:{volume:0.3,detail:50},
  pronounced:{volume:0.55,detail:75},
  dramatic:{volume:0.8,detail:95},
 };
 const config=configs[preset];if(!config)return {...dna};
 const next={...dna};
 for(const key of regionFields(name)){
  if(fieldLocks[key])continue;
  next[key]=key===region.key?Math.round(region.max*config.volume):config.detail;
 }
 return next;
};
export const restorePhysiqueRegion=(dna={},baseline={},name,fieldLocks={})=>{
 const next={...dna};
 for(const key of regionFields(name)){
  if(fieldLocks[key])continue;
  if(Object.prototype.hasOwnProperty.call(baseline,key))next[key]=baseline[key];
  else delete next[key];
 }
 return next;
};
export const physiqueRegionDifferences=(baseline={},current={},name)=>regionFields(name).filter(key=>Number(baseline[key]||0)!==Number(current[key]||0)).map(key=>({key,before:Number(baseline[key]||0),after:Number(current[key]||0)}));
