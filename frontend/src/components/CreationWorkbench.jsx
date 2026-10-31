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
  useEffect(()=>{if(pane.current)pane.current.scrollTop=0;},[page,section,group]);
  const groups=stages.filter(s=>s.sections?.length);
  const custom=sections.filter(s=>!groups.some(g=>g.sections.includes(s.key)));
  const category=sections.find(s=>s.key===section)?.title;
  const currentIndex=sections.findIndex(s=>s.key===section);
  const previous=sections[currentIndex-1];
  const next=sections[currentIndex+1];
  const utilities=<><SettingFinder sections={sections} onSelect={onFind}/><label>Controls<select aria-label="Controls" value={mode} onChange={e=>onMode(e.target.value)}><option value="simple">Essentials</option><option value="advanced">All details</option></select></label></>;
  return <section className="creation-bench" aria-label="Creation workspace">
    <header className="bench-title"><div><small>CREATION STUDIO</small><input aria-label="Character name" value={name} placeholder="Untitled character" onChange={e=>onName(e.target.value)}/></div><button onClick={onSave} disabled={saving}>{saving?'Saving…':saveError?'Retry save':'Save character'}</button></header>
    <nav className="bench-nav" aria-label="Creation tasks">{pages.map(([key,label,Icon])=><button key={key} aria-current={key===page?'page':undefined} onClick={()=>setPage(key)}><Icon size={17}/>{label}</button>)}</nav>
    <div role="region" className="bench-scroll" ref={pane} aria-label={pages.find(p=>p[0]===page)[1]+' workspace'}>
      {page==='design'?<>
        <div className="bench-context"><label>Category<select aria-label="Category" value={section} onChange={e=>onSection(e.target.value)}>{groups.map(g=><optgroup key={g.key||g.id} label={g.title}>{g.sections.map(key=>sections.find(s=>s.key===key)).filter(Boolean).map(s=><option key={s.key} value={s.key}>{s.title}</option>)}</optgroup>)}{custom.map(s=><option key={s.key} value={s.key}>{s.title}</option>)}</select></label>{!compact && utilities}{compact && <details className="bench-mobile-options"><summary>Editor options</summary><div>{utilities}<details className="bench-people"><summary>People &amp; presets</summary>{people}</details></div></details>}</div>
        {!compact && <details className="bench-people"><summary>People &amp; presets <ChevronDown size={15}/></summary>{people}</details>}
        {subjectSwitcher && <div className="bench-subject-switcher" aria-label="Edit individual subjects"><p className="px-3 pt-3 text-xs text-zinc-300" role="status">Editing {subjectCount} of {expectedSubjectCount} selected subjects · Choose a subject to edit its own appearance, clothing and pose.</p>{subjectSwitcher}</div>}
        <div className="bench-category-navigation" aria-label="Category navigation">
          <button type="button" disabled={!previous} onClick={()=>onSection(previous.key)}><ChevronLeft size={17}/> Previous{previous ? ': '+previous.title : ''}</button>
          <span>{currentIndex+1} of {sections.length}</span>
          <button type="button" disabled={!next} onClick={()=>onSection(next.key)}>Next{next ? ': '+next.title : ''}<ChevronRight size={17}/></button>
        </div>
        <article aria-label={category+' choices'}>{editor}</article>
      </>:page==='random'?<><h1>Randomize</h1><p className="bench-hint">Choose what to change. Generate when you like the selection.</p>{random}</>:page==='preview'?<><h1>Preview</h1>{preview}</>:<><h1>Generation settings</h1><label className="bench-setting-label">Settings menu<select aria-label="Settings menu" value={group} onChange={e=>setGroup(e.target.value)}>{Object.keys(settings).map(k=><option key={k}>{k}</option>)}</select></label>{typeof settings[group]==="function"?settings[group](()=>setPage("design")):settings[group]}</>}
    </div>
    <footer className="bench-footer"><div className="bench-footer-workflow">
      <label htmlFor="bench-workflow-select">Generation workflow</label>
      <select id="bench-workflow-select" aria-label="Generation workflow" value={workflowId || ''} disabled={busy || !onWorkflow || workflows.length===0} onChange={e=>onWorkflow(e.target.value)}>
        {!workflowId && <option value="">Choose a workflow</option>}
        {workflows.map(item=><option key={item.id} value={item.id}>{item.name || item.title || item.id}</option>)}
      </select>
      {issues?.[0] && <small role="status">{issues[0]}</small>}
      {renderStatus && <small>Render: {renderStatus}</small>}
    </div><button type="button" disabled={busy||!ready} onClick={onGenerate}><Play size={16}/>{busy?'Queuing…':count>1?`Generate (${count})`:'Generate'}</button></footer>
  </section>
}
