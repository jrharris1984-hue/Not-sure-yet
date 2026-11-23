// Stable guided navigation model shared by desktop and mobile.
export const STUDIO3_STEPS=[
 {id:'start',label:'Start'},
 {id:'character',label:'Character'},
 {id:'look',label:'Wardrobe & Scene'},
 {id:'camera',label:'Camera & Pose'},
 {id:'review',label:'Review'},
 {id:'generate',label:'Generate'},
 {id:'results',label:'Results'}
];
export const nextStudio3Step=(id,direction=1)=>{
 const i=STUDIO3_STEPS.findIndex(s=>s.id===id);
 return STUDIO3_STEPS[Math.max(0,Math.min(STUDIO3_STEPS.length-1,(i<0?0:i)+direction))].id;
};
