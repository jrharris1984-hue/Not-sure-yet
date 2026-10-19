import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ImagePlus, Images, UsersRound, WandSparkles, SlidersHorizontal, Layers, Settings, ListOrdered, Menu, Plus, Shuffle, ChevronRight, Download, Maximize2} from 'lucide-react';
import {Dialog, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {endpoints} from '@/lib/api';
import {mediaUrl} from '@/lib/media';
import {STUDIO_CHARACTER_SECTIONS,STUDIO_SECTION_NAMES,INTIMATE_DETAIL_GROUPS,studioFeatureSection,studioFeatureOptions} from '@/lib/studioFeatures';
import {previewPerson} from '@/lib/workspacePreview';
import {BODY_GROUPS, updateWorkspaceField, workspaceFieldLocked, wardrobeFieldDisabled} from '@/lib/workspaceFields';
import {wardrobeGroups} from '@/lib/wardrobeLayout';
import {sizeControlSummary, physiqueControlStatus} from '@/lib/physiqueControlPriority';
import {loadStudioDraft, saveStudioDraft} from '@/lib/studioDraft';
import {matchingWorkspaceFields} from '@/lib/workspaceNavigation';
import {useWorkspaceGeneration} from '@/hooks/useWorkspaceGeneration';
import RandomizerSuites from '@/components/RandomizerSuites';
import UniversalLoraPicker from '@/components/UniversalLoraPicker';
import './StudioWorkspace.css';

const characterSections = STUDIO_CHARACTER_SECTIONS;
const sceneSections = ['scene','pose','lighting','camera','style'];
const sectionNames = STUDIO_SECTION_NAMES;
const modes = [{id:'character',label:'Character'},{id:'describe',label:'Text to image'},{id:'image',label:'Image edit'}];
const navigation = [
  {to:'/create',label:'Studio',icon:WandSparkles}, {to:'/',label:'Characters',icon:UsersRound},
  {to:'/gallery',label:'Gallery',icon:Images}, {to:'/queue',label:'Queue',icon:ListOrdered},
  {to:'/create/tools',label:'Tools',icon:Layers}, {to:'/settings',label:'Settings',icon:Settings},
];
const sectionFor = studioFeatureSection;

export default function StudioWorkspace() {
  const [initialDraft]=useState(loadStudioDraft);
  const [draftSaved,setDraftSaved]=useState(!!initialDraft);
  const [mode,setMode]=useState(initialDraft?.mode || 'character');
  const [people,setPeople]=useState(()=>initialDraft?.people || [previewPerson()]), [active,setActive]=useState(0);
  const [relationship,setRelationship]=useState(initialDraft?.relationship || 'Choose later');
  const [description,setDescription]=useState(initialDraft?.description || ''), [instruction,setInstruction]=useState(initialDraft?.instruction || '');
  const [count,setCount]=useState([1,2,4].includes(initialDraft?.count)?initialDraft.count:1), [shape,setShape]=useState(['Portrait','Square','Landscape'].includes(initialDraft?.shape)?initialDraft.shape:'Portrait');
  const [file,setFile]=useState(null), [sourceUrl,setSourceUrl]=useState('');
  const [panel,setPanel]=useState(initialDraft?.mode && initialDraft.mode!=='character'?'prompt':'character'), [category,setCategory]=useState('identity');
  const [bodyGroup,setBodyGroup]=useState('build'), [outfitGroup,setOutfitGroup]=useState('outfit'), [intimateGroup,setIntimateGroup]=useState('grooming');
  const [detailQuery,setDetailQuery]=useState(''), [dialog,setDialog]=useState(null);
  const [query,setQuery]=useState(''), [choiceGroup,setChoiceGroup]=useState('All');
  const [returnToInspector,setReturnToInspector]=useState(false);
  const [advancedOpen,setAdvancedOpen]=useState(false);
  const [characters,setCharacters]=useState([]), [libraryState,setLibraryState]=useState('');
  const [error,setError]=useState(''), [selectedOutput,setSelectedOutput]=useState('');
  const [sceneName,setSceneName]=useState('Use current scene');
  const [sceneOverrides,setSceneOverrides]=useState(initialDraft?.sceneOverrides || {});
  const effectiveDescription=[description,...Object.entries(sceneOverrides).map(([key,value])=>{const [section,field]=key.split('.');const label=sectionFor(section)?.fields.find(item=>item.key===field)?.label || field;return `${label}: ${Array.isArray(value)?value.join(', '):value}.`;})].join(' ');
  const fileUrl=useRef(''), mounted=useRef(true);
  const generation=useWorkspaceGeneration({mode,people,relationship,description:effectiveDescription,instruction,file,count,shape,sceneName});
  const locked=!!generation.busy || generation.pending;
  const person=people[active] || people[0];
  const outputs=generation.renders.flatMap(render=>(render.output_files || []).map(url=>({url,id:render.id})));
  const output=outputs.find(item=>item.url===selectedOutput) || outputs[0];
  const reference=mode==='image'?sourceUrl:mode==='character'?person.thumbnail:'';
  const canvasImage=output?.url || reference;
  const title=mode==='character'?person.name:mode==='image'?'Image edit':'Image idea';
  const ready=!!generation.workflow && !generation.loading && !generation.promptError &&
    (mode==='character' || (mode==='describe'?!!description.trim():!!file && !!instruction.trim()));

  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);};},[]);
  useEffect(()=>{setDraftSaved(saveStudioDraft({mode,people,relationship,description,instruction,count,shape,sceneOverrides}));},[mode,people,relationship,description,instruction,count,shape,sceneOverrides]);
  const open = value => {
    setQuery('');setChoiceGroup('All');
    setReturnToInspector(dialog?.type==='inspector' && ['field','library','new'].includes(value.type));
    setDialog(value);
  };
  const closeDialog = () => {
    if(returnToInspector){setDialog({type:'inspector',title:panel==='character'?'Character':panel==='scene'?'Scene':'Output'});setReturnToInspector(false);}
    else setDialog(null);
  };
  const changeField = (section,field,value) => {
    setPeople(current=>current.map((p,index)=>index===active?updateWorkspaceField(p,section,field,value):p));
    if(mode==='describe' && sceneSections.includes(section))setSceneOverrides(current=>({...current,[`${section}.${field}`]:value}));
  };
  function selectPanel(next) {
    setPanel(next);setDetailQuery('');setCategory(next==='scene'?'scene':'identity');
  }
  function selectMode(next) {
    if(locked)return;
    setMode(next);generation.clearResults();setSelectedOutput('');setError('');
    selectPanel(next==='character'?'character':'prompt');
  }
  function upload(event) {
    const next=event.target.files?.[0];event.target.value='';if(!next)return;
    if(!['image/jpeg','image/png','image/webp'].includes(next.type) || !next.size || next.size>20*1024*1024){setError('Choose a JPG, PNG or WebP image under 20 MB.');return;}
    if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);
    fileUrl.current=URL.createObjectURL(next);setSourceUrl(fileUrl.current);setFile(next);setError('');generation.clearResults();
  }
  async function loadCharacters() {
    open({type:'library',title:'Your characters'});setLibraryState('loading');
    try {const rows=await endpoints.listCharacters();if(mounted.current){setCharacters(rows);setLibraryState('ready');}}
    catch {if(mounted.current)setLibraryState('error');}
  }
  function chooseCharacter(character) {
    setPeople(current=>current.map((p,index)=>index===active?previewPerson(character):p));
    generation.clearResults();closeDialog();selectPanel('character');
  }
  function resetCharacter() {
    setPeople(current=>current.map((p,index)=>index===active?previewPerson():p));generation.clearResults();closeDialog();
  }
  const choiceField=dialog?.type==='field'?sectionFor(dialog.section)?.fields.find(field=>field.key===dialog.field):null;
  const choiceValue=mode==='describe' && !Object.prototype.hasOwnProperty.call(sceneOverrides,`${dialog?.section}.${dialog?.field}`)?undefined:person.dna[dialog?.section]?.[dialog?.field];
  const choices=choiceField?studioFeatureOptions(dialog.section,dialog.field).filter(option=>option.label.toLowerCase().includes(query.toLowerCase()) &&
    (choiceGroup==='All' || choiceField.groups?.find(group=>group.name===choiceGroup)?.options.includes(option.value))):[];

  function renderField(section,field) {
    const value=person.dna[section]?.[field.key];
    const summary=section==='physique'?sizeControlSummary(field.key,person.dna.physique):null;
    const text=summary || (Array.isArray(value)?value.map(v=>field.optionLabels?.[v] || v).join(', '):field.optionLabels?.[value] || value);
    const disabled=!!person.locks[section] || !!person.field_locks[section]?.[field.key] ||
      (section==='wardrobe' && field.key!=='outfit_set' && wardrobeFieldDisabled(field.key,person.dna.wardrobe));
    const suffix=section==='physique' && ['bust_scale','butt_scale','hip_scale','thigh_scale','waist_scale'].includes(field.key)?' · slider':'';
    return <button key={`${section}.${field.key}`} type="button" className="cs-field" disabled={disabled} onClick={()=>open({type:'field',section,field:field.key,title:field.label})}>
      <span><small>{field.label}{suffix}</small><strong>{mode==='describe' && !Object.prototype.hasOwnProperty.call(sceneOverrides,`${section}.${field.key}`)?'Use prompt description':text===0?'0':text || 'Not selected'}</strong></span>
      <span className="cs-field-action">{disabled?(person.locks[section] || person.field_locks[section]?.[field.key]?'Locked':'Change mode'): <ChevronRight size={15}/>}</span>
    </button>;
  }
  const allowed=panel==='scene'?sceneSections:characterSections;
  const groups=category==='physique'?BODY_GROUPS:category==='intimate'?INTIMATE_DETAIL_GROUPS:category==='wardrobe'?wardrobeGroups(sectionFor('wardrobe').fields):[];
  const groupKey=category==='physique'?bodyGroup:category==='intimate'?intimateGroup:outfitGroup;
  const activeFields=(sectionFor(category)?.fields || []).filter(field=>
    category==='identity'?field.key!=='name':category==='physique'?BODY_GROUPS.find(group=>group.key===bodyGroup)?.fields.includes(field.key):
    category==='intimate'?INTIMATE_DETAIL_GROUPS.find(group=>group.key===intimateGroup)?.fields.includes(field.key):category==='wardrobe'?field.key==='outfit_mode' || groups.find(group=>group.key===outfitGroup)?.fields.some(f=>f.key===field.key):true);
  const matched=matchingWorkspaceFields(allowed.map(key=>({...sectionFor(key),title:sectionNames[key]})),detailQuery).filter(item=>item.section!=='identity' || item.field.key!=='name');
  const navigationContent=<nav className="cs-navigation" aria-label="Studio navigation">{navigation.map(item=><Link key={item.to} to={item.to} aria-current={item.to==='/create'?'page':undefined}><item.icon size={21} strokeWidth={1.7}/><span>{item.label}</span></Link>)}<div className="cs-nav-extra"><Link to="/create/guided">Guided editor</Link><Link to="/character/new">Classic editor</Link></div></nav>;

  const inspectorContent=<>
    <div className="cs-inspector-heading"><span className="cs-eyebrow">WORKSPACE</span><h2>{panel==='output'?'Output settings':panel==='scene'?'Build the scene':panel==='prompt'?(mode==='image'?'Describe the edit':'Describe your image'):'Your character'}</h2></div>
    <fieldset disabled={locked} className="cs-controls">
      {panel==='character' && <>
        <div className="cs-person-bar"><select aria-label="Selected person" value={active} onChange={event=>setActive(Number(event.target.value))}>{people.map((p,index)=><option key={index} value={index}>Person {index+1} · {p.name}</option>)}</select>
          {people.length===1?<button type="button" className="cs-square" aria-label="Add another person" onClick={()=>{setPeople(current=>[...current,previewPerson()]);setActive(1);}}><Plus size={18}/></button>:<button type="button" className="cs-text-button" onClick={()=>{setPeople(current=>current.filter((_,index)=>index!==active));setActive(0);}}>Remove</button>}</div>
        <label className="cs-label">Character name<input value={person.name} onChange={event=>setPeople(current=>current.map((p,index)=>index===active?{...p,name:event.target.value}:p))}/></label>
        <div className="cs-inline-actions"><button type="button" onClick={loadCharacters}>Use saved character</button><button type="button" onClick={()=>open({type:'new',title:'Start a new character?'})}>Start fresh</button></div>
        {people.length>1 && <label className="cs-label">Relationship<select value={relationship} onChange={event=>setRelationship(event.target.value)}>{['Choose later','Friends','Colleagues'].map(value=><option key={value}>{value}</option>)}</select></label>}
      </>}
      {panel==='prompt' && <>
        {mode==='image' && <label className="cs-upload"><ImagePlus size={24}/><strong>{file?.name || 'Choose a starting image'}</strong><span>JPG, PNG or WebP · up to 20 MB</span>{initialDraft?.mode==='image' && !file && <span>Choose the file again after refreshing.</span>}<input aria-label="Starting image" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>}
        <label className="cs-label">{mode==='image'?'What should change?':'Your image idea'}<textarea aria-label="Image description" rows={7} value={mode==='image'?instruction:description} onChange={event=>mode==='image'?setInstruction(event.target.value):setDescription(event.target.value)} placeholder={mode==='image'?'Change the jacket to navy. Keep everything else.':'A relaxed portrait in a bright studio, soft daylight…'}/></label>
        <p className="cs-note">{mode==='image'?'Your selected edit workflow preserves unmentioned details.':'Your words go to the selected workflow. Scene choices can add a coordinated setting.'}</p>
      </>}
      {(panel==='character' || panel==='scene') && <>
        {mode==='describe' && <p className="cs-note">Only details you change here are added to your prompt. {Object.keys(sceneOverrides).length>0 && <button type="button" className="cs-text-button" onClick={()=>setSceneOverrides({})}>Use prompt only</button>}</p>}
        <label className="cs-search"><span className="cs-sr-only">Find a detail</span><input type="search" aria-label="Find a detail" placeholder="Find a detail…" value={detailQuery} onChange={event=>setDetailQuery(event.target.value)}/></label>
        {!detailQuery && <>
          <div className="cs-category-grid" role="group" aria-label="Detail categories">{allowed.map(key=><button type="button" key={key} className={['physique','intimate'].includes(key)?'cs-feature-category':''} aria-pressed={category===key} onClick={()=>setCategory(key)}>{sectionNames[key]}</button>)}</div>
          {['physique','intimate'].includes(category)?<section className="cs-feature-groups" aria-label={`${sectionNames[category]} categories`}><h3>{sectionNames[category]}</h3><p className="cs-note">{category==='physique'?'Choose a body region to edit presets, shape and size sliders.':'Grooming and non-explicit anatomy details. Clothing coverage still controls which details enter the image prompt.'}</p><div role="group" aria-label="Feature groups">{groups.map(group=><button type="button" key={group.key} aria-pressed={groupKey===group.key} onClick={()=>category==='physique'?setBodyGroup(group.key):setIntimateGroup(group.key)}>{group.label}</button>)}</div></section>:!!groups.length && <label className="cs-label">Wardrobe category<select value={groupKey} onChange={event=>setOutfitGroup(event.target.value)}>{groups.map(group=><option key={group.key} value={group.key}>{group.label}</option>)}</select></label>}
          {category==='wardrobe' && <p className="cs-note">Complete sets coordinate the outfit. Choose Custom in Outfit mode to edit separate garments, shoes and accessories.</p>}
        </>}
        <div className="cs-field-list">{detailQuery?matched.length?matched.map(item=>renderField(item.section,item.field)):<p className="cs-note" role="status">No matching details. Try another word.</p>:activeFields.map(field=>renderField(category,field))}</div>
      </>}
      {panel==='output' && <>
        <label className="cs-label">Workflow<select aria-label="Workflow" value={generation.workflow?.id || ''} onChange={event=>generation.chooseWorkflow(event.target.value)}>{generation.workflows.map(workflow=><option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}</select></label>
        <div className="cs-two-columns"><label className="cs-label">Images<select value={count} onChange={event=>setCount(Number(event.target.value))}>{[1,2,4].map(value=><option key={value}>{value}</option>)}</select></label><label className="cs-label">Shape<select value={shape} disabled={mode==='image'} onChange={event=>setShape(event.target.value)}>{['Portrait','Square','Landscape'].map(value=><option key={value}>{value}</option>)}</select></label></div>
        <p className="cs-note">{mode==='image'?"Image edits retain the selected workflow’s canvas.":'Each image uses a different seed and is saved to Gallery.'}</p>
        <details className="cs-advanced" open={advancedOpen} onToggle={event=>setAdvancedOpen(event.currentTarget.open)}><summary>Advanced controls</summary>{advancedOpen && <div className="cs-advanced-content"><label className="cs-label">Seed · blank for random<input value={generation.seed} onChange={event=>generation.setSeed(event.target.value)}/></label><label className="cs-label">Negative prompt<textarea rows={3} value={generation.negative} onChange={event=>generation.setNegative(event.target.value)}/></label>
          {mode!=='image' && generation.workflow && <UniversalLoraPicker workflow={generation.workflow} value={generation.lora} onChange={generation.setLora}/>}
          <label className="cs-label">Final prompt<textarea aria-label="Final prompt" readOnly rows={5} value={generation.prompt.positive}/></label><p className="cs-note">Sampling settings come from the selected workflow.</p><Link to={generation.saved?.id?`/character/${generation.saved.id}`:'/character/new'}>Open classic editor{generation.saved?.id?' with this saved character':''}</Link>{!generation.saved && mode==='character' && <p className="cs-note">Save a copy first to carry this character into the classic editor.</p>}</div>}</details>
      </>}
    </fieldset>
  </>;
  const panelOptions=mode==='character'?[['character','Character',UsersRound],['scene','Scene',Layers],['output','Output',SlidersHorizontal]]:
    [['prompt',mode==='image'?'Edit':'Prompt',ImagePlus],...(mode==='describe'?[['scene','Scene',Layers]]:[]),['output','Output',SlidersHorizontal]];
  const panelTabs=<div className="cs-panel-tabs" role="group" aria-label="Editing panels">{panelOptions.map(([id,label,Icon])=><button key={id} type="button" aria-pressed={panel===id} onClick={()=>selectPanel(id)}><Icon size={16}/>{label}</button>)}</div>;

  return <div className="canvas-studio">
    <a className="cs-skip" href="#studio-canvas">Skip to canvas</a>
    <aside className="cs-rail"><Link to="/create" className="cs-mark" aria-label="Ultra Studio home">U<span>•</span></Link>{navigationContent}<span className="cs-rail-caption">ULTRA</span></aside>
    <header className="cs-header"><div className="cs-header-title"><button type="button" className="cs-mobile-menu cs-square" aria-label="Open studio navigation" onClick={()=>open({type:'navigation',title:'Ultra Studio'})}><Menu size={20}/></button><div><span className="cs-eyebrow">ULTRA STUDIO</span><h1>{title}</h1></div><span className="cs-draft">{generation.saved?'Copy saved':draftSaved?'Draft kept in this tab':'Working draft'}</span></div><div className="cs-header-actions">{mode==='character' && <><button type="button" className="cs-icon-label" disabled={locked} onClick={()=>open({type:'randomizers',title:'Randomize'})}><Shuffle size={17}/><span>Randomize</span></button><button type="button" className="cs-save" disabled={locked} onClick={generation.save}>{generation.busy==='Saving'?'Saving…':'Save a copy'}</button></>}</div></header>
    <main id="studio-canvas" tabIndex={-1} className="cs-canvas-area">
      <div className="cs-canvas-toolbar"><div className="cs-modes" role="group" aria-label="Creation mode">{modes.map(item=><button key={item.id} type="button" disabled={locked} aria-pressed={mode===item.id} onClick={()=>selectMode(item.id)}>{item.label}</button>)}</div><span className="cs-canvas-meta">{mode==='image'?'Reference edit':shape}</span></div>
      <div className="cs-stage">
        {canvasImage?<figure className="cs-image-frame"><img src={mediaUrl(canvasImage)} alt={output?'Generated result':'Selected reference'}/>{!output && <figcaption>Reference image · edits appear after generation</figcaption>}</figure>:<div className="cs-empty"><span className="cs-empty-symbol"><WandSparkles size={32} strokeWidth={1.3}/></span><span className="cs-eyebrow">YOUR NEXT CREATION</span><h2>Make something<br/>uniquely yours.</h2><p>{mode==='character'?'Shape a character in the panel. Your image will take center stage.':mode==='describe'?'Describe an image in the editing panel, then generate.':'Choose a starting image and describe the change.'}</p>{mode==='character' && <button type="button" className="cs-empty-action" disabled={locked} onClick={loadCharacters}><UsersRound size={17}/>Use a saved character<ChevronRight size={16}/></button>}</div>}
        {generation.pending && <div className="cs-generating" role="status"><span/>Creating {generation.renders.length} image{generation.renders.length>1?'s':''}…</div>}
      </div>
      <div className="cs-canvas-bottom"><span>{output?'Last result · edits apply on Generate':canvasImage?'Reference':'Canvas ready'}{outputs.length?` · ${outputs.length} result${outputs.length>1?'s':''}`:''}</span>{canvasImage && <div><button type="button" aria-label="Enlarge image" onClick={()=>open({type:'image',title:output?'Generated image':'Reference image'})}><Maximize2 size={17}/></button>{output && <a href={mediaUrl(output.url)} target="_blank" rel="noreferrer" aria-label="Open image to download"><Download size={17}/></a>}</div>}</div>
      {!!outputs.length && <div className="cs-filmstrip" aria-label="Generated images">{outputs.map((item,index)=><button type="button" key={`${item.id}-${index}`} aria-label={`View result ${index+1}`} aria-pressed={output?.url===item.url} onClick={()=>setSelectedOutput(item.url)}><img src={mediaUrl(item.url)} alt=""/></button>)}</div>}
      {(error || generation.error || generation.promptError || generation.pollError) && <p className="cs-error" role="alert">{error || generation.error || generation.promptError || generation.pollError}</p>}
      {generation.saved && <p className="cs-save-status" role="status">Copy saved. <Link to={`/character/${generation.saved.id}`}>Open saved character</Link></p>}
      {generation.renders.some(render=>['failed','offline','cancelled'].includes(render.status)) && <div className="cs-error" role="alert">{generation.renders.filter(render=>['failed','offline','cancelled'].includes(render.status)).map(render=><p key={render.id}>{render.error || `Image ${render.status}`}</p>)}<Link to="/queue">Open queue</Link></div>}
    </main>
    <aside className="cs-inspector" aria-label="Editing inspector">{panelTabs}<div className="cs-inspector-scroll">{inspectorContent}</div></aside>
    <footer className="cs-generate-bar"><div className="cs-model-summary"><span className="cs-ready-dot"/><span>{generation.loading?'Loading workflows…':generation.workflow?.name || 'Select a compatible workflow'}</span>{!generation.loading && !generation.workflow && <button type="button" onClick={generation.load}>Retry</button>}</div><div className="cs-generate-actions"><span>{count} image{count>1?'s':''}</span><button type="button" className="cs-generate" disabled={locked || !ready} onClick={generation.generate}><WandSparkles size={17}/>{generation.busy || (generation.pending?'Creating…':'Generate')}</button></div></footer>
    <div className="cs-mobile-panels">{panelOptions.map(([id,label,Icon])=><button type="button" key={id} onClick={()=>{selectPanel(id);open({type:'inspector',title:label});}}><Icon size={18}/>{label}</button>)}</div>
    <Dialog open={!!dialog} onOpenChange={value=>{if(!value)closeDialog();}}><DialogContent className={`cs-dialog ${dialog?.type==='inspector'?'cs-sheet':''} ${dialog?.type==='randomizers'?'cs-randomizers-dialog':''}`}><DialogTitle>{dialog?.title || 'Choose a detail'}</DialogTitle><DialogDescription>{dialog?.type==='inspector'?'Edit your setup. Choices update the draft.':dialog?.type==='randomizers'?'Preview a coherent variation before applying.':dialog?.type==='library'?'Use a saved character without changing the original.':dialog?.type==='new'?'Replace the selected person’s unsaved draft with a fresh character.':dialog?.type==='image'?'Your selected image.':choiceField?.type==='chips_multi'?'Choose any that apply.':'Choose one option.'}</DialogDescription>
      {dialog?.type==='inspector'?<>{panelTabs}{inspectorContent}</>:dialog?.type==='navigation'?navigationContent:dialog?.type==='randomizers'?<RandomizerSuites people={people} active={active} busy={locked} onApply={next=>{setPeople(next);setSceneName('Use current scene');}}/>:dialog?.type==='new'?<div className="cs-dialog-actions"><button type="button" disabled={locked} onClick={resetCharacter}>Start fresh</button><button type="button" onClick={closeDialog}>Keep editing</button></div>:dialog?.type==='image'?<img className="cs-expanded-image" src={mediaUrl(canvasImage)} alt={output?'Generated result':'Selected reference'}/>:dialog?.type==='library'?<><input type="search" aria-label="Find saved character" placeholder="Search characters…" value={query} onChange={event=>setQuery(event.target.value)}/>{libraryState==='loading'?<p role="status">Loading characters…</p>:libraryState==='error'?<p role="alert">Could not load characters. <button type="button" onClick={loadCharacters}>Try again</button></p>:<div className="cs-library-grid">{characters.filter(item=>(item.name || '').toLowerCase().includes(query.toLowerCase())).map(item=><button type="button" key={item.id} onClick={()=>chooseCharacter(item)}>{item.thumbnail?<img src={mediaUrl(item.thumbnail)} alt=""/>:<UsersRound size={30}/>}<strong>{item.name || 'Untitled'}</strong></button>)}{!characters.some(item=>(item.name || '').toLowerCase().includes(query.toLowerCase())) && <p>No matching characters. You can build a new one in the inspector.</p>}</div>}</>:choiceField && <fieldset disabled={locked} className="cs-choice-controls">
        {['slider','text'].includes(choiceField.type)?<label className="cs-label">{choiceField.label}{choiceField.type==='slider'?<><input aria-label={choiceField.label} type="range" min={choiceField.min} max={choiceField.max} step={choiceField.step || 1} value={choiceValue ?? choiceField.defaultValue ?? choiceField.min} onChange={event=>changeField(dialog.section,dialog.field,Number(event.target.value))}/><output>{choiceValue ?? choiceField.defaultValue ?? choiceField.min}</output></>:<input aria-label={choiceField.label} value={choiceValue || ''} onChange={event=>changeField(dialog.section,dialog.field,event.target.value)}/>}</label>:<><input autoFocus type="search" aria-label="Find an option" placeholder="Search options…" value={query} onChange={event=>setQuery(event.target.value)}/>{!!choiceField.groups?.length && <label className="cs-label">Collection<select aria-label="Option collection" value={choiceGroup} onChange={event=>setChoiceGroup(event.target.value)}><option>All</option>{choiceField.groups.map(group=><option key={group.name}>{group.name}</option>)}</select></label>}<div className="cs-option-list">{choices.map(option=><button type="button" key={option.value} disabled={workspaceFieldLocked(person,dialog.section,dialog.field,option.value)} aria-pressed={Array.isArray(choiceValue)?choiceValue.includes(option.value):choiceValue===option.value} onClick={()=>{const value=choiceField.type==='chips_multi'?(Array.isArray(choiceValue)?choiceValue.includes(option.value)?choiceValue.filter(item=>item!==option.value):[...choiceValue,option.value]:[option.value]):option.value;changeField(dialog.section,dialog.field,value);if(choiceField.type!=='chips_multi')closeDialog();}}>{option.label}<span>{(Array.isArray(choiceValue)?choiceValue.includes(option.value):choiceValue===option.value)?'✓':''}</span></button>)}{!choices.length && <p>No matching options. Try another search.</p>}</div></>}
        {choiceField.help && <p className="cs-note">{choiceField.help}</p>}{dialog.section==='physique' && physiqueControlStatus(dialog.field,person.dna.physique)?.text && <p className="cs-note">{physiqueControlStatus(dialog.field,person.dna.physique).text}</p>}<button type="button" className="cs-save" onClick={closeDialog}>Done</button>
      </fieldset>}
    </DialogContent></Dialog>
  </div>;
}
