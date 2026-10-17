import {useCallback,useEffect,useRef,useState} from 'react';
import {endpoints} from '@/lib/api';
import {workspaceWorkflows,workspacePrompt,workspacePayload,workspaceSubjects} from '@/lib/workspaceGeneration';
const terminal=r=>['done','failed','offline','cancelled'].includes(r.status);
const message=e=>{const detail=e?.response?.data?.detail || e.message;return typeof detail==='string'?detail:'The request failed. Please try again.';};
export function useWorkspaceGeneration(values) {
  const [rows,setRows]=useState([]),[settings,setSettings]=useState({}),[workflowId,setWorkflowId]=useState('');
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState('');
  const [renders,setRenders]=useState([]),[pollError,setPollError]=useState(''),[saved,setSaved]=useState(null);
  const [negative,setNegative]=useState(''),[seed,setSeed]=useState(''),[lora,setLora]=useState({name:'',strength:0.8,triggerWords:[]});
  const live=useRef(true),operation=useRef(false),sourceCache=useRef(null);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try {const [list,config]=await Promise.all([endpoints.listWorkflows(),endpoints.settings()]);if(live.current){setRows(list);setSettings(config);}}
    catch(e){if(live.current)setError(message(e));}finally{if(live.current)setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{setSaved(null);},[values.people,values.relationship]);
  const workflows=workspaceWorkflows(rows,settings,values.mode);
  const workflow=workflows.find(w=>w.id===workflowId) || workflows.find(w=>w.id===settings.default_workflow_id) || workflows[0];
  const chooseWorkflow=id=>{setWorkflowId(id);setLora({name:'',strength:0.8,triggerWords:[]});};
  let prompt={positive:'',negative:''},promptError='';
  try {if(values.mode && (values.mode!=='describe' || values.description.trim()))prompt=workspacePrompt({...values,workflow,settings,negative,lora});}
  catch(e){promptError=message(e);}
  const pending=renders.some(r=>!terminal(r));
  useEffect(()=>{
    if(!pending)return;
    let stopped=false,polling=false;
    const timer=setInterval(async()=>{
      if(polling)return;polling=true;
      try {const updates=await Promise.all(renders.map(r=>terminal(r)?r:endpoints.pollRender(r.id)));
        if(!stopped){setRenders(updates);setPollError('');}}
      catch{if(!stopped)setPollError('Connection interrupted. Retrying progress updates; your queued images are kept.');}
      finally{polling=false;}
    },2500);
    return()=>{stopped=true;clearInterval(timer);};
  },[pending,renders]);
  async function generate(){
    if(operation.current || pending)return;
    operation.current=true;setBusy('Generating');setError('');
    const queued=[];
    try {
      if(promptError)throw new Error(promptError);
      // Validate before uploading and before queuing any jobs.
      const preliminary={...values,workflow,prompt,seed,lora,source:values.mode==='image'?{name:'pending-upload'}:null};
      workspacePayload(preliminary);
      if(values.mode==='character' && values.people.some(p=>p.likeness?.enabled)) {
        const result=await endpoints.workflowLoras(workflow.id);
        for(const person of values.people.filter(p=>p.likeness?.enabled)) {
          if(!(result.loras || []).some(node=>node.dedicated_likeness && String(node.node_id)===String(person.likeness.node_id)))
            throw new Error('This character uses a likeness LoRA that is not mapped to this workflow. Open the saved character in the full editor to configure it.');
        }
      }
      let source=null;
      if(values.mode==='image'){
        if(!values.file)throw new Error('Choose a starting image.');
        if(sourceCache.current?.file===values.file)source=sourceCache.current.source;
        else {source=await endpoints.uploadReferenceImage(values.file);sourceCache.current={file:values.file,source};}
      }
      const base=workspacePayload({...preliminary,source});
      const firstSeed=seed===''?Math.floor(Math.random()*2147483647):Number(seed);
      for(let i=0;i<values.count;i++){
        const result=await endpoints.dispatchRender({...base,seed:(firstSeed+i)%2147483647});
        if(!result.id || ['failed','offline'].includes(result.status))throw new Error(result.error || 'Generation could not start. Check ComfyUI and the selected workflow.');
        queued.push(result);if(live.current)setRenders([...queued]);
      }
    }catch(e){if(live.current)setError(`${queued.length?`${queued.length} of ${values.count} images queued. `:''}${message(e)}`);}
    finally{operation.current=false;if(live.current)setBusy('');}
  }
  async function save(){
    if(operation.current)return;operation.current=true;setBusy('Saving');setError('');setSaved(null);
    try{
      const subjects=workspaceSubjects(values.people,values.relationship),first=values.people[0];
      const result=await endpoints.createCharacter({name:values.people.map(p=>p.name).join(' & '),dna:subjects[0].dna,subjects,
        active_subject_id:subjects[0].id,field_locks:first.field_locks,locks:first.locks,
        prompt_positive:prompt.positive,prompt_negative:prompt.negative});
      if(live.current)setSaved(result);
    }catch(e){if(live.current)setError(message(e));}finally{operation.current=false;if(live.current)setBusy('');}
  }
  const clearResults=()=>{if(!operation.current && !pending){setRenders([]);setSaved(null);setError('');setPollError('');}};
  return {clearResults,workflow,workflows,chooseWorkflow,loading,load,error,promptError,busy,pending,renders,pollError,prompt,
    negative,setNegative,seed,setSeed,lora,setLora,generate,save,saved};
}
