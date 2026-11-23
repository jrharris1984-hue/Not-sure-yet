// 3.0 shot-plan draft model. Pure functions: no API or persistence changes.
export const SHOT_PLAN_VERSION = 1;
export const createShotPlan = ({template, count=6, characterId=null}={}) => {
  const total=Math.max(1,Math.min(48,Math.trunc(Number(count)||6)));
  return {
    version:SHOT_PLAN_VERSION,
    characterId,
    templateId:template?.id||null,
    shots:Array.from({length:total},(_,index)=>({
      id:`shot-${index+1}`,
      enabled:true,
      label:`Shot ${index+1}`,
      pose:null,
      subjectView:null,
      cameraAngle:template?.camera?.angle||null,
      lens:template?.camera?.lens||null,
      outfit:template?.outfit||null,
      scene:{...(template?.scene||{})},
      lighting:{...(template?.lighting||{})},
    })),
  };
};
export const updateShot=(plan,id,patch)=>({...plan,shots:plan.shots.map(shot=>shot.id===id?{...shot,...patch,scene:patch.scene?{...shot.scene,...patch.scene}:shot.scene,lighting:patch.lighting?{...shot.lighting,...patch.lighting}:shot.lighting}:shot)});
export const reorderShot=(plan,from,to)=>{
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=plan.shots.length||to>=plan.shots.length)return plan;
  const shots=[...plan.shots];const [shot]=shots.splice(from,1);shots.splice(to,0,shot);return {...plan,shots};
};
export const duplicateShot=(plan,id)=>{
  const index=plan.shots.findIndex(s=>s.id===id);if(index<0)return plan;
  const shots=[...plan.shots];const source=shots[index];
  const nextId=`shot-${Math.max(0,...shots.map(s=>Number(s.id.match(/^shot-([0-9]+)$/)?.[1])||0))+1}`;
  shots.splice(index+1,0,{...source,id:nextId,label:`${source.label} copy`,scene:{...source.scene},lighting:{...source.lighting}});
  return {...plan,shots};
};
export const activeShots=plan=>plan.shots.filter(shot=>shot.enabled);
