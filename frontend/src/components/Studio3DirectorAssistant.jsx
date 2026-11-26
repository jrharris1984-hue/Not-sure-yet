import {useEffect,useRef,useState} from 'react';
import {endpoints} from '@/lib/api';
import {SHOT_CATALOG} from '@/lib/shootPlanner';
import {directorContinuityNotes3,directorFrameFromShot3,directorPlanningBatches3,directorFramesToPlan3} from '@/lib/studio3Director';
import {STUDIO3_CAMERAS,STUDIO3_POSES,STUDIO3_VIEWS} from '@/components/ShotStoryboard3';
import ShotStoryboard3 from '@/components/ShotStoryboard3';

const textToImageKinds=new Set(['image','txt2img','text_to_image']);
export default function Studio3DirectorAssistant({characterId,workflow,plan,lockScenario,outfitOptions=[],onApply}){
 const [brief,setBrief]=useState('');
 const [proposal,setProposal]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [warnings,setWarnings]=useState([]);
 const [completedIndexes,setCompletedIndexes]=useState([]);
 const [partial,setPartial]=useState(false);
 const [progress,setProgress]=useState(null);
 const requestId=useRef(0);
 const contextKey=`${characterId||''}|${workflow?.id||''}|${JSON.stringify(plan||{})}`;
 useEffect(()=>{
  requestId.current+=1;setProposal(null);setError('');setWarnings([]);setBusy(false);setCompletedIndexes([]);setPartial(false);setProgress(null);
  return()=>{requestId.current+=1;};
 },[contextKey]);
 const compatible=!!characterId&&!!workflow?.id&&textToImageKinds.has(workflow.kind);
 const enabledIndexes=(plan?.shots||[]).map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
 const canRequest=compatible&&!!brief.trim()&&enabledIndexes.length>0&&(plan?.shots?.length||0)<=120;
 const generate=async()=>{
  if(!canRequest)return;
  const id=++requestId.current;
  const resume=partial&&proposal;
  const startingPlan=proposal||plan;
  const requestedIndexes=(startingPlan?.shots||[]).map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
  const targetIndexes=resume?requestedIndexes.filter(index=>!completedIndexes.includes(index)):requestedIndexes;
  const batches=directorPlanningBatches3(startingPlan,targetIndexes,20);
  const alreadyCompleted=resume?completedIndexes:[];
  let workingPlan=startingPlan;
  let completed=[...alreadyCompleted];
  let nextWarnings=resume?[...warnings]:[];
  setBusy(true);setError('');setProgress({done:completed.length,total:requestedIndexes.length,chapter:'Preparing chapters'});
  if(!resume){setProposal(null);setCompletedIndexes([]);setWarnings([]);}
  try{
   let batchNumber=0;
   for(const batch of batches){
    batchNumber+=1;
    if(id!==requestId.current)return;
    const firstIndex=batch.indexes[0];
    const ordinal=requestedIndexes.indexOf(firstIndex)+1;
    const priorIndexes=requestedIndexes.filter(index=>index<firstIndex).slice(-3);
    const continuity=directorContinuityNotes3(workingPlan,priorIndexes).slice(-2300);
    setProgress({done:completed.length,total:requestedIndexes.length,chapter:batch.chapter,batch:batchNumber,batches:batches.length});
    const result=await endpoints.aiShootPlan({character_id:characterId,workflow_id:workflow.id,instruction:brief.trim(),count:batch.indexes.length,
     // The endpoint numbers cards per request; global position and continuity use separate fields.
     shot_numbers:batch.indexes.map((_,index)=>index+1),lock_scenario:!!lockScenario,catalog:SHOT_CATALOG,
     chapter:batch.chapter,chapter_position:ordinal,total_shots:requestedIndexes.length,continuity_context:continuity,
     current_frames:batch.indexes.map(index=>directorFrameFromShot3(workingPlan.shots[index]))});
    if(id!==requestId.current)return;
    if(!Array.isArray(result?.frames)||result.frames.length!==batch.indexes.length)throw new Error(`The assistant returned an incomplete plan for ${batch.chapter}. The completed chapters are saved as a draft.`);
    workingPlan=directorFramesToPlan3(workingPlan,result.frames,{shotIndexes:batch.indexes,choices:{poses:STUDIO3_POSES,views:STUDIO3_VIEWS,cameras:STUDIO3_CAMERAS,framings:SHOT_CATALOG.framing,expressions:SHOT_CATALOG.expression,lenses:SHOT_CATALOG.lens,outfits:outfitOptions}});
    completed=[...new Set([...completed,...batch.indexes])];
    nextWarnings=[...new Set([...nextWarnings,...(result.warnings||[])])];
    setProposal(workingPlan);setCompletedIndexes(completed);setWarnings(nextWarnings);
    setProgress({done:completed.length,total:requestedIndexes.length,chapter:batch.chapter,batch:batchNumber,batches:batches.length});
   }
   if(id!==requestId.current)return;
   setProposal(workingPlan);setCompletedIndexes(requestedIndexes);setPartial(false);
  }catch(e){if(id===requestId.current){setPartial(completed.length>0);setError(e?.response?.data?.detail||e.message||'Could not draft the shot plan. Check the assistant settings and try again.');}}
  finally{if(id===requestId.current){setBusy(false);setProgress(null);}}
 };
 return <section className="pane p-4 space-y-3" aria-label="AI Creative Director" data-testid="studio3-ai-director">
  <div><h3 className="font-semibold">AI Creative Director</h3><p className="text-xs text-zinc-400">Ask the configured assistant for structured suggestions. Long shoots are planned chapter by chapter, with preceding shots carried forward for continuity. Review and edit the draft before applying it; planning does not render images.</p></div>
  <label className="block text-sm">Shoot brief<textarea value={brief} maxLength={3000} rows={3} onChange={event=>setBrief(event.target.value)} placeholder="A warm editorial shoot in a loft, with varied poses and camera angles." className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3"/></label>
  {!compatible&&<p className="text-xs text-amber-200">Choose a saved character and text-to-image workflow to draft suggestions.</p>}
  {(plan?.shots?.length||0)>120&&<p className="text-xs text-amber-200">AI planning supports up to 120 shots per shoot.</p>}
  {lockScenario&&<p className="text-xs text-zinc-400">Location is locked; the assistant will preserve the current environment.</p>}
  <button type="button" className="chip active" disabled={!canRequest||busy} onClick={generate}>{busy?'Planning…':partial?`Continue remaining shots (${Math.max(0,enabledIndexes.length-completedIndexes.length)})`:proposal?'Revise all suggestions':enabledIndexes.length<=20?'Draft suggestions':`Draft ${enabledIndexes.length} suggestions by chapter`}</button>
  {progress&&<p role="status" className="text-xs text-cyan-200">Planning {progress.chapter} · {progress.done} of {progress.total} shots reviewed across {progress.batches||0} chapter batches. This can take a few minutes for a long shoot.</p>}
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{warnings.map(warning=><p key={warning} className="text-xs text-amber-200">{warning}</p>)}
  {proposal&&!busy&&<><ShotStoryboard3 plan={proposal} onChange={setProposal} outfitOptions={outfitOptions}/><div className="flex flex-wrap gap-2"><button type="button" className="chip active" onClick={()=>{onApply(proposal);setProposal(null);setPartial(false);setCompletedIndexes([]);}}>Apply reviewed suggestions</button><button type="button" className="chip" onClick={()=>{setProposal(null);setPartial(false);setCompletedIndexes([]);}}>Discard draft</button></div></>}
 </section>;
}
