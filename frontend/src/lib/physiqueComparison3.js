import {regionFields,physiqueRegionDifferences} from './physiqueStudio3';

// A/B comparison recipes share all settings except the selected physique region.
// These are planning records, not ComfyUI jobs.
export const buildPhysiqueComparison=({baseline={},candidate={},region='Hips',seed=12345,workflowId='',pose='standing',subjectView='front',cameraAngle='eye-level'}={})=>{
 const changes=physiqueRegionDifferences(baseline,candidate,region);
 const fixed={seed:Number(seed),workflowId,pose,subjectView,cameraAngle};
 const a={...candidate};
 for(const key of regionFields(region)){
   if(Object.prototype.hasOwnProperty.call(baseline,key))a[key]=baseline[key];
   else delete a[key];
 }
 return {
   version:1,region,fixed,changes,
   frames:[
     {id:'A',label:'Baseline',dna:a,...fixed},
     {id:'B',label:'Modified',dna:{...candidate},...fixed},
   ],
 };
};
export const comparisonIsControlled=plan=>{
 const [a,b]=plan.frames||[];
 return Boolean(a&&b&&a.seed===b.seed&&a.workflowId===b.workflowId&&a.pose===b.pose&&a.subjectView===b.subjectView&&a.cameraAngle===b.cameraAngle);
};
