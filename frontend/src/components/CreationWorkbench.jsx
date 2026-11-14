import {Children,Fragment,isValidElement,useEffect,useRef,useState} from 'react';
import {SlidersHorizontal,Shuffle,Image as Picture,ScanFace,ChevronDown,ChevronLeft,ChevronRight,Play} from 'lucide-react';
import useTabPreference from '@/hooks/useTabPreference';
import {useLocation} from 'react-router-dom';
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
export default function CreationWorkbench({compact=false,section,sections,stages,onSection,onFind,name,onName,onSave,saving,saveError,people,subjectSwitcher,subjectCount=1,expectedSubjectCount=1,editor,random,settings,preview,renderStatus,workflow,workflows=[],workflowId,onWorkflow,count,onGenerate,busy,issues,ready,mode,onMode,onDashboard}) {
  const [saved,setPage]=useTabPreference('ultra:creation-workbench-page','design');
  const page=pages.some(([key])=>key===saved)?saved:'design';
  const pane=useRef(null);
  const location=useLocation();
  const [designView,setDesignView]=useState(()=>location.pathname.includes('/s/')?'editor':'dashboard');
  const [lastSectionByCategory,setLastSectionByCategory]=useState({});
  const [dashboardSearch,setDashboardSearch]=useState('');
  const [group,setGroup]=useState('Workflow');
  const [workflowOpen,setWorkflowOpen]=useState(false);
  const [workflowSearch,setWorkflowSearch]=useState('');
  const [desktopPreviewOpen,setDesktopPreviewOpen]=useState(false);
  const [generationStarted,setGenerationStarted]=useState(false);
  const [mobileCategoryOpen,setMobileCategoryOpen]=useState(false);
  const workflowMenu=useRef(null);
  const matchingWorkflows=workflows.filter(item=>(item.name || item.title || item.id || '').toLowerCase().includes(workflowSearch.toLowerCase()));
  const currentWorkflow=workflows.find(item=>item.id===workflowId);
  const [workflowFavorites,setWorkflowFavorites]=useState(()=>{
    try {
      const stored=JSON.parse(window.localStorage.getItem('ultra:favorite-generation-workflows')||'[]');
      return Array.isArray(stored)?stored.filter(id=>typeof id==='string'):[];
    } catch { return []; }
  });
  const [workflowFavoritesOnly,setWorkflowFavoritesOnly]=useState(false);
  useEffect(()=>{try{window.localStorage.setItem('ultra:favorite-generation-workflows',JSON.stringify(workflowFavorites));}catch{/* Storage unavailable; keep session favorites. */}},[workflowFavorites]);
  const displayedWorkflows=matchingWorkflows.filter(item=>!workflowFavoritesOnly||workflowFavorites.includes(item.id));
  useEffect(()=>{if(!workflowOpen)return;const onPointer=e=>{if(workflowMenu.current && !workflowMenu.current.contains(e.target))setWorkflowOpen(false);};document.addEventListener('pointerdown',onPointer);return()=>document.removeEventListener('pointerdown',onPointer);},[workflowOpen]);
  useEffect(()=>{if(pane.current)pane.current.scrollTop=0;},[page,section,group]);
  useEffect(()=>{setMobileCategoryOpen(false);},[section]);
  useEffect(()=>{if(compact)setDesignView(location.pathname.includes('/s/')?'editor':'dashboard');},[compact,location.pathname]);
  // Generate opens the preview; completed renders must not force navigation away from editing.
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
  const dashboardCategories=[
    {key:'identity',title:'Identity',description:'People and presets',keys:['scenario','identity']},
    {key:'appearance',title:'Appearance',description:'Body, face and skin',keys:['physique','feet','face','skin']},
    {key:'hair',title:'Hair',description:'Styles and colors',keys:['hair']},
    {key:'wardrobe',title:'Wardrobe',description:'Clothing and accessories',keys:['wardrobe']},
    {key:'pose',title:'Pose',description:'Position and framing',keys:['pose']},
    {key:'scene',title:'Scene',description:'Setting, lighting and style',keys:['scene','lighting','style']},
    {key:'camera',title:'Camera',description:'Angles and composition',keys:['camera']},
    {key:'advanced',title:'Advanced',description:'Additional character controls',keys:['intimate','watersports']},
  ];
  const assigned=new Set(dashboardCategories.flatMap(item=>item.keys));
  const unmatched=sections.filter(item=>!assigned.has(item.key));
  const categories=dashboardCategories.map(item=>({...item,items:item.keys.map(key=>sections.find(section=>section.key===key)).filter(Boolean)})).filter(item=>item.items.length);
  if(unmatched.length)categories.push({key:'more',title:'More',description:'Other available settings',items:unmatched});
  const openCategory=(item)=>{const target=item.items.find(x=>x.key===lastSectionByCategory[item.key])||item.items[0];if(!target)return;setDesignView('editor');onSection(target.key);};
  const selectSection=(key)=>{const owner=categories.find(item=>item.items.some(x=>x.key===key));if(owner)setLastSectionByCategory(previous=>({...previous,[owner.key]:key}));onSection(key);};
  const backToDashboard=()=>{setDesignView('dashboard');onDashboard?.();};
  const activeCategory=categories.find(item=>item.items.some(entry=>entry.key===section));
  const categorySections=activeCategory?.items || [];
  const categoryIndex=categorySections.findIndex(item=>item.key===section);
  const categoryPrevious=categorySections[categoryIndex-1];
  const categoryNext=categorySections[categoryIndex+1];
  const utilities=<><SettingFinder sections={sections} onSelect={onFind}/><label>Controls<select aria-label="Controls" value={mode} onChange={e=>onMode(e.target.value)}><option value="simple">Essentials</option><option value="advanced">All details</option></select></label></>;
  return <section className="creation-bench" aria-label="Creation workspace">
    <header className="bench-title"><div><small>CREATION STUDIO</small><input aria-label="Character name" value={name} placeholder="Untitled character" onChange={e=>onName(e.target.value)}/></div><button onClick={onSave} disabled={saving}>{saving?'Saving…':saveError?'Retry save':'Save character'}</button></header>
    <nav className="bench-nav" aria-label="Creation tasks">{pages.map(([key,label,Icon])=><button key={key} aria-current={key===page?'page':undefined} onClick={()=>setPage(key)}><Icon size={17}/>{label}</button>)}</nav>
    <div role="region" className="bench-scroll" ref={pane} aria-label={pages.find(p=>p[0]===page)[1]+' workspace'}>
      {page==='design' && compact && designView==='dashboard'?<div className="bench-dashboard" data-testid="character-category-dashboard">
        <h1>Design your character</h1><p className="bench-hint">Choose a category to customize. Your existing selections are preserved.</p>
        <label className="bench-dashboard-search">Find a category or setting<input type="search" value={dashboardSearch} onChange={e=>setDashboardSearch(e.target.value)} placeholder="Search character settings" /></label>
        <div className="bench-dashboard-grid">{categories.filter(item=>`${item.title} ${item.description} ${item.items.map(x=>x.title).join(' ')}`.toLowerCase().includes(dashboardSearch.toLowerCase())).map(item=><button type="button" className="bench-dashboard-card" key={item.key} onClick={()=>openCategory(item)}><strong>{item.title}</strong><span>{item.description}</span><small>{item.items.length} {item.items.length===1?'section':'sections'}</small></button>)}</div>
        {!categories.some(item=>`${item.title} ${item.description} ${item.items.map(x=>x.title).join(' ')}`.toLowerCase().includes(dashboardSearch.toLowerCase()))&&<p>No matching categories.</p>}
        <button type="button" className="bench-dashboard-review" onClick={()=>setPage('output')}>Review generation settings</button>
      </div>:page==='design'?<>
        {compact && <div className="bench-dashboard-return"><button type="button" onClick={backToDashboard}><ChevronLeft size={17}/> Back to Categories</button><span>{category}</span></div>}
        {compact && <div className="bench-editor-actions" aria-label="Character editor actions"><label>Editing mode<select aria-label="Editing detail level" value={mode} onChange={e=>onMode(e.target.value)}><option value="simple">Essentials</option><option value="advanced">All details</option></select></label><button type="button" onClick={()=>setPage('preview')}>Preview character</button></div>}
        {!compact && <div className="bench-context"><label className="bench-desktop-category">Category<select aria-label="Category" value={section} onChange={e=>onSection(e.target.value)}>{sections.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}</select></label>{utilities}</div>}
        {!compact && <details className="bench-people"><summary>People &amp; presets <ChevronDown size={15}/></summary>{people}</details>}
        {!compact && subjectSwitcher && <div className="bench-subject-switcher" aria-label="Edit individual subjects">{subjectSwitcher}</div>}
        {compact && <div className="bench-focused-navigation" aria-label="Current editing category">
          <label>Category<select aria-label="Choose editing category" value={activeCategory?.key || ''} onChange={e=>{const chosen=categories.find(item=>item.key===e.target.value);if(chosen)openCategory(chosen);}}>{categories.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}</select></label>
          {categorySections.length>1 && <label>Section<select aria-label="Choose section within category" value={section} onChange={e=>selectSection(e.target.value)}>{categorySections.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}</select></label>}
          <span className="bench-focused-counter">{categorySections.length?categoryIndex+1:0} of {categorySections.length} in {activeCategory?.title || 'category'}</span>
        </div>}
        {!compact && <nav className="bench-category-quicknav" aria-label="Jump to editing category">
          {groups.map(g=><div className="bench-category-group" key={g.key||g.id}>
            <span className="bench-category-group-title">{g.title}</span>
            <div className="bench-category-group-items">{g.sections.map(key=>sections.find(item=>item.key===key)).filter(Boolean).map(item=><button key={item.key} type="button" aria-current={section===item.key?'step':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</div>
          </div>)}
          {custom.length>0 && <div className="bench-category-group"><span className="bench-category-group-title">More</span><div className="bench-category-group-items">{custom.map(item=><button key={item.key} type="button" aria-current={section===item.key?'step':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</div></div>}
        </nav>}
        <div className="bench-category-navigation bench-desktop-navigation" aria-label="Category navigation">
          <button type="button" disabled={!previous} onClick={()=>selectSection(previous.key)}><ChevronLeft size={17}/> Previous</button>
          <span>{currentIndex+1} of {sections.length}</span>
          <button type="button" disabled={!next} onClick={()=>selectSection(next.key)}>Next<ChevronRight size={17}/></button>
        </div>
        <article className={section==='wardrobe' ? 'bench-wardrobe-editor' : undefined} aria-label={category+' choices'}>{editor}</article>
        {compact && <div className="bench-mobile-bottom-navigation" aria-label="Continue category">
          <button type="button" disabled={!categoryPrevious} onClick={()=>selectSection(categoryPrevious.key)}><ChevronLeft size={17}/> Previous</button>
          <span aria-label={`Section ${categoryIndex+1} of ${categorySections.length}`}>{categoryIndex+1} / {categorySections.length}</span>
          {categoryNext?<button type="button" onClick={()=>selectSection(categoryNext.key)}>Next <ChevronRight size={17}/></button>:<button type="button" onClick={backToDashboard}>Categories <ChevronRight size={17}/></button>}
        </div>}
        {compact && generationStarted && <button type="button" className="bench-view-preview" onClick={()=>setPage('preview')}>View generation preview</button>}
        {compact && <details className="bench-mobile-extras"><summary>Additional options</summary>
          <div className="bench-mobile-mode" role="group" aria-label="Editing detail level"><button type="button" aria-pressed={mode==='simple'} onClick={()=>onMode('simple')}>Essentials</button><button type="button" aria-pressed={mode==='advanced'} onClick={()=>onMode('advanced')}>All details</button></div>
          <details className="bench-mobile-find"><summary>Find a setting</summary><SettingFinder sections={sections} onSelect={onFind}/></details>
          <details className="bench-mobile-presets"><summary>Character presets and people options</summary>{people}</details>
          {subjectSwitcher && <div className="bench-subject-switcher" aria-label="Edit individual subjects">{subjectSwitcher}</div>}
        </details>}
      </>:page==='random'?<><h1>Randomize</h1><p className="bench-hint">Choose what to change. Generate when you like the selection.</p>{random}</>:page==='preview'?<><div className="bench-preview-heading"><div><h1>Generation preview</h1><p className="bench-hint">{busy?'Your generation request is being processed.':renderStatus?`Render status: ${renderStatus}`:'Review your generated images or check the render queue.'}</p></div><button type="button" onClick={()=>setPage('design')}>Back to editing</button></div>{preview}</>:<><h1>Generation settings</h1><label className="bench-setting-label">Settings menu<select aria-label="Settings menu" value={group} onChange={e=>setGroup(e.target.value)}>{Object.keys(settings).map(k=><option key={k}>{k}</option>)}</select></label>{typeof settings[group]==="function"?settings[group](()=>setPage("design")):settings[group]}</>}
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
          <div className="bench-workflow-filter"><button type="button" aria-pressed={!workflowFavoritesOnly} onClick={()=>setWorkflowFavoritesOnly(false)}>All workflows</button><button type="button" aria-pressed={workflowFavoritesOnly} onClick={()=>setWorkflowFavoritesOnly(true)}>Favorites ({workflowFavorites.length})</button></div>
          <div className="bench-workflow-options" role="listbox" aria-label="Available workflows">
            {displayedWorkflows.map(item=><div className="bench-workflow-row" key={item.id}><button type="button" role="option" aria-selected={item.id===workflowId} onClick={()=>{onWorkflow(item.id);setWorkflowOpen(false);}}>{item.name || item.title || item.id}</button><button type="button" className="bench-workflow-star" aria-label={`${workflowFavorites.includes(item.id)?"Remove":"Add"} favorite ${item.name || item.title || item.id}`} aria-pressed={workflowFavorites.includes(item.id)} onClick={()=>setWorkflowFavorites(current=>current.includes(item.id)?current.filter(id=>id!==item.id):[...current,item.id])}>{workflowFavorites.includes(item.id)?"★":"☆"}</button></div>)}
            {!displayedWorkflows.length && <p>{workflowFavoritesOnly?"No favorite workflows yet":"No matching workflows"}</p>}
          </div>
        </div>}
      </div>
      {issues?.[0] && <small role="status">{issues[0]}</small>}
      {renderStatus && <small>Render: {renderStatus}</small>}
    </div>{!compact && generationStarted && !desktopPreviewOpen && <button type="button" onClick={()=>setDesktopPreviewOpen(true)}>Show preview</button>}<button type="button" disabled={busy||!ready} onClick={()=>{setGenerationStarted(true);if(compact){setPage('preview');}else{setDesktopPreviewOpen(true);}onGenerate();}}><Play size={16}/>{busy?'Queuing…':count>1?`Generate (${count})`:'Generate'}</button></footer>
  </section>
}
