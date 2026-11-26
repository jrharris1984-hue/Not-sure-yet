// Editable director proposals. No network calls or automatic generation.
export const directorPlan3=({description='',shotCount=6,characterId=null}={})=>{
 const count=Math.min(120,Math.max(1,Math.trunc(Number(shotCount)||6)));
 return {version:1,characterId,brief:String(description).trim(),status:'draft',shots:Array.from({length:count},(_,i)=>({
 id:'director-'+(i+1),label:'Shot '+(i+1),prompt:'',pose:null,subjectView:null,cameraAngle:null,scene:{},lighting:{},wardrobe:{}
 }))};
};
export const directorApplySuggestion3=(plan,id,patch={})=>({...plan,shots:plan.shots.map(s=>s.id===id?{...s,...patch,scene:{...s.scene,...patch.scene},lighting:{...s.lighting,...patch.lighting},wardrobe:{...s.wardrobe,...patch.wardrobe}}:s)});


// Adapt the existing validated shoot-plan payload to Studio 3's editable shot cards.
export const directorFramesFromPlan3=plan=>(plan?.shots||[]).filter(shot=>shot.enabled).map(shot=>({
 pose_action:shot.pose||'',framing:'',view:shot.subjectView||'',camera_height:shot.cameraAngle||'',expression:'',
 outfit_preset:shot.outfit||'',outfit_color:'',lighting_source:shot.lighting?.source||'',lighting_temperature:shot.lighting?.color_temp||'',
 environment:shot.scene?.environment||'',background:shot.scene?.background||''
}));

export const directorFramesToPlan3=(plan,frames,{shotIndexes,choices={}}={})=>{
 if(!plan?.shots||!Array.isArray(frames))return plan;
 const indexes=Array.isArray(shotIndexes)?shotIndexes:plan.shots.map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
 const replacements=new Map();
 indexes.forEach((index,frameIndex)=>{
  const frame=frames[frameIndex];if(!plan.shots[index]||!frame||typeof frame!=='object')return;
  const patch={};
  if(choices.poses?.includes(frame.pose_action))patch.pose=frame.pose_action;
  if(choices.views?.includes(frame.view))patch.subjectView=frame.view;
  if(choices.cameras?.includes(frame.camera_height))patch.cameraAngle=frame.camera_height;
  if(choices.outfits?.includes(frame.outfit_preset))patch.outfit=frame.outfit_preset;
  const scene={};if(typeof frame.environment==='string'&&frame.environment.trim())scene.environment=frame.environment.trim();
  if(typeof frame.background==='string'&&frame.background.trim())scene.background=frame.background.trim();
  if(Object.keys(scene).length)patch.scene=scene;
  const lighting={};if(typeof frame.lighting_source==='string'&&frame.lighting_source.trim())lighting.source=frame.lighting_source.trim();
  if(typeof frame.lighting_temperature==='string'&&frame.lighting_temperature.trim())lighting.color_temp=frame.lighting_temperature.trim();
  if(Object.keys(lighting).length)patch.lighting=lighting;
  replacements.set(index,patch);
 });
 return {...plan,shots:plan.shots.map((shot,index)=>{
  const patch=replacements.get(index);if(!patch)return shot;
  return {...shot,...patch,scene:{...shot.scene,...patch.scene},lighting:{...shot.lighting,...patch.lighting}};
 })};
};
