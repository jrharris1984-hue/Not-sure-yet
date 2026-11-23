// Editable director proposals. No network calls or automatic generation.
export const directorPlan3=({description='',shotCount=6,characterId=null}={})=>{
 const count=Math.min(48,Math.max(1,Math.trunc(Number(shotCount)||6)));
 return {version:1,characterId,brief:String(description).trim(),status:'draft',shots:Array.from({length:count},(_,i)=>({
 id:'director-'+(i+1),label:'Shot '+(i+1),prompt:'',pose:null,subjectView:null,cameraAngle:null,scene:{},lighting:{},wardrobe:{}
 }))};
};
export const directorApplySuggestion3=(plan,id,patch={})=>({...plan,shots:plan.shots.map(s=>s.id===id?{...s,...patch,scene:{...s.scene,...patch.scene},lighting:{...s.lighting,...patch.lighting},wardrobe:{...s.wardrobe,...patch.wardrobe}}:s)});
