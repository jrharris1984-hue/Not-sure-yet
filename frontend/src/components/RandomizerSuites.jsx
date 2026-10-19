import {useRef,useState} from 'react';
import {RANDOMIZER_SUITES,proposeRandomizer} from '@/lib/randomizerSuites';
import {SECTIONS} from '@/lib/dna';
import RandomizerPresets from './RandomizerPresets';
import './RandomizerSuites.css';
const signature=value=>JSON.stringify(value);
const short=value=>{const text=Array.isArray(value)?value.join(', '):String(value ?? 'unset');return text.length>75?`${text.slice(0,72)}…`:text;};
export default function RandomizerSuites({people,active=0,onApply,busy=false}) {
  const [category,setCategory]=useState('Whole setups'),[query,setQuery]=useState('');
  const [target,setTarget]=useState('active'),[keepIdentity,setKeepIdentity]=useState(true),[keepBody,setKeepBody]=useState(false);
  const previewHeading=useRef(null);
  const [showAll,setShowAll]=useState(false);
  const [proposal,setProposal]=useState(null),[undo,setUndo]=useState(null),[message,setMessage]=useState('');
  const stamp=signature(people);
  const categories=[...new Set(RANDOMIZER_SUITES.map(s=>s.category)),'My randomizers'];
  const available=RANDOMIZER_SUITES.filter(s=>(query.trim() || s.category===category) && `${s.label} ${s.detail}`.toLowerCase().includes(query.toLowerCase()));
  const invalidate=()=>{setProposal(null);setMessage('');};
  function preview(id,custom){
    const result=proposeRandomizer(people,id,{active,target,keepIdentity,keepBody,custom});
    setShowAll(false);setProposal({...result,stamp,label:custom?.name || RANDOMIZER_SUITES.find(s=>s.id===id)?.label});setMessage('');requestAnimationFrame(()=>{previewHeading.current?.focus({preventScroll:true});previewHeading.current?.scrollIntoView?.({block:'nearest',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth'});});
  }
  function apply(){
    if(!proposal || proposal.stamp!==stamp || proposal.issues.length || !proposal.changes.length)return;
    setUndo({before:people,after:signature(proposal.people)});onApply(proposal.people,{undo:false});setProposal(null);setMessage('Applied. Review the character before generating.');
  }
  return <section className="randomizer-suites" aria-label="Randomizer suites"><p className="rs-intro">{RANDOMIZER_SUITES.length} suites · preview changes before applying. Natural-photo rules and character locks stay active. No images are queued.</p>
    <fieldset disabled={busy}>
      <details className="rs-preferences"><summary>Keep & scope <span>{target==='all'?'Everyone':`Person ${active+1}`} · {keepIdentity?'identity kept':'identity may change'}</span></summary><div className="rs-options"><label>Apply to<select value={target} onChange={e=>{setTarget(e.target.value);invalidate();}}><option value="active">Selected person ({active+1})</option><option value="all">Everyone</option></select></label><label className="rs-check"><input type="checkbox" checked={keepIdentity} onChange={e=>{setKeepIdentity(e.target.checked);invalidate();}}/>Keep identity & age</label><label className="rs-check"><input type="checkbox" checked={keepBody} onChange={e=>{setKeepBody(e.target.checked);invalidate();}}/>Keep body build</label></div>
      <p className="rs-note">Scene and camera suites apply to everyone so the photo shares one setting. Names, cast size and free-form notes are kept.</p></details>
      <label className="rs-search">Find a suite<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hair, studio, outfit…"/></label>
      <p className="rs-result-count" role="status">{category==='My randomizers' && !query?'Your saved collections':`${available.length} suites ${query?'matching your search':'in this category'}`}</p><div className="rs-categories" role="group" aria-label="Randomizer categories">{categories.map(c=><button type="button" key={c} aria-pressed={category===c && !query} onClick={()=>{setCategory(c);setQuery('');}}>{c}</button>)}</div>

      {proposal && <section className="rs-proposal" aria-label="Randomizer preview"><h3 ref={previewHeading} tabIndex={-1}>{proposal.label}</h3>{proposal.stamp!==stamp?<p role="status">Your character changed. Preview this suite again before applying.</p>:proposal.issues.length?<div role="status"><b>Setup kept</b><ul>{proposal.issues.map(issue=><li key={issue}>{issue}</li>)}</ul></div>:<><p>{proposal.changes.length} details will change.</p><ul>{proposal.changes.slice(0,showAll?proposal.changes.length:15).map((change,i)=><li key={i}><b>Person {change.person} · {SECTIONS.find(section=>section.key===change.section)?.title || change.section} · {SECTIONS.find(section=>section.key===change.section)?.fields.find(field=>field.key===change.field)?.label || change.field.replace(/_/g,' ')}</b><span>{short(change.before)} → {short(change.after)}</span></li>)}</ul>{proposal.changes.length>15 && <button type="button" className="rs-expand-changes" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>{showAll?'Show fewer details':`Show all ${proposal.changes.length} changes`}</button>}</>}<button type="button" className="rs-apply" disabled={proposal.stamp!==stamp || !!proposal.issues.length || !proposal.changes.length} onClick={apply}>Apply these changes</button><button type="button" onClick={()=>setProposal(null)}>Discard preview</button></section>}
      {category==='My randomizers' && !query?<RandomizerPresets busy={busy} onApply={custom=>preview(null,custom)}/>:<div className="rs-grid">{available.map(s=><button type="button" key={s.id} onClick={()=>preview(s.id)}><strong>{s.label}</strong><span>{s.detail}</span><small>Preview choices →</small></button>)}{!available.length && <p>No matching suites. Try another search or clear the search box.</p>}</div>}
      <button type="button" className="rs-undo" disabled={!undo || undo.after!==stamp} onClick={()=>{onApply(undo.before,{undo:true});setUndo(null);setProposal(null);setMessage('Randomizer undone.');}}>Undo last randomizer</button>
      {message && <p role="status">{message}</p>}
    </fieldset>
  </section>;
}
