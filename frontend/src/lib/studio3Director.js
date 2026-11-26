// Editable director proposals. No network calls or automatic generation.
export const directorPlan3=({description='',shotCount=6,characterId=null}={})=>{
 const count=Math.min(120,Math.max(1,Math.trunc(Number(shotCount)||6)));
 return {version:1,characterId,brief:String(description).trim(),status:'draft',shots:Array.from({length:count},(_,i)=>({
 id:'director-'+(i+1),label:'Shot '+(i+1),prompt:'',pose:null,subjectView:null,cameraAngle:null,scene:{},lighting:{},wardrobe:{}
 }))};
};
export const directorApplySuggestion3=(plan,id,patch={})=>({...plan,shots:plan.shots.map(s=>s.id===id?{...s,...patch,scene:{...s.scene,...patch.scene},lighting:{...s.lighting,...patch.lighting},wardrobe:{...s.wardrobe,...patch.wardrobe}}:s)});


// Adapt the existing validated shoot-plan payload to Studio 3's editable shot cards.
export const directorFrameFromShot3=shot=>({
 pose_action:shot.pose||'',framing:shot.framing||'',view:shot.subjectView||'',camera_height:shot.cameraAngle||'',expression:shot.expression||'',lens:shot.lens||'',
 outfit_preset:shot.outfit||'',outfit_color:'',lighting_source:shot.lighting?.source||shot.lighting?.style||'',lighting_temperature:shot.lighting?.color_temp||'',
 environment:shot.scene?.environment||'',background:shot.scene?.background||'',
 coverage:shot.coverage||'',wardrobe_action:shot.wardrobeAction||'',
 foot_direction:shot.feet?[shot.feet.composition_mode,shot.feet.hosiery,shot.feet.skin_finish,shot.feet.foot_pose].filter(Boolean).join(', '):''
});

export const directorFramesFromPlan3=plan=>(plan?.shots||[]).filter(shot=>shot.enabled).map(directorFrameFromShot3);

// Keep each request within the current AI endpoint limit while respecting the
// storyboard chapter order. Long chapters split into consecutive batches.
export function directorPlanningBatches3(plan,indexes,maxBatchSize=20){
 const limit=Math.max(1,Math.min(20,Math.trunc(Number(maxBatchSize)||20)));
 const source=Array.isArray(indexes)?indexes:(plan?.shots||[]).map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
 const batches=[];
 let current=null;
 source.forEach(index=>{
  const shot=plan?.shots?.[index];if(!shot)return;
  const chapter=shot.chapter||'All shots';
  if(!current||current.chapter!==chapter||current.indexes.length>=limit){
   current={chapter,indexes:[]};batches.push(current);
  }
  current.indexes.push(index);
 });
 return batches;
}

export function directorContinuityNotes3(plan,shotIndexes){
 const shots=(shotIndexes||[]).map(index=>({index,shot:plan?.shots?.[index]})).filter(item=>item.shot);
 return shots.map(({index,shot})=>[
  `Shot ${index+1}`,
  shot.pose&&`pose: ${shot.pose}`,
  shot.subjectView&&`view: ${shot.subjectView}`,
  shot.cameraAngle&&`camera: ${shot.cameraAngle}`,
  shot.framing&&`framing: ${shot.framing}`,
  shot.lens&&`lens: ${shot.lens}`,
  shot.coverage&&`coverage: ${shot.coverage}`,
  shot.wardrobeAction&&`wardrobe direction: ${shot.wardrobeAction}`,
  shot.feet&&`foot styling: ${[shot.feet.composition_mode,shot.feet.hosiery,shot.feet.skin_finish,shot.feet.foot_pose].filter(Boolean).join(', ')}`,
  shot.outfit&&`look: ${shot.outfit}`,
  shot.scene?.environment&&`set: ${shot.scene.environment}`,
  shot.lighting?.style&&`light: ${shot.lighting.style}`,
 ].filter(Boolean).join('; ')).join('\n');
}

export const directorFramesToPlan3=(plan,frames,{shotIndexes,choices={}}={})=>{
 if(!plan?.shots||!Array.isArray(frames))return plan;
 const indexes=Array.isArray(shotIndexes)?shotIndexes:plan.shots.map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
 const replacements=new Map();
 indexes.forEach((index,frameIndex)=>{
  const frame=frames[frameIndex];if(!plan.shots[index]||!frame||typeof frame!=='object')return;
  const patch={};
  if(choices.poses?.includes(frame.pose_action))patch.pose=frame.pose_action;
  if(choices.framings?.includes(frame.framing))patch.framing=frame.framing;
  if(choices.views?.includes(frame.view))patch.subjectView=frame.view;
  if(choices.cameras?.includes(frame.camera_height))patch.cameraAngle=frame.camera_height;
  if(choices.expressions?.includes(frame.expression))patch.expression=frame.expression;
  if(choices.lenses?.includes(frame.lens))patch.lens=frame.lens;
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
