import {useState} from 'react';
import WardrobeCoverageStudio from './WardrobeCoverageStudio';
import WardrobeLayerPicker from './WardrobeLayerPicker';
import WardrobeIndependentLayers from './WardrobeIndependentLayers';
import WardrobeLiveReview from './WardrobeLiveReview';
import WardrobeOverview from './WardrobeOverview';
import DnaSection from './DnaSection';
import {editWardrobeField,wardrobeMode} from '@/lib/wardrobeMode';

const steps=[
 {key:'outfit',label:'Outfit',help:'Choose a complete outfit or build with garments'},
 {key:'coverage',label:'Coverage',help:'Choose how dressed the character should be'},
 {key:'layers',label:'Layers',help:'Adjust what remains on the character'},
 {key:'review',label:'Review',help:'Check your selections and resolve conflicts'},
];
export default function WardrobeGuided({props,onAdvanced}){
 const [step,setStep]=useState(0);
 const mode=wardrobeMode(props.value);
 const locked=!!props.locked;
 const exposureLocked=locked||!!props.fieldLocks?.exposure_mode;
 const outfitLocked=locked||!!props.fieldLocks?.outfit_mode;
 const changeMode=next=>props.onChange(editWardrobeField(props.value,'outfit_mode',next));
 return <section className="wardrobe-guided" aria-label="Guided wardrobe editor">
  <header className="wardrobe-guided-header"><div><strong>Wardrobe</strong><p>One decision at a time. All your existing choices stay available.</p></div><button type="button" onClick={onAdvanced}>Advanced settings</button></header>
  <nav className="wardrobe-guided-steps" aria-label="Wardrobe steps">{steps.map((item,index)=><button type="button" key={item.key} aria-current={index===step?'step':undefined} onClick={()=>setStep(index)}><span>{index+1}</span>{item.label}</button>)}</nav>
  <div className="wardrobe-guided-panel"><div className="wardrobe-guided-step-title"><strong>{steps[step].label}</strong><p>{steps[step].help}</p></div>
  {step===0&&<>
   <WardrobeOverview value={props.value} fields={props.section.fields} disabled={outfitLocked} onModeChange={changeMode}/>
   <div className="wardrobe-guided-outfit-controls">
    {mode==='full'?<DnaSection {...props} focusedField="outfit_set" hideWardrobeOverview collapsed={false} simpleMode={false}/>:<>
      <DnaSection {...props} focusedField="top" hideWardrobeOverview collapsed={false} simpleMode={false}/>
      <DnaSection {...props} focusedField="bottom" hideWardrobeOverview collapsed={false} simpleMode={false}/>
      <details><summary>More clothing choices</summary><DnaSection {...props} focusedField="dress_style" hideWardrobeOverview collapsed={false} simpleMode={false}/><DnaSection {...props} focusedField="underwear" hideWardrobeOverview collapsed={false} simpleMode={false}/></details>
    </>}
   </div>
  </>}
  {step===1&&<WardrobeCoverageStudio value={props.value} disabled={exposureLocked} onChange={props.onChange}/>}
  {step===2&&<><WardrobeLayerPicker value={props.value} disabled={exposureLocked} onChange={props.onChange}/><WardrobeIndependentLayers value={props.value} disabled={locked} onChange={props.onChange}/></>}
  {step===3&&<WardrobeLiveReview value={props.value} disabled={exposureLocked} onChange={props.onChange}/>}
  </div>
  <footer className="wardrobe-guided-footer"><button type="button" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>Previous</button><span>{step+1} of {steps.length}</span><button type="button" onClick={()=>step===steps.length-1?onAdvanced():setStep(s=>Math.min(steps.length-1,s+1))}>{step===steps.length-1?'Advanced details':'Next'}</button></footer>
 </section>;
}
