import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, UserRound, Type, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { endpoints } from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import { PREVIEW_FLOWS, PREVIEW_SCENES, PREVIEW_OUTFITS, previewPerson, previewOptions, previewCanContinue, previewCopy } from '@/lib/workspacePreview';
import { HERITAGE_OUTFIT_GROUP } from '@/lib/heritageStyling';
import './WorkspacePreview.css';

export default function WorkspacePreview() {
  const [mode,setMode]=useState(''),[step,setStep]=useState(0),[people,setPeople]=useState(()=>[previewPerson()]);
  const [active,setActive]=useState(0),[relationship,setRelationship]=useState('Choose later');
  const [description,setDescription]=useState(''),[instruction,setInstruction]=useState(''),[image,setImage]=useState('');
  const [imageName,setImageName]=useState(''),[dialog,setDialog]=useState(null),[query,setQuery]=useState('');
  const [characters,setCharacters]=useState([]),[characterLoading,setCharacterLoading]=useState(false),[characterError,setCharacterError]=useState('');
  const [characterLoaded,setCharacterLoaded]=useState(false),[sceneName,setSceneName]=useState('Use current scene');
  const [count,setCount]=useState(1),[shape,setShape]=useState('Portrait'),[fileError,setFileError]=useState('');
  const heading=useRef(null),fileUrl=useRef(''),alive=useRef(true);
  const steps=PREVIEW_FLOWS[mode] || [], key=steps[step]?.key;
  const person=people[active] || people[0];
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);};},[]);
  useEffect(()=>{heading.current?.focus();},[mode,step]);
  const open=value=>{setQuery('');setDialog(value);};
  const changePerson=(section,field,value)=>{
    if(person.locks[section] || person.field_locks[section]?.[field])return;
    setPeople(current=>current.map((p,i)=>i===active?{...p,dna:{...p.dna,[section]:{...p.dna[section],[field]:value}}}:p));
  };
  const fieldLocked=(section,field)=>!!(person.locks[section] || person.field_locks[section]?.[field]);
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
    fileUrl.current=URL.createObjectURL(file);setImage(fileUrl.current);setImageName(file.name);setFileError('');
  }
  const options=dialog?.type==='field'?previewOptions(dialog.section,dialog.field):dialog?.type==='outfits'?HERITAGE_OUTFIT_GROUP.options.map(value=>({value,label:value})):[];
  const currentValue=dialog?.type==='outfits'?person.dna.wardrobe?.outfit_set:person.dna[dialog?.section]?.[dialog?.field];
  const sceneSummary = people.map(p=>p.dna.scene?.environment || 'Current scene').filter((value,index,all)=>all.indexOf(value)===index).join(' / ');
  const preview=image || person.thumbnail;
  const previewContent=<><div className="wp-image">{preview?<img src={mediaUrl(preview)} alt="Selected reference preview"/>:<div><UserRound size={40} strokeWidth={1}/><p>Your preview will appear here</p></div>}</div><p className="wp-muted wp-caption">{preview?'Reference image. Edits here do not change its pixels.':'A generated preview would appear here in the connected workspace.'}</p></>;
  const editRow=(title,section,field)=> <button type="button" className="wp-detail-row" disabled={fieldLocked(section,field)} onClick={()=>open({type:'field',title,section,field})}><span>{title}</span><strong>{person.dna[section]?.[field] || 'Choose later'}</strong><span className="wp-muted">{fieldLocked(section,field)?'Locked':'Change'}</span></button>;
  return <div className="workspace-preview">
    <header className="wp-top"><Link to="/create" className="wp-brand">Ultra Studio</Link><span className="wp-preview-label">Layout preview · nothing is saved</span><Link to="/create" className="wp-exit">Exit preview</Link></header>
    {!mode?<main className="wp-start">
      <span className="wp-eyebrow">A simpler place to start</span><h1 ref={heading} tabIndex={-1}>What would you like to create?</h1><p className="wp-intro">Choose a starting point. We’ll take it one step at a time.</p>
      <div className="wp-start-options">{[{id:'describe',title:'Describe an image',detail:'Start with a few words.',icon:Type},{id:'character',title:'Choose a character',detail:'Use someone saved or build someone new.',icon:UserRound},{id:'image',title:'Use an existing image',detail:'Choose a photo and describe a change.',icon:ImagePlus}].map(item=><button type="button" key={item.id} onClick={()=>{setMode(item.id);setStep(0);}}><item.icon size={25} strokeWidth={1.5}/><strong>{item.title}</strong><span>{item.detail}</span><ArrowRight size={18}/></button>)}</div>
    </main>:<>
      <div className="wp-progress"><button type="button" className="wp-text-button" onClick={()=>{setMode('');setStep(0);}}><ArrowLeft size={16}/>Starting point</button><nav aria-label="Workspace progress">{steps.map((item,index)=><button key={item.key} type="button" aria-current={index===step?'step':undefined} onClick={()=>{if(index<=step)setStep(index);}} disabled={index>step}><span>{index<step?<Check size={13}/>:index+1}</span><b>{item.label}</b></button>)}</nav><span className="wp-mobile-progress">Step {step+1} of {steps.length} · {steps[step]?.label}</span></div>
      <main className="wp-workspace">
        <section className="wp-editor" aria-label="Active editing step">
          <div className="wp-step-heading"><div><span className="wp-eyebrow">{key==='review'?'Your next image':`Step ${step+1}`}</span><h1 ref={heading} tabIndex={-1}>{({person:'Who is in your photo?',appearance:'Make the character your own',outfit:'What are they wearing?',scene:'Where is the photo taken?',review:'Everything look right?',description:'Describe your image',source:'Choose your starting image',instruction:'What would you like to change?'})[key]}</h1></div><button type="button" className="wp-icon-button" aria-label="More image settings" onClick={()=>open({type:'settings'})}><SlidersHorizontal size={19}/></button></div>
          {(key==='description' || key==='instruction') && <div className="wp-block"><label htmlFor="wp-description">{key==='description'?'What do you have in mind?':'Describe only the change you want'}</label><textarea id="wp-description" rows={5} value={key==='description'?description:instruction} onChange={e=>key==='description'?setDescription(e.target.value):setInstruction(e.target.value)} placeholder={key==='description'?'A relaxed portrait in a bright studio…':'Change the jacket to navy and keep the rest…'}/><p className="wp-muted">This preview stores your words locally. AI interpretation is not connected.</p></div>}
          {key==='source' && <div className="wp-upload"><ImagePlus size={34} strokeWidth={1}/><strong>{imageName || 'Choose an image'}</strong><p className="wp-muted">JPG, PNG or WebP · up to 20 MB</p><label className="wp-button wp-secondary">Browse images<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>{fileError && <p role="alert">{fileError}</p>}</div>}
          {mode==='character' && <div className="wp-person-switch"><span>{people.length===1?'One person':`${people.length} people`}</span>{people.length>1 && people.map((p,index)=><button type="button" key={index} aria-pressed={active===index} onClick={()=>setActive(index)}>Person {index+1}</button>)}</div>}
          {key==='person' && <div className="wp-block"><div className="wp-character-card"><div className="wp-avatar">{person.thumbnail?<img src={mediaUrl(person.thumbnail)} alt="Selected character"/>:<UserRound size={32} strokeWidth={1.3}/>}</div><div><strong>{person.name}</strong><p className="wp-muted">{person.dna.identity?.archetype || 'Choose a saved character or start with the basics.'}</p></div><button type="button" className="wp-button wp-secondary" onClick={loadCharacters}>Choose character</button></div><div className="wp-basic-fields"><label>Name<input value={person.name} onChange={e=>setPeople(current=>current.map((p,i)=>i===active?{...p,name:e.target.value}:p))}/></label><label>Age<input type="number" min="18" max="80" value={person.dna.identity?.age ?? 30} disabled={fieldLocked('identity','age')} onChange={e=>changePerson('identity','age',Math.max(18,Math.min(80,Number(e.target.value)||30)))}/></label></div>{people.length===1?<button type="button" className="wp-text-button" onClick={()=>{setPeople(current=>[...current,previewPerson()]);setActive(1);}}><Plus size={16}/>Add another person</button>:<><label>Relationship<select value={relationship} onChange={e=>setRelationship(e.target.value)}>{['Choose later','Friends','Colleagues'].map(value=><option key={value}>{value}</option>)}</select></label><button type="button" className="wp-text-button" onClick={()=>{setPeople(current=>current.filter((_,i)=>i!==active));setActive(0);}}>Remove this person</button></>}</div>}
          {key==='appearance' && <div className="wp-block"><p className="wp-muted">Keep the current look, or change one detail. Everything here is optional.</p>{editRow('Hair style','hair','style')}{editRow('Hair color','hair','color')}{editRow('Eye color','face','eye_color')}<details className="wp-more-details"><summary>More appearance details</summary>{editRow('Skin tone','skin','tone')}{editRow('Expression','face','expression')}{editRow('Body type','physique','body_type')}</details></div>}
          {key==='outfit' && <div className="wp-block"><p className="wp-muted">Choose one coordinated outfit. You can keep your existing selection.</p><div className="wp-choices">{PREVIEW_OUTFITS.map((value,index)=><button type="button" key={value} disabled={fieldLocked('wardrobe','outfit_set') || fieldLocked('wardrobe','outfit_mode')} aria-pressed={person.dna.wardrobe?.outfit_set===value} onClick={()=>{changePerson('wardrobe','outfit_mode','full');changePerson('wardrobe','outfit_set',value);}}><span className="wp-choice-art">{['01','02','03'][index]}</span><strong>{['Embroidered & relaxed','Tailored linen','Cotton day dress'][index]}</strong><span>{value}</span></button>)}</div><button type="button" className="wp-text-button" disabled={fieldLocked('wardrobe','outfit_set') || fieldLocked('wardrobe','outfit_mode')} onClick={()=>open({type:'outfits',title:'Choose an outfit'})}>Browse outfit choices<ArrowRight size={16}/></button>{person.dna.wardrobe?.outfit_set && <p className="wp-selection">Selected: {person.dna.wardrobe.outfit_set}</p>}</div>}
          {key==='scene' && <div className="wp-block"><div className="wp-choices">{PREVIEW_SCENES.map(choice=><button type="button" key={choice.name} aria-pressed={sceneName===choice.name} onClick={()=>selectScene(choice)}><span className={`wp-scene-art wp-scene-${choice.scene.environment.replace(' ','-')}`}/><strong>{choice.name}</strong><span>{choice.description}</span></button>)}</div><p className="wp-muted">Scene presets coordinate the setting and light. Saved locks are kept.</p>{editRow('Pose','pose','action')}{editRow('Framing','pose','distance')}</div>}
          {key==='review' && <div className="wp-review">{steps.slice(0,-1).map((item,index)=><button type="button" key={item.key} onClick={()=>setStep(index)}><span><strong>{item.label}</strong><small>{({person:people.map(p=>p.name).join(' & '),appearance:people.map(p=>[p.dna.hair?.style,p.dna.hair?.color].filter(Boolean).join(' · ') || 'Current appearance').join(' / '),outfit:people.map(p=>p.dna.wardrobe?.outfit_set || 'Current outfit').join(' / '),scene:sceneSummary,description,source:imageName,instruction})[item.key]}</small></span><span>Edit</span></button>)}<div className="wp-review-settings"><span>{count} image{count>1?'s':''} · {shape}</span><button type="button" className="wp-text-button" onClick={()=>open({type:'settings'})}>Change</button></div><p className="wp-muted">This is a layout prototype. Generation and saving will connect only after the design is reviewed.</p></div>}
        </section>
        <aside className="wp-preview"><span className="wp-eyebrow">Preview</span>{previewContent}<div className="wp-preview-summary"><strong>{mode==='character'?person.name:mode==='image'?'Your starting image':'Your image idea'}</strong><span>{mode==='character'?`${people.length} person${people.length>1?'s':''}`:mode==='image'?imageName || 'No image selected':description || 'Add a description'}</span>{mode!=='image' && <span>{sceneSummary}</span>}</div></aside>
        <details className="wp-mobile-preview"><summary>Show reference preview</summary>{previewContent}</details>
      </main>
      <footer className="wp-footer"><button type="button" className="wp-button wp-secondary" onClick={()=>step?setStep(step-1):setMode('')}><ArrowLeft size={16}/>Back</button><span className="wp-muted">{key==='review'?'Prototype · generation not connected':'Your choices stay here while you move between steps.'}</span>{key==='review'?<button type="button" className="wp-button wp-primary" disabled>Generate · preview only</button>:<button type="button" className="wp-button wp-primary" disabled={!previewCanContinue(key,{description,instruction,image})} onClick={()=>setStep(step+1)}>{steps[step+1]?.key==='review'?'Review image':'Continue'}<ArrowRight size={16}/></button>}</footer>
    </>}
    <Dialog open={!!dialog} onOpenChange={value=>{if(!value)setDialog(null);}}><DialogContent className="wp-dialog"><DialogTitle>{dialog?.title || (dialog?.type==='characters'?'Choose a saved character':'Image settings')}</DialogTitle><DialogDescription>{dialog?.type==='settings'?'Optional output preferences for this prototype.':'Select one option. Your other choices stay unchanged.'}</DialogDescription>
      {dialog?.type==='settings'?<div className="wp-settings"><label>Images<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,2,4].map(n=><option key={n}>{n}</option>)}</select></label><label>Shape<select value={shape} onChange={e=>setShape(e.target.value)}>{['Portrait','Square','Landscape'].map(value=><option key={value}>{value}</option>)}</select></label><button type="button" className="wp-button wp-primary" onClick={()=>setDialog(null)}>Done</button></div>:<><label className="wp-search"><Search size={16}/><input autoFocus type="search" aria-label="Search available choices" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…"/></label>{dialog?.type==='characters'?<div className="wp-picker-list">{characterLoading?<p role="status">Loading characters…</p>:characterError?<div role="alert">{characterError}<button type="button" className="wp-text-button" onClick={loadCharacters}>Retry</button></div>:<>{characters.filter(c=>(c.name || '').toLowerCase().includes(query.toLowerCase())).map(c=><button type="button" key={c.id} onClick={()=>chooseCharacter(c)}>{c.thumbnail?<img src={mediaUrl(c.thumbnail)} alt=""/>:<UserRound size={24}/>}<span>{c.name || 'Untitled'}</span><ArrowRight size={16}/></button>)}{!characters.length && <p>No saved characters yet. Close this picker to build a new one.</p>}{characters.length>0 && !characters.some(c=>(c.name || '').toLowerCase().includes(query.toLowerCase())) && <p role="status">No matching characters. Try another search.</p>}</>}</div>:<div className="wp-picker-list">{options.filter(option=>option.label.toLowerCase().includes(query.toLowerCase())).map(option=><button type="button" key={option.value} aria-pressed={currentValue===option.value} onClick={()=>{if(dialog.type==='outfits'){changePerson('wardrobe','outfit_mode','full');changePerson('wardrobe','outfit_set',option.value);}else changePerson(dialog.section,dialog.field,option.value);setDialog(null);}}><span>{option.label}</span>{currentValue===option.value && <Check size={17}/>}</button>)}{!options.some(option=>option.label.toLowerCase().includes(query.toLowerCase())) && <p role="status">No matching choices. Try another search.</p>}</div>}</>}
    </DialogContent></Dialog>
  </div>;
}
