import {useState} from 'react';
import {Zap,Sparkles,WandSparkles} from 'lucide-react';
import {workflowSampling} from '@/lib/studioGeneration';
export default function StudioGenerationBar({workflows=[],activeId,onWorkflow,onSurprise,busy=false,surpriseReason='',bindings={},onBindings}) {
  const [configure,setConfigure]=useState(false);
  const eligible=workflows.filter(workflow=>workflowSampling(workflow));
  const select=mode=>{
    const workflow=eligible.find(w=>w.id===bindings[mode]);
    if(!workflow){setConfigure(true);return;}
    onWorkflow(workflow,workflowSampling(workflow));
  };
  return <section className="studio-generation-bar" aria-label="Studio generation shortcuts">
    <div className="studio-generation-actions">
      <div role="group" aria-label="Generation mode">{[['turbo','Turbo',Zap],['studio','Studio',Sparkles]].map(([key,label,Icon])=><button type="button" key={key} disabled={busy} aria-pressed={!!bindings[key]&&bindings[key]===activeId} onClick={()=>select(key)}><Icon size={16} aria-hidden="true"/>{label}</button>)}</div>
      <button type="button" className="studio-surprise" disabled={busy||!!surpriseReason} onClick={onSurprise}><WandSparkles size={17} aria-hidden="true"/>Surprise me & generate</button>
      <button type="button" className="studio-mode-configure" aria-expanded={configure} onClick={()=>setConfigure(open=>!open)}>Set up modes</button>
    </div>
    <p>Surprise creates one new scene and pose, keeping your people, outfit and locks.</p>
    {surpriseReason && <p className="studio-shortcut-reason">{surpriseReason}</p>}
    {configure && <div className="studio-mode-bindings"><p>Choose a workflow for each shortcut. Each uses its own saved sampling settings. Speed depends on the model, image size and hardware.</p>
      {['turbo','studio'].map(mode=><label key={mode}>{mode==='turbo'?'Turbo workflow':'Studio workflow'}<select disabled={busy} value={eligible.some(w=>w.id===bindings[mode])?bindings[mode]:''} onChange={event=>onBindings({...bindings,[mode]:event.target.value})}><option value="">Choose workflow</option>{eligible.map(w=><option key={w.id} value={w.id}>{w.name} · {workflowSampling(w).steps} steps</option>)}</select></label>)}
      <p>Only readable single-sampler image workflows appear here. Other workflows remain available in the main workflow selector.</p>
    </div>}
  </section>;
}
