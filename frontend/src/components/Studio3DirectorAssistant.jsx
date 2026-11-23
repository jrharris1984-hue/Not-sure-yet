import {useEffect,useRef,useState} from 'react';
import {endpoints} from '@/lib/api';
import {SHOT_CATALOG} from '@/lib/shootPlanner';
import {directorFramesFromPlan3,directorFramesToPlan3} from '@/lib/studio3Director';
import {STUDIO3_CAMERAS,STUDIO3_POSES,STUDIO3_VIEWS} from '@/components/ShotStoryboard3';
import ShotStoryboard3 from '@/components/ShotStoryboard3';

const textToImageKinds=new Set(['image','txt2img','text_to_image']);
export default function Studio3DirectorAssistant({characterId,workflow,plan,lockScenario,outfitOptions=[],onApply}){
 const [brief,setBrief]=useState('');
 const [proposal,setProposal]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [warnings,setWarnings]=useState([]);
 const requestId=useRef(0);
 const contextKey=`${characterId||''}|${workflow?.id||''}|${JSON.stringify(plan||{})}`;
 useEffect(()=>{
  requestId.current+=1;setProposal(null);setError('');setWarnings([]);setBusy(false);
  return()=>{requestId.current+=1;};
 },[contextKey]);
 const compatible=!!characterId&&!!workflow?.id&&textToImageKinds.has(workflow.kind);
 const enabledIndexes=(plan?.shots||[]).map((shot,index)=>shot.enabled?index:-1).filter(index=>index>=0);
 const canRequest=compatible&&!!brief.trim()&&enabledIndexes.length>0&&(plan?.shots?.length||0)<=20;
 const generate=async()=>{
  if(!canRequest)return;
  const id=++requestId.current;
  setBusy(true);setError('');setProposal(null);
  try{
   const result=await endpoints.aiShootPlan({character_id:characterId,workflow_id:workflow.id,instruction:brief.trim(),count:enabledIndexes.length,
    shot_numbers:enabledIndexes.map(index=>index+1),lock_scenario:!!lockScenario,catalog:SHOT_CATALOG,current_frames:directorFramesFromPlan3(plan)});
   if(id!==requestId.current)return;
   if(!Array.isArray(result?.frames)||result.frames.length!==enabledIndexes.length)throw new Error('The assistant returned an incomplete shot plan. Try a shorter brief.');
   setWarnings(result.warnings||[]);
   setProposal(directorFramesToPlan3(plan,result.frames,{shotIndexes:enabledIndexes,choices:{poses:STUDIO3_POSES,views:STUDIO3_VIEWS,cameras:STUDIO3_CAMERAS,outfits:outfitOptions}}));
  }catch(e){if(id===requestId.current)setError(e?.response?.data?.detail||e.message||'Could not draft the shot plan. Check the assistant settings and try again.');}
  finally{if(id===requestId.current)setBusy(false);}
 };
 return <section className="pane p-4 space-y-3" aria-label="AI Creative Director" data-testid="studio3-ai-director">
  <div><h3 className="font-semibold">AI Creative Director</h3><p className="text-xs text-zinc-400">Ask the configured prompt assistant for structured shot suggestions. Review and edit the draft before applying it; planning does not render images.</p></div>
  <label className="block text-sm">Shoot brief<textarea value={brief} maxLength={3000} rows={3} onChange={event=>setBrief(event.target.value)} placeholder="A warm editorial shoot in a loft, with varied poses and camera angles." className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3"/></label>
  {!compatible&&<p className="text-xs text-amber-200">Choose a saved character and text-to-image workflow to draft suggestions.</p>}
  {(plan?.shots?.length||0)>20&&<p className="text-xs text-amber-200">The current AI planner supports up to 20 cards per request. Reduce this plan to 20 shots or fewer to use AI suggestions.</p>}
  {lockScenario&&<p className="text-xs text-zinc-400">Location is locked; the assistant will preserve the current environment.</p>}
  <button type="button" className="chip active" disabled={!canRequest||busy} onClick={generate}>{busy?'Planning…':'Draft suggestions'}</button>
  {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{warnings.map(warning=><p key={warning} className="text-xs text-amber-200">{warning}</p>)}
  {proposal&&<><ShotStoryboard3 plan={proposal} onChange={setProposal} outfitOptions={outfitOptions}/><div className="flex flex-wrap gap-2"><button type="button" className="chip active" onClick={()=>{onApply(proposal);setProposal(null);}}>Apply reviewed suggestions</button><button type="button" className="chip" onClick={()=>setProposal(null)}>Discard draft</button></div></>}
 </section>;
}
