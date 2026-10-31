import {Children,Fragment,isValidElement,useEffect,useRef,useState} from 'react';
import {SlidersHorizontal,Shuffle,Image as Picture,ScanFace,ChevronDown,ChevronLeft,ChevronRight,Play} from 'lucide-react';
import useTabPreference from '@/hooks/useTabPreference';
import SettingFinder from './SettingFinder';
import './CreationWorkbench.css';

// Select the applicable workflow controls before mounting expensive library and preview panels.
export function workflowControls(nodes, kind) {
  return Children.toArray(nodes).flatMap(node=>{
    if(!isValidElement(node))return [];
    if(node.props['data-mobile-tools'])return node.props['data-mobile-tools']===kind?[node]:[];
    return node.type===Fragment || node.props['data-mobile-tools-container'] ? workflowControls(node.props.children,kind):[];
  });
}
const pages=[['design','Design',ScanFace],['random','Randomize',Shuffle],['output','Settings',SlidersHorizontal],['preview','Preview',Picture]];
export default function CreationWorkbench({compact=false,section,sections,stages,onSection,onFind,name,onName,onSave,saving,saveError,people,subjectSwitcher,subjectCount=1,expectedSubjectCount=1,editor,random,settings,preview,renderStatus,workflow,workflows=[],workflowId,onWorkflow,count,onGenerate,busy,issues,ready,mode,onMode}) {
  const [saved,setPage]=useTabPreference('ultra:creation-workbench-page','design');
  const page=pages.some(([key])=>key===saved)?saved:'design';
  const pane=useRef(null);
  const [group,setGroup]=useState('Workflow');
  const [workflowOpen,setWorkflowOpen]=useState(false);
  const [workflowSearch,setWorkflowSearch]=useState('');
  const [desktopPreviewOpen,setDesktopPreviewOpen]=useState(false);
  const [generationStarted,setGenerationStarted]=useState(false);
  const [mobileCategoryOpen,setMobileCategoryOpen]=useState(false);
  const workflowMenu=useRef(null);
  const matchingWorkflows=workflows.filter(item=>(item.name || item.title || item.id || '').toLowerCase().includes(workflowSearch.toLowerCase()));
  const currentWorkflow=workflows.find(item=>item.id===workflowId);
  useEffect(()=>{if(!workflowOpen)return;const onPointer=e=>{if(workflowMenu.current && !workflowMenu.current.contains(e.target))setWorkflowOpen(false);};document.addEventListener('pointerdown',onPointer);return()=>document.removeEventListener('pointerdown',onPointer);},[workflowOpen]);
  useEffect(()=>{if(pane.current)pane.current.scrollTop=0;},[page,section,group]);
  useEffect(()=>{setMobileCategoryOpen(false);},[section]);
  const groups=stages.filter(s=>s.sections?.length);
  const custom=sections.filter(s=>!groups.some(g=>g.sections.includes(s.key)));
  const category=sections.find(s=>s.key===section)?.title;
  const currentIndex=sections.findIndex(s=>s.key===section);
  const previous=sections[currentIndex-1];
  const next=sections[currentIndex+1];
  const mobileSteps=[...groups.map(g=>({key:g.key||g.id,title:g.title,sections:g.sections.filter(key=>sections.some(item=>item.key===key))})).filter(g=>g.sections.length),...(custom.length?[{key:'more',title:'More',sections:custom.map(item=>item.key)}]:[])];
  const activeMobileStep=Math.max(0,mobileSteps.findIndex(g=>g.sections.includes(section)));
  const mobileStep=mobileSteps[activeMobileStep];
  const mobileStepSections=mobileStep?.sections.map(key=>sections.find(item=>item.key===key)).filter(Boolean)||[];
  const utilities=<><SettingFinder sections={sections} onSelect={onFind}/><label>Controls<select aria-label="Controls" value={mode} onChange={e=>onMode(e.target.value)}><option value="simple">Essentials</option><option value="advanced">All details</option></select></label></>;
  return <section className="creation-bench" aria-label="Creation workspace">
    <header className="bench-title"><div><small>CREATION STUDIO</small><input aria-label="Character name" value={name} placeholder="Untitled character" onChange={e=>onName(e.target.value)}/></div><button onClick={onSave} disabled={saving}>{saving?'Saving…':saveError?'Retry save':'Save character'}</button></header>
    <nav className="bench-nav" aria-label="Creation tasks">{pages.map(([key,label,Icon])=><button key={key} aria-current={key===page?'page':undefined} onClick={()=>setPage(key)}><Icon size={17}/>{label}</button>)}</nav>
    <div role="region" className="bench-scroll" ref={pane} aria-label={pages.find(p=>p[0]===page)[1]+' workspace'}>
      {page==='design'?<>
        {!compact && <div className="bench-context"><label className="bench-desktop-category">Category<select aria-label="Category" value={section} onChange={e=>onSection(e.target.value)}>{sections.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}</select></label>{utilities}</div>}
        {!compact && <details className="bench-people"><summary>People &amp; presets <ChevronDown size={15}/></summary>{people}</details>}
        {!compact && subjectSwitcher && <div className="bench-subject-switcher" aria-label="Edit individual subjects">{subjectSwitcher}</div>}
        {compact && <div className="bench-guided-flow">
          <div className="bench-guided-heading"><div><small>CREATE · STEP {activeMobileStep+1} OF {mobileSteps.length}</small><h2>{mobileStep?.title||category}</h2></div><button type="button" onClick={()=>setMobileCategoryOpen(open=>!open)} aria-expanded={mobileCategoryOpen}>All steps <ChevronDown size={15}/></button></div>
          <div className="bench-guided-progress" aria-label="Creation progress">{mobileSteps.map((g,i)=><button type="button" key={g.key} aria-label={g.title} aria-current={i===activeMobileStep?'step':undefined} onClick={()=>onSection(g.sections[0])} className={i<=activeMobileStep?'reached':''}/>)}</div>
          {mobileCategoryOpen && <nav className="bench-guided-step-list" aria-label="Creation steps">{mobileSteps.map((g,i)=><button key={g.key} type="button" aria-current={i===activeMobileStep?'step':undefined} onClick={()=>{onSection(g.sections[0]);setMobileCategoryOpen(false);}}>{i+1}. {g.title}</button>)}</nav>}
          {mobileStepSections.length>1 && <nav className="bench-guided-substeps" aria-label={mobileStep?.title+' options'}>{mobileStepSections.map(item=><button type="button" key={item.key} aria-current={section===item.key?'step':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</nav>}
        </div>}
        {!compact && <nav className="bench-category-quicknav" aria-label="Jump to editing category">
          {groups.map(g=><div className="bench-category-group" key={g.key||g.id}>
            <span className="bench-category-group-title">{g.title}</span>
            <div className="bench-category-group-items">{g.sections.map(key=>sections.find(item=>item.key===key)).filter(Boolean).map(item=><button key={item.key} type="button" aria-current={section===item.key?'step':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</div>
          </div>)}
          {custom.length>0 && <div className="bench-category-group"><span className="bench-category-group-title">More</span><div className="bench-category-group-items">{custom.map(item=><button key={item.key} type="button" aria-current={section===item.key?'step':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</div></div>}
        </nav>}
        <div className="bench-category-navigation bench-desktop-navigation" aria-label="Category navigation">
          <button type="button" disabled={!previous} onClick={()=>onSection(previous.key)}><ChevronLeft size={17}/> Previous</button>
          <span>{currentIndex+1} of {sections.length}</span>
          <button type="button" disabled={!next} onClick={()=>onSection(next.key)}>Next<ChevronRight size={17}/></button>
        </div>
        <article aria-label={category+' choices'}>{editor}</article>
        {compact && <div className="bench-mobile-bottom-navigation" aria-label="Continue creation">
          <button type="button" disabled={!previous} onClick={()=>onSection(previous.key)}><ChevronLeft size={17}/> Previous</button>
          <span>{currentIndex+1} / {sections.length}</span>
          <button type="button" disabled={!next} onClick={()=>onSection(next.key)}>Next <ChevronRight size={17}/></button>
        </div>}
        {compact && <details className="bench-mobile-extras"><summary>Additional options</summary>
          <div className="bench-mobile-mode" role="group" aria-label="Editing detail level"><button type="button" aria-pressed={mode==='simple'} onClick={()=>onMode('simple')}>Essentials</button><button type="button" aria-pressed={mode==='advanced'} onClick={()=>onMode('advanced')}>All details</button></div>
          <details className="bench-mobile-find"><summary>Find a setting</summary><SettingFinder sections={sections} onSelect={onFind}/></details>
          <details className="bench-mobile-presets"><summary>Character presets and people options</summary>{people}</details>
          {subjectSwitcher && <div className="bench-subject-switcher" aria-label="Edit individual subjects">{subjectSwitcher}</div>}
        </details>
      </>:page==='random'?<><h1>Randomize</h1><p className="bench-hint">Choose what to change. Generate when you like the selection.</p>{random}</>:page==='preview'?<><h1>Preview</h1>{preview}</>:<><h1>Generation settings</h1><label className="bench-setting-label">Settings menu<select aria-label="Settings menu" value={group} onChange={e=>setGroup(e.target.value)}>{Object.keys(settings).map(k=><option key={k}>{k}</option>)}</select></label>{typeof settings[group]==="function"?settings[group](()=>setPage("design")):settings[group]}</>}
    </div>
    {!compact && generationStarted && desktopPreviewOpen && <aside className="bench-desktop-preview" aria-label="Generated image preview">
      <div className="bench-desktop-preview-header"><strong>Generation preview</strong><button type="button" onClick={()=>setDesktopPreviewOpen(false)} aria-label="Close preview">Close</button></div>
      <div className="bench-desktop-preview-content">{preview}</div>
    </aside>}
    <footer className="bench-footer"><div className="bench-footer-workflow">
      <label htmlFor="bench-workflow-select">Generation workflow</label>
      <div className="bench-workflow-picker" ref={workflowMenu}>
        <button id="bench-workflow-select" type="button" className="bench-workflow-trigger" aria-label="Generation workflow" aria-expanded={workflowOpen} aria-controls="bench-workflow-options" disabled={busy || !onWorkflow || workflows.length===0} onClick={()=>{setWorkflowOpen(open=>!open);setWorkflowSearch('');}}>
          <span>{currentWorkflow?.name || currentWorkflow?.title || workflow || 'Choose a workflow'}</span><ChevronDown size={16}/>
        </button>
        {workflowOpen && <div id="bench-workflow-options" className="bench-workflow-popover">
          <input aria-label="Search workflows" placeholder="Search workflows…" value={workflowSearch} onChange={e=>setWorkflowSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setWorkflowOpen(false);}} autoFocus/>
          <div className="bench-workflow-options" role="listbox" aria-label="Available workflows">
            {matchingWorkflows.map(item=><button type="button" role="option" aria-selected={item.id===workflowId} key={item.id} onClick={()=>{onWorkflow(item.id);setWorkflowOpen(false);}}>{item.name || item.title || item.id}</button>)}
            {!matchingWorkflows.length && <p>No matching workflows</p>}
          </div>
        </div>}
      </div>
      {issues?.[0] && <small role="status">{issues[0]}</small>}
      {renderStatus && <small>Render: {renderStatus}</small>}
    </div>{!compact && generationStarted && !desktopPreviewOpen && <button type="button" onClick={()=>setDesktopPreviewOpen(true)}>Show preview</button>}<button type="button" disabled={busy||!ready} onClick={()=>{if(!compact){setGenerationStarted(true);setDesktopPreviewOpen(true);}onGenerate();}}><Play size={16}/>{busy?'Queuing…':count>1?`Generate (${count})`:'Generate'}</button></footer>
  </section>
}
