import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Images, UserRound, Type, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { endpoints } from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import { PREVIEW_FLOWS, PREVIEW_SCENES, PREVIEW_OUTFITS, previewPerson, previewOptions, previewCanContinue, previewCopy } from '@/lib/workspacePreview';
import { SECTIONS, seedSubjectFromPairing } from '@/lib/dna';
import { applyScenarioSelection } from '@/lib/scenarioSelection';
import { INTIMATE_DETAIL_GROUPS, studioFeatureOptions, studioFeatureSection } from '@/lib/studioFeatures';
import { BODY_GROUPS, workspaceSection, updateWorkspaceField, workspaceFieldLocked, wardrobeFieldDisabled } from '@/lib/workspaceFields';
import { proposeRandomizer } from '@/lib/randomizerSuites';
import { wardrobeGroups } from '@/lib/wardrobeLayout';
import { physiqueControlStatus, sizeControlSummary } from '@/lib/physiqueControlPriority';
import { matchingWorkspaceFields, workspaceStepEnabled } from '@/lib/workspaceNavigation';
import { useWorkspaceGeneration } from '@/hooks/useWorkspaceGeneration';
import useSmartPhotoshootPlan from '@/hooks/useSmartPhotoshootPlan';
import SmartShootEditor from '@/components/SmartShootEditor';
import RandomizerSuites from '@/components/RandomizerSuites';
import UniversalLoraPicker from '@/components/UniversalLoraPicker';
import CastPoseOptions from '@/components/CastPoseOptions';
import CameraOrbitPicker from '@/components/CameraOrbitPicker';
import { sharedCastPose, selectSharedCastPose, editCastPose } from '@/lib/castPoseResolution';
import { usePromptCatalog } from '@/lib/promptCatalog';
import './WorkspacePreview.css';

const OUTFIT_SET_FIELD=SECTIONS.find(section=>section.key==='wardrobe')?.fields.find(field=>field.key==='outfit_set');
const OUTFIT_SET_GROUPS=OUTFIT_SET_FIELD?.groups || [];
const CAST_PAIRING_OPTIONS=SECTIONS.find(section=>section.key==='scenario')?.fields.find(field=>field.key==='cast_type')?.options || ['none'];
const DEFAULT_SMART_SHOOT_OPTIONS={pose:true,camera:true,framing:true,expression:false,wardrobe:false,feet:false,scene:false,lighting:false};

export default function WorkspacePreview() {
  const [mode,setMode]=useState(()=>({describe:'describe',build:'character',image:'image'}[new URLSearchParams(window.location.search).get('start')] || '')),[step,setStep]=useState(0),[people,setPeople]=useState(()=>[previewPerson()]);
  const [active,setActive]=useState(0),[relationship,setRelationship]=useState('none');
  const [description,setDescription]=useState(''),[instruction,setInstruction]=useState(''),[image,setImage]=useState('');
  const [imageName,setImageName]=useState(''),[dialog,setDialog]=useState(null),[query,setQuery]=useState('');
  const [characters,setCharacters]=useState([]),[characterLoading,setCharacterLoading]=useState(false),[characterError,setCharacterError]=useState('');
  const [characterLoaded,setCharacterLoaded]=useState(false),[sceneName,setSceneName]=useState('Use current scene');
  const [count,setCount]=useState(1),[shape,setShape]=useState('Portrait'),[fileError,setFileError]=useState('');
  const heading=useRef(null),fileUrl=useRef(''),alive=useRef(true);
  const [file,setFile]=useState(null);
  const promptCatalog=usePromptCatalog();
  const [appearanceCategory,setAppearanceCategory]=useState('hair');
  const [detailQuery,setDetailQuery]=useState(''),[furthestStep,setFurthestStep]=useState(0);
  const [bodyGroup,setBodyGroup]=useState('build'),[intimateGroup,setIntimateGroup]=useState('grooming'),[wardrobeGroup,setWardrobeGroup]=useState('outfit'),[optionGroup,setOptionGroup]=useState('All');
  const [randomOutfitGroup,setRandomOutfitGroup]=useState('Lingerie sets'),[randomOutfitChoice,setRandomOutfitChoice]=useState('random'),[randomCastCount,setRandomCastCount]=useState(2),[randomStartNotice,setRandomStartNotice]=useState('');
  const [smartShootEnabled,setSmartShootEnabled]=useState(false),[smartPreset,setSmartPreset]=useState(''),[smartStrength,setSmartStrength]=useState('balanced'),[smartShootOptions,setSmartShootOptions]=useState(DEFAULT_SMART_SHOOT_OPTIONS);
  const defaultSmartPreset=people.length>=3?'group_portrait':people.length===2?'duo_editorial':'boudoir';
  const activeSmartPreset=smartPreset || defaultSmartPreset;
  const smartShoot=useSmartPhotoshootPlan({enabled:smartShootEnabled && mode==='character',count,subjects:people,promptCatalog,preset:activeSmartPreset,options:smartShootOptions,customPresets:[],strength:smartStrength});
  const generation=useWorkspaceGeneration({mode,people,relationship,description,instruction,file,count,shape,sceneName,
    smartShootEnabled,smartPreset:activeSmartPreset,smartShootOptions,smartStrength,smartPlan:smartShoot.plan,promptCatalog});
  const locked=!!generation.busy || generation.pending;
  const outputs=generation.renders.flatMap(render=>(render.output_files || []).map(url=>({url,id:render.id})));
  const steps=PREVIEW_FLOWS[mode] || [], key=steps[step]?.key;
  const person=people[active] || people[0];
  const randomOutfitGroups=randomOutfitGroup==='all'?OUTFIT_SET_GROUPS:OUTFIT_SET_GROUPS.filter(group=>group.name===randomOutfitGroup);
  const randomOutfitChoices=[...new Set(randomOutfitGroups.flatMap(group=>group.options))];
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);};},[]);
  useEffect(()=>{heading.current?.focus();setDetailQuery('');setFurthestStep(current=>Math.max(current,step));},[mode,step]);
  const stepEnabled=index=>workspaceStepEnabled(steps,index,furthestStep,{description,instruction,image});
  const open=value=>{setQuery('');setOptionGroup('All');setDialog(value);};
  const changePerson=(section,field,value)=>setPeople(current=>{
    if(section==='pose'){
      const selected=current[active];
      if(!selected)return current;
      return editCastPose(current,selected.id,{...selected.dna.pose,[field]:value},promptCatalog);
    }
    return current.map((p,i)=>i===active?updateWorkspaceField(p,section,field,value):p);
  });
  const fieldLocked=(section,field)=>field==='outfit_mode'?!!(person.locks[section] || person.field_locks[section]?.[field]):workspaceFieldLocked(person,section,field,typeof person.dna[section]?.[field]==='number'?Math.max(1,person.dna[section][field]):person.dna[section]?.[field]);
  function createRandomCharacter() {
    const freshCast=Array.from({length:randomCastCount},(_,index)=>({...previewPerson(),name:randomCastCount===1?'New character':`Person ${index+1}`}));
    const proposal=proposeRandomizer(freshCast,'full-character',{active:0,target:'all',keepIdentity:false,keepBody:false});
    if(proposal.issues.length){setRandomStartNotice(`Could not create this random look: ${proposal.issues.join(' ')}`);return;}
    const choices=randomOutfitChoices;
    if(!choices.length){setRandomStartNotice('No outfits were found for that style. Choose another style and try again.');return;}
    const selectedOutfit=randomOutfitChoice==='random'?null:randomOutfitChoice;
    if(selectedOutfit && !choices.includes(selectedOutfit)){setRandomStartNotice('That outfit is not in the selected Wardrobe category. Choose another outfit and try again.');return;}
    const shuffled=[...choices].sort(()=>Math.random()-.5);
    const sharedPhotoSections=['pose','scene','lighting','camera','style'];
    const nextPeople=proposal.people.map((candidate,index)=>{
      let next={...candidate,name:freshCast[index].name,dna:{...candidate.dna}};
      for(const section of sharedPhotoSections)next.dna[section]=previewCopy(proposal.people[0].dna[section]);
      next=updateWorkspaceField(next,'wardrobe','outfit_set',selectedOutfit || shuffled[index%shuffled.length]);
      return next;
    });
    setPeople(nextPeople);setActive(0);setRelationship('none');
    const outfitSummary=selectedOutfit?`All subjects are wearing “${selectedOutfit}.”`:`Subjects have randomized looks from ${randomOutfitGroup==='all'?'all Wardrobe categories':randomOutfitGroup}.`;
    setRandomStartNotice(`${randomCastCount}-person random shoot created. ${outfitSummary} Select Subject A–D to edit each person’s identity, appearance, and outfit; pose, camera, lighting, and scene are shared. You can edit every setting in the steps ahead.`);setStep(1);
  }
  function changeRelationship(pairing) {
    setRelationship(pairing);
    setPeople(current=>{
      if(!current.length)return current;
      const first=current[0],scenario={...(first.dna.scenario || {}),cast_type:pairing};
      const selected=applyScenarioSelection(current,{...scenario,cast_type:pairing});
      const pairingCount=['triplets','grandmother, mother and daughter'].includes(pairing)?3:Math.max(2,selected.length);
      const next=selected.slice(0,pairingCount);
      while(next.length<pairingCount){
        const added=previewPerson();
        const dna=seedSubjectFromPairing({...first.dna,scenario:{...first.dna.scenario,cast_type:pairing}},next.length);
        added.dna={...added.dna,...dna,wardrobe:added.dna.wardrobe,pose:previewCopy(first.dna.pose)};
        next.push(added);
      }
      return next.map((subject,index)=>index===0?{...subject,dna:{...subject.dna,scenario:{...subject.dna.scenario,cast_type:pairing},_catalogSelections:{...(subject.dna._catalogSelections || {}),scenario:{...(subject.dna._catalogSelections?.scenario || {}),cast_type:pairing}}}}:subject);
    });
  }
  async function loadCharacters() {
    open({type:'characters'});
    if(characterLoaded)return;
    setCharacterLoading(true);setCharacterError('');
    try {const rows=await endpoints.listCharacters();if(alive.current){setCharacters(rows);setCharacterLoaded(true);}}
    catch {if(alive.current)setCharacterError('Could not load saved characters. You can retry or build a new one.');}
    finally {if(alive.current)setCharacterLoading(false);}
  }
  function chooseCharacter(character) {setPeople(current=>current.map((p,i)=>i===active?previewPerson(character):p));setDialog(null);}
  function selectScene(choice) {
    setSceneName(choice.name);
    setPeople(current=>current.map(p=>{
      const dna=previewCopy(p.dna);
      for(const section of ['scene','lighting'])for(const [field,value] of Object.entries(choice[section]))if(!p.locks[section] && !p.field_locks[section]?.[field])dna[section]={...dna[section],[field]:value};
      return {...p,dna};
    }));
  }
  function upload(event) {
    const file=event.target.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>20*1024*1024){setFileError('Choose a JPG, PNG or WebP image under 20 MB.');return;}
    if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);
    fileUrl.current=URL.createObjectURL(file);setImage(fileUrl.current);setImageName(file.name);setFile(file);setFileError('');
  }
  const selectedField=['field','outfits'].includes(dialog?.type)?SECTIONS.find(section=>section.key===(dialog.type==='outfits'?'wardrobe':dialog.section))?.fields.find(field=>field.key===(dialog.type==='outfits'?'outfit_set':dialog.field)):null;
  const appearanceFieldSection=appearanceCategory==='physique' && bodyGroup==='intimate'?'intimate':appearanceCategory;
  const appearanceFields=(appearanceFieldSection==='intimate'?studioFeatureSection('intimate')?.fields:SECTIONS.find(section=>section.key===appearanceFieldSection)?.fields || []).filter(field=>{
    if(appearanceCategory!=='physique')return true;
    if(bodyGroup==='intimate')return INTIMATE_DETAIL_GROUPS.find(group=>group.key===intimateGroup)?.fields.includes(field.key);
    return BODY_GROUPS.find(group=>group.key===bodyGroup)?.fields.includes(field.key);
  });
  const options=dialog?.type==='field'?(dialog.section==='intimate'?studioFeatureOptions('intimate',dialog.field):previewOptions(dialog.section,dialog.field)):dialog?.type==='outfits'?previewOptions('wardrobe','outfit_set'):[];
  const availableGroups=selectedField?.groups || [];
  const filteredOptions=options.filter(option=>option.label.toLowerCase().includes(query.toLowerCase()) && (optionGroup==='All' || availableGroups.find(group=>group.name===optionGroup)?.options.includes(option.value)));
  const wardrobeCategories=wardrobeGroups(workspaceSection('wardrobe').fields);
  const wardrobeFields=wardrobeCategories.find(group=>group.key===wardrobeGroup)?.fields.filter(field=>field.key!=='outfit_mode' && field.key!=='outfit_set') || [];
  const currentValue=dialog?.type==='outfits'?person.dna.wardrobe?.outfit_set:person.dna[dialog?.section]?.[dialog?.field];
  const sceneSummary = people.map(p=>p.dna.scene?.environment || 'Current scene').filter((value,index,all)=>all.indexOf(value)===index).join(' / ');
  const preview=outputs[0]?.url || image || person.thumbnail;
  const previewContent=<><div className="wp-image">{preview?<img src={mediaUrl(preview)} alt={outputs.length?"Generated image":"Selected reference preview"}/>:<div><UserRound size={40} strokeWidth={1}/><p>Your preview will appear here</p></div>}</div><p className="wp-muted wp-caption">{outputs.length?'Generated image. All results are available below.':preview?'Reference image. Your result will appear after generation.':'Your generated image will appear here.'}</p></>;
  const editRow=(title,section,field)=> {
    const isLocked=fieldLocked(section,field),modeDisabled=section==='wardrobe' && wardrobeFieldDisabled(field,person.dna.wardrobe);
    const value=person.dna[section]?.[field];
    const display=(section==='physique' && sizeControlSummary(field,person.dna.physique)) || (Array.isArray(value)?value.join(', '):value);
    const label=workspaceSection(section)?.fields.find(f=>f.key===field)?.optionLabels?.[value];
    const reason=isLocked?'Locked':modeDisabled?'Change outfit mode':'Change';
    return <button type="button" className="wp-detail-row" disabled={isLocked || modeDisabled} title={isLocked?'This detail is locked.':modeDisabled?'Switch Outfit mode to edit this detail.':`Change ${title}`} onClick={()=>open({type:'field',title,section,field})}><span>{title}</span><strong>{label || (display===0?'0':display || 'Choose later')}</strong><span className="wp-muted">{reason}</span></button>;
  };
  const appearanceSearch=matchingWorkspaceFields(SECTIONS.filter(section=>['hair','face','physique','intimate','skin','feet'].includes(section.key)),detailQuery).filter(item=>item.section!=='intimate' || studioFeatureSection('intimate').fields.some(field=>field.key===item.field.key));
  const wardrobeSearch=matchingWorkspaceFields([workspaceSection('wardrobe')],detailQuery).filter(item=>!['outfit_mode','outfit_set'].includes(item.field.key));
  const searchDetails=<label className="wp-detail-search">Find a detail<input type="search" aria-label="Find a character detail" value={detailQuery} placeholder={key==='outfit'?'Shoes, fabric, accessories…':'Hair, hips, skin, feet…'} onChange={e=>setDetailQuery(e.target.value)}/>{detailQuery && <span className="wp-muted" role="status">{(key==='outfit'?wardrobeSearch:appearanceSearch).length} matching details across all categories</span>}</label>;
  const searchRows=items=><div className="wp-search-results">{items.length?items.map(item=><div key={`${item.section}.${item.field.key}`}><small>{item.sectionTitle}</small>{editRow(item.field.label,item.section,item.field.key)}</div>):<p className="wp-muted" role="status">No matching details. Try another word.</p>}</div>;

  return <div className="workspace-preview">
    <a className="wp-skip" href="#workspace-content">Skip to workspace</a><header className="wp-top"><Link to="/create" className="wp-brand">Ultra Studio</Link><span className="wp-preview-label">Create at your own pace</span><Link to="/gallery" target="_blank" rel="noreferrer" className="wp-gallery-link" aria-label="Open Gallery in a new tab to keep your draft open"><Images size={16}/><span>Gallery</span></Link><Link to="/create" className="wp-workflow-link">All workflows</Link><details className="wp-nav-menu"><summary>Workspace</summary><nav aria-label="Workspace navigation"><Link to="/library">Character library</Link><Link to="/gallery">Gallery</Link><Link to="/queue">Render queue</Link><Link to="/create/tools">All creation tools</Link><Link to="/settings">Settings</Link></nav></details></header>
    {!mode?<main id="workspace-content" tabIndex={-1} className="wp-start">
      <span className="wp-eyebrow">Create something new</span><h1 ref={heading} tabIndex={-1}>What would you like to create?</h1><p className="wp-intro">Choose a starting point. We’ll take it one step at a time.</p>
      <div className="wp-start-options">{[{id:'new',title:'Create a new character',detail:'Build their identity, appearance and style.',icon:Plus},{id:'character',title:'Use a saved character',detail:'Choose someone from your library.',icon:UserRound},{id:'describe',title:'Describe an image',detail:'Start with a few words.',icon:Type},{id:'image',title:'Use an existing image',detail:'Choose a photo and describe a change.',icon:ImagePlus}].map(item=><button type="button" key={item.id} onClick={()=>{generation.clearResults();if(item.id!=='image'){if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);fileUrl.current='';setImage('');setImageName('');setFile(null);}setFurthestStep(0);setMode(item.id==='new'?'character':item.id);setStep(0);if(item.id==='new'){setPeople([previewPerson()]);setActive(0);setRelationship('none');setSceneName('Use current scene');setAppearanceCategory('hair');}if(item.id==='character')loadCharacters();}}><item.icon size={25} strokeWidth={1.5}/><strong>{item.title}</strong><span>{item.detail}</span><ArrowRight size={18}/></button>)}</div>
    </main>:<>
      <div className="wp-progress"><button type="button" className="wp-text-button" disabled={locked} onClick={()=>{setMode('');setStep(0);}}><ArrowLeft size={16}/>Starting point</button><nav aria-label="Workspace progress">{steps.map((item,index)=><button key={item.key} type="button" aria-current={index===step?'step':undefined} onClick={()=>{if(stepEnabled(index))setStep(index);}} disabled={locked || !stepEnabled(index)}><span>{index<step?<Check size={13}/>:index+1}</span><b>{item.label}</b></button>)}</nav><label className="wp-mobile-progress"><span className="wp-sr-only">Jump to a visited step</span><select aria-label="Jump to a visited step" value={step} disabled={locked} onChange={e=>setStep(Number(e.target.value))}>{steps.map((item,index)=><option key={item.key} value={index} disabled={!stepEnabled(index)}>Step {index+1} of {steps.length} · {item.label}</option>)}</select></label></div>
      <main id="workspace-content" tabIndex={-1} className="wp-workspace">
        <section className="wp-editor" aria-label="Active editing step">
          <fieldset disabled={locked} className="wp-edit-fields">
          <div className="wp-step-heading"><div><span className="wp-eyebrow">{key==='review'?'Your next image':`Step ${step+1}`}</span><h1 ref={heading} tabIndex={-1}>{({person:'Who is in your photo?',appearance:'Make the character your own',outfit:'What are they wearing?',scene:'Where is the photo taken?',review:'Everything look right?',description:'Describe your image',source:'Choose your starting image',instruction:'What would you like to change?'})[key]}</h1></div>{mode==='character' && <button type="button" className="wp-button wp-secondary" onClick={()=>open({type:'randomizers',title:'Randomize your character'})}>Randomize</button>}<button type="button" className="wp-icon-button" aria-label="More image settings" onClick={()=>open({type:'settings'})}><SlidersHorizontal size={19}/></button></div>
          {(key==='description' || key==='instruction') && <div className="wp-block"><label htmlFor="wp-description">{key==='description'?'What do you have in mind?':'Describe only the change you want'}</label><textarea id="wp-description" rows={5} value={key==='description'?description:instruction} onChange={e=>key==='description'?setDescription(e.target.value):setInstruction(e.target.value)} placeholder={key==='description'?'A relaxed portrait in a bright studio…':'Change the jacket to navy and keep the rest…'}/><p className="wp-muted">Your description goes directly to the selected image workflow. You can review the final prompt in image settings.</p></div>}
          {key==='source' && <div className="wp-upload"><ImagePlus size={34} strokeWidth={1}/><strong>{imageName || 'Choose an image'}</strong><p className="wp-muted">JPG, PNG or WebP · up to 20 MB</p><label className="wp-button wp-secondary">Browse images<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>{fileError && <p role="alert">{fileError}</p>}</div>}
          {mode==='character' && <div className="wp-person-switch" role="group" aria-label="Choose subject to edit"><span>{people.length===1?'One subject':`${people.length} subjects · edit individually`}</span>{people.length>1 && people.map((p,index)=>{const letter=String.fromCharCode(65+index);return <button type="button" key={p.id || index} aria-label={`Edit Subject ${letter}`} aria-pressed={active===index} onClick={()=>setActive(index)}><strong>Subject {letter}</strong><small>{p.name}</small></button>;})}</div>}
          {key==='person' && <div className="wp-block"><div className="wp-character-card"><div className="wp-avatar">{person.thumbnail?<img src={mediaUrl(person.thumbnail)} alt="Selected character"/>:<UserRound size={32} strokeWidth={1.3}/>}</div><div><strong>{person.name}</strong><p className="wp-muted">{person.dna.identity?.archetype || 'Choose a saved character or start with the basics.'}</p></div><button type="button" className="wp-button wp-secondary" onClick={loadCharacters}>Choose character</button></div><div className="wp-basic-fields"><label>Name<input value={person.name} onChange={e=>setPeople(current=>current.map((p,i)=>i===active?{...p,name:e.target.value}:p))}/></label><label>Age<input type="number" min="18" max="80" value={person.dna.identity?.age ?? 30} disabled={fieldLocked('identity','age')} onChange={e=>changePerson('identity','age',Math.max(18,Math.min(80,Number(e.target.value)||30)))}/></label></div>{editRow('Gender','identity','gender')}{editRow('Heritage','identity','ethnicity')}{editRow('Character theme','identity','archetype')}{people.length>1 && <label>Relationship / cast pairing<select aria-label="Relationship / cast pairing" value={relationship} onChange={e=>changeRelationship(e.target.value)}>{CAST_PAIRING_OPTIONS.map(value=><option key={value} value={value}>{value==='none'?'Choose later':value}</option>)}</select><span className="wp-muted">Pairing cues are included in the group prompt. When adding a subject, family pairings can suggest related adult features and ages; each person remains editable.</span></label>}{people.length<4 && <button type="button" className="wp-text-button" onClick={()=>{setPeople(current=>{const first=current[0] || previewPerson();const pairing=first.dna.scenario?.cast_type || relationship;const added=previewPerson();if(pairing && pairing!=='none'){const dna=seedSubjectFromPairing(first.dna,current.length);added.dna={...added.dna,...dna,wardrobe:added.dna.wardrobe,pose:previewCopy(first.dna.pose)};}return [...current,added];});setActive(people.length);}}><Plus size={16}/>Add another person</button>}{people.length>1 && <button type="button" className="wp-text-button" onClick={()=>{setPeople(current=>current.filter((_,i)=>i!==active));setActive(0);}}>Remove this person</button>}</div>}
          {key==='person' && <section className="wp-random-starter" aria-label="Random character starter"><h2>Quick start: random cast + outfits</h2><p className="wp-muted">Create 1–4 adult characters with wardrobe looks and shared pose, camera, lighting, and scene. Choose a Wardrobe category, then pick one exact look or let Studio randomize each subject. Your current draft is replaced; all settings remain editable.</p><div className="wp-random-starter-options"><label>People in this shoot<select aria-label="Random cast size" value={randomCastCount} onChange={event=>setRandomCastCount(Number(event.target.value))}>{[1,2,3,4].map(value=><option key={value} value={value}>{value} {value===1?'person':'people'}</option>)}</select></label><label>Wardrobe category<select aria-label="Wardrobe category" value={randomOutfitGroup} onChange={event=>{setRandomOutfitGroup(event.target.value);setRandomOutfitChoice('random');}}><option value="all">Any Wardrobe category</option>{OUTFIT_SET_GROUPS.map(group=><option key={group.name} value={group.name}>{group.name}</option>)}</select></label><label>Specific outfit<select aria-label="Specific outfit" value={randomOutfitChoice} onChange={event=>setRandomOutfitChoice(event.target.value)}><option value="random">Random from this category</option>{randomOutfitChoices.map(value=><option key={value} value={value}>{OUTFIT_SET_FIELD?.optionLabels?.[value] || value}</option>)}</select></label></div><button type="button" className="wp-button wp-secondary" onClick={createRandomCharacter}>{randomCastCount===1?'Create random person':`Create random ${randomCastCount}-person shoot`}</button></section>}
          {key==='appearance' && randomStartNotice && <p className="wp-selection" role="status">{randomStartNotice}</p>}
          {key==='appearance' && <div className="wp-block"><p className="wp-muted">Build one part of the character at a time. All details are optional.</p>{searchDetails}{detailQuery?searchRows(appearanceSearch):<><div className="wp-appearance-tabs" role="group" aria-label="Appearance categories">{[['hair','Hair'],['face','Face'],['physique','Body build'],['skin','Skin'],['feet','Feet']].map(([category,label])=><button type="button" key={category} aria-pressed={appearanceCategory===category} onClick={()=>setAppearanceCategory(category)}>{label}</button>)}</div>{appearanceCategory==='physique' && <><div className="wp-appearance-tabs" role="group" aria-label="Body build categories">{[...BODY_GROUPS,{key:'intimate',label:'Intimate details'}].map(group=><button type="button" key={group.key} aria-pressed={bodyGroup===group.key} onClick={()=>setBodyGroup(group.key)}>{group.label}</button>)}</div>{bodyGroup==='intimate' && <><p className="wp-muted">Intimate detail controls are grouped below. Wardrobe coverage still determines which details are included in a generated prompt.</p><div className="wp-appearance-tabs" role="group" aria-label="Intimate detail categories">{INTIMATE_DETAIL_GROUPS.map(group=><button type="button" key={group.key} aria-pressed={intimateGroup===group.key} onClick={()=>setIntimateGroup(group.key)}>{group.label}</button>)}</div></>}</>}<div aria-label={`${appearanceFieldSection} details`}>{appearanceFields.map(field=><div key={field.key}>{editRow(appearanceFieldSection==='hair'?`Hair ${field.label.toLowerCase()}`:`${field.label}${appearanceFieldSection==='physique' && ['bust_scale','butt_scale','thigh_scale','hip_scale','waist_scale'].includes(field.key)?' (slider)':appearanceFieldSection==='physique' && ['bust','butt','thighs','hips','waist'].includes(field.key)?' (preset)':''}`,appearanceFieldSection,field.key)}</div>)}</div></>}</div>}
          {key==='outfit' && <div className="wp-block"><p className="wp-muted">Choose one coordinated outfit. You can keep your existing selection.</p><details className="wp-more-details wp-outfit-suggestions"><summary>Suggested outfits</summary><div className="wp-choices">{PREVIEW_OUTFITS.map((value,index)=><button type="button" key={value} disabled={fieldLocked('wardrobe','outfit_set') || fieldLocked('wardrobe','outfit_mode')} aria-pressed={person.dna.wardrobe?.outfit_set===value} onClick={()=>changePerson('wardrobe','outfit_set',value)}><span className="wp-choice-art">{['01','02','03'][index]}</span><strong>{['Embroidered & relaxed','Tailored linen','Cotton day dress'][index]}</strong><span>{value}</span></button>)}</div></details><button type="button" className="wp-text-button" disabled={fieldLocked('wardrobe','outfit_set') || fieldLocked('wardrobe','outfit_mode')} onClick={()=>open({type:'outfits',title:'Choose an outfit'})}>Browse outfit choices<ArrowRight size={16}/></button>{editRow('Outfit mode','wardrobe','outfit_mode')}{searchDetails}{detailQuery?searchRows(wardrobeSearch):<><div className="wp-appearance-tabs" role="group" aria-label="Wardrobe categories">{wardrobeCategories.map(group=><button type="button" key={group.key} aria-pressed={wardrobeGroup===group.key} onClick={()=>setWardrobeGroup(group.key)}>{group.label}</button>)}</div><p className="wp-muted">Full set coordinates the outfit. Switch Outfit mode to Custom to edit individual garments, shoes and accessories.</p>{wardrobeFields.map(field=><div key={field.key}>{editRow(field.label,'wardrobe',field.key)}</div>)}</>}{person.dna.wardrobe?.outfit_set && <p className="wp-selection">Selected: {person.dna.wardrobe.outfit_set}</p>}</div>}
          {key === 'scene' && (
            <div className="wp-block">
              <div className="wp-choices">
                {PREVIEW_SCENES.map(choice => (
                  <button type="button" key={choice.name} aria-pressed={sceneName === choice.name} onClick={() => selectScene(choice)}>
                    <span className={`wp-scene-art wp-scene-${choice.scene.environment.replace(' ', '-')}`} />
                    <strong>{choice.name}</strong>
                    <span>{choice.description}</span>
                  </button>
                ))}
              </div>
              <p className="wp-muted">Scene presets coordinate the setting and light. Saved locks are kept.</p>
              {mode === 'character' && (
                <>
                  {people.length > 1 && (
                    <CastPoseOptions
                      count={people.length}
                      value={sharedCastPose(people, promptCatalog)}
                      onSelect={pose => setPeople(current => selectSharedCastPose(current, pose))}
                      onClear={() => setPeople(current => editCastPose(
                        current,
                        current[0]?.id,
                        { ...(current[0]?.dna?.pose || {}), action: '' },
                        promptCatalog
                      ))}
                    />
                  )}
                  {editRow('Pose', 'pose', 'action')}
                  {editRow('Framing', 'pose', 'distance')}
                  <CameraOrbitPicker
                    value={person.dna.pose?.angle || ''}
                    disabled={locked || fieldLocked('pose', 'angle')}
                    onChange={angle => setPeople(current => editCastPose(
                      current,
                      current[active]?.id,
                      { ...(current[active]?.dna?.pose || {}), angle },
                      promptCatalog
                    ))}
                  />
                </>
              )}
            </div>
          )}
          {key==='review' && <div className="wp-review">{steps.slice(0,-1).map((item,index)=><button type="button" key={item.key} onClick={()=>setStep(index)}><span><strong>{item.label}</strong><small>{({person:people.map(p=>p.name).join(' & '),appearance:people.map(p=>[p.dna.hair?.style,p.dna.hair?.color].filter(Boolean).join(' · ') || 'Current appearance').join(' / '),outfit:people.map(p=>p.dna.wardrobe?.outfit_set || 'Current outfit').join(' / '),scene:sceneSummary,description,source:imageName,instruction})[item.key]}</small></span><span>Edit</span></button>)}<div className="wp-review-settings"><span>{count} image{count>1?'s':''} · {shape}</span><button type="button" className="wp-text-button" onClick={()=>open({type:'settings'})}>Change</button></div><div className="wp-review-settings"><span>{generation.loading?'Loading workflows…':generation.workflow?.name || 'No compatible workflow available'}</span><button type="button" className="wp-text-button" onClick={()=>open({type:'settings'})}>Image settings</button></div>{mode==='character' && <div className="wp-save"><button type="button" className="wp-button wp-secondary" onClick={generation.save}>Save as new character</button>{generation.saved && <div className="wp-save-actions" role="status"><p>Character saved. Continue with a photoshoot or refine every detail in the full editor.</p><Link className="wp-button wp-primary" to={`/shoot/new/${generation.saved.id}`}>Plan this character’s photoshoot</Link><Link className="wp-text-button" to={`/character/${generation.saved.id}`}>Open full character editor</Link></div>}</div>}<p className="wp-muted">Generated images are saved to your Gallery automatically.</p></div>}
          </fieldset>
          {(generation.error || generation.promptError) && <p className="wp-error" role="alert">{generation.error || generation.promptError}</p>}
          {generation.loading ? <p role="status">Loading image workflows…</p> : !generation.workflow && <p role="status">No compatible workflow is available. <Link to="/settings">Check workflows in Settings</Link>. <button type="button" className="wp-text-button" onClick={generation.load}>Reload workflows</button></p>}
          {!!generation.renders.length && <section className="wp-results" aria-label="Generation results"><div role="status" aria-live="polite">{generation.busy?'Queuing images…':generation.pending?'Creating your images…':'Generation finished'}</div>{generation.pollError && <p role="alert">{generation.pollError}</p>}{generation.renders.map((render,index)=><div key={render.id} className="wp-job"><span>Image {index+1} · {render.status}</span>{['failed','offline','cancelled'].includes(render.status) && <p role="alert">{render.error || 'This image did not complete.'}</p>}</div>)}<div className="wp-result-grid">{outputs.map(({url,id},index)=><a key={`${id}-${index}`} href={mediaUrl(url)} target="_blank" rel="noreferrer"><img src={mediaUrl(url)} alt={`Generated result ${index+1}`}/></a>)}</div><Link to="/gallery">Open Gallery</Link> · <Link to="/queue">View queue</Link></section>}
        </section>
        <aside className="wp-preview"><span className="wp-eyebrow">Preview</span>{previewContent}<div className="wp-preview-summary"><strong>{mode==='character'?person.name:mode==='image'?'Your starting image':'Your image idea'}</strong><span>{mode==='character'?`${people.length} person${people.length>1?'s':''}`:mode==='image'?imageName || 'No image selected':description || 'Add a description'}</span>{mode!=='image' && <span>{sceneSummary}</span>}</div></aside>
        <details className="wp-mobile-preview"><summary>{outputs.length ? "Show generated preview" : "Show image preview"}</summary>{previewContent}</details>
      </main>
      <footer className="wp-footer"><button type="button" disabled={locked} className="wp-button wp-secondary" onClick={()=>step?setStep(step-1):setMode('')}><ArrowLeft size={16}/>{step ? 'Previous' : 'Starting point'}</button><span className="wp-footer-status" role="status">Step {step+1} of {steps.length} · {steps[step]?.label}</span>{key==='review'?<button type="button" className="wp-button wp-primary" disabled={locked || generation.loading || !generation.workflow || !!generation.promptError} onClick={generation.generate}>{generation.busy || (generation.pending?'Creating images…':`Generate ${count} image${count>1?'s':''}`)}</button>:<button type="button" className="wp-button wp-primary" disabled={locked || !previewCanContinue(key,{description,instruction,image})} onClick={()=>setStep(step+1)}>{steps[step+1]?.key==='review'?'Review image':'Next'}<ArrowRight size={16}/></button>}</footer>
    </>}
    <Dialog open={!!dialog} onOpenChange={value=>{if(!value)setDialog(null);}}><DialogContent className={`wp-dialog ${dialog?.type==='randomizers'?'rs-dialog':''}`}><DialogTitle>{dialog?.title || (dialog?.type==='characters'?'Choose a saved character':'Image settings')}</DialogTitle><DialogDescription>{dialog?.type==='settings'?'Optional workflow and output preferences.':selectedField?.type==='chips_multi'?'Choose any that apply, then select Done.':'Select one option. Your other choices stay unchanged.'}</DialogDescription>
      {dialog?.type==='randomizers'?<RandomizerSuites people={people} active={active} busy={locked} onApply={next=>{setPeople(next);setSceneName('Use current scene');}}/>:dialog?.type==='settings'?<fieldset disabled={locked} className="wp-settings"><label>Workflow<select aria-label="Workflow" value={generation.workflow?.id || ''} onChange={e=>generation.chooseWorkflow(e.target.value)}>{generation.workflows.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Images<select aria-label="Images to generate" value={count} onChange={e=>setCount(Number(e.target.value))}>{Array.from({length:20},(_,index)=>index+1).map(number=><option key={number} value={number}>{number}</option>)}</select></label><label>Shape<select disabled={mode==='image'} value={shape} onChange={e=>setShape(e.target.value)}>{['Portrait','Square','Landscape'].map(value=><option key={value}>{value}</option>)}</select></label><details><summary>Advanced controls</summary><div className="wp-advanced">{mode==='character' && <SmartShootEditor enabled={smartShootEnabled} preset={activeSmartPreset} strength={smartStrength} options={smartShootOptions} plan={smartShoot.plan} onEnabled={setSmartShootEnabled} onPreset={setSmartPreset} onStrength={setSmartStrength} onOptions={setSmartShootOptions} onKeep={smartShoot.toggleKeep} onRedo={index=>smartShoot.regenerate(index)} onShuffle={()=>smartShoot.regenerate()}/>} {mode==='character' && <section className="wp-generation-camera-controls" aria-label="Generation pose and camera"><h3>Pose and camera</h3><p className="wp-muted">These choices are added to the generation prompt. For a group, the pose is composed across all selected subjects.</p>{people.length>1 && <CastPoseOptions count={people.length} value={sharedCastPose(people,promptCatalog)} onSelect={pose=>setPeople(current=>selectSharedCastPose(current,pose))} onClear={()=>setPeople(current=>editCastPose(current,current[0]?.id,{...(current[0]?.dna?.pose || {}),action:''},promptCatalog))}/>}<div className="wp-generation-detail-actions">{editRow('Pose','pose','action')}{editRow('Framing','pose','distance')}</div><CameraOrbitPicker value={person.dna.pose?.angle || ''} disabled={locked || fieldLocked('pose','angle')} onChange={angle=>setPeople(current=>editCastPose(current,current[active]?.id,{...(current[active]?.dna?.pose || {}),angle},promptCatalog))}/></section>}<label>Seed (blank = random sequence)<input inputMode="numeric" aria-label="Seed" value={generation.seed} onChange={e=>generation.setSeed(e.target.value)}/><span className="wp-muted">{smartShootEnabled?'Smart Shoot assigns a distinct offset seed to each planned image.':'The first image uses this seed; each additional image increments it by one.'}</span></label><label>Negative prompt<textarea value={generation.negative} onChange={e=>generation.setNegative(e.target.value)}/></label>{mode!=='image' && generation.workflow && <UniversalLoraPicker workflow={generation.workflow} value={generation.lora} onChange={generation.setLora}/>}<label>Final prompt<textarea aria-label="Final prompt" readOnly value={generation.prompt.positive}/></label><p>Sampling settings come from the selected workflow. Image edits retain their workflow's canvas.</p><Link to="/create/tools">All creation tools</Link>{mode==='character'?<p>To keep these choices in the full editor, save a new character from Review, then open its saved link.</p>:<Link to="/character/new">Full character editor</Link>}</div></details><button type="button" className="wp-button wp-primary" onClick={()=>setDialog(null)}>Done</button></fieldset>:dialog?.type==='field' && ['slider','text'].includes(selectedField?.type)?<div className="wp-settings"><label>{dialog.title}{selectedField.type==='slider'?<><input aria-label={dialog.title} type="range" min={selectedField.min} max={selectedField.max} step={selectedField.step || 1} value={currentValue ?? selectedField.defaultValue ?? selectedField.min} onChange={e=>changePerson(dialog.section,dialog.field,Number(e.target.value))}/><output>{currentValue ?? selectedField.defaultValue ?? selectedField.min}</output></>:<input aria-label={dialog.title} value={currentValue || ''} onChange={e=>changePerson(dialog.section,dialog.field,e.target.value)}/>}</label>{dialog.section==='physique' && physiqueControlStatus(dialog.field,person.dna.physique)?.text && <p className="wp-muted">{physiqueControlStatus(dialog.field,person.dna.physique).text}</p>}{selectedField.help && <p className="wp-muted">{selectedField.help}</p>}<button type="button" className="wp-button wp-primary" onClick={()=>setDialog(null)}>Done</button></div>:<><label className="wp-search"><Search size={16}/><input autoFocus type="search" aria-label="Search available choices" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…"/></label>{availableGroups.length>0 && <label className="wp-settings">Category<select aria-label="Option category" value={optionGroup} onChange={e=>setOptionGroup(e.target.value)}><option>All</option>{availableGroups.map(group=><option key={group.name}>{group.name}</option>)}</select></label>}{dialog?.type==='characters'?<div className="wp-picker-list">{characterLoading?<p role="status">Loading characters…</p>:characterError?<div role="alert">{characterError}<button type="button" className="wp-text-button" onClick={loadCharacters}>Retry</button></div>:<>{characters.filter(c=>(c.name || '').toLowerCase().includes(query.toLowerCase())).map(c=><button type="button" key={c.id} onClick={()=>chooseCharacter(c)}>{c.thumbnail?<img src={mediaUrl(c.thumbnail)} alt=""/>:<UserRound size={24}/>}<span>{c.name || 'Untitled'}</span><ArrowRight size={16}/></button>)}{!characters.length && <p>No saved characters yet. Close this picker to build a new one.</p>}{characters.length>0 && !characters.some(c=>(c.name || '').toLowerCase().includes(query.toLowerCase())) && <p role="status">No matching characters. Try another search.</p>}</>}</div>:<div className="wp-picker-list">{filteredOptions.map(option=><button type="button" key={option.value} disabled={workspaceFieldLocked(person,dialog.type==='outfits'?'wardrobe':dialog.section,dialog.type==='outfits'?'outfit_set':dialog.field,option.value)} aria-pressed={Array.isArray(currentValue)?currentValue.includes(option.value):currentValue===option.value} onClick={()=>{if(dialog.type==='outfits'){changePerson('wardrobe','outfit_set',option.value);}else changePerson(dialog.section,dialog.field,selectedField?.type==='chips_multi'?(Array.isArray(currentValue)?currentValue.includes(option.value)?currentValue.filter(v=>v!==option.value):[...currentValue,option.value]:[option.value]):option.value);if(selectedField?.type!=='chips_multi')setDialog(null);}}><span>{option.label}</span>{(Array.isArray(currentValue)?currentValue.includes(option.value):currentValue===option.value) && <Check size={17}/>}</button>)}{!filteredOptions.length && <p role="status">No matching choices. Try another search.</p>}{selectedField?.type==='chips_multi' && <button type="button" className="wp-button wp-primary" onClick={()=>setDialog(null)}>Done</button>}</div>}</>}
    </DialogContent></Dialog>
  </div>;
}
