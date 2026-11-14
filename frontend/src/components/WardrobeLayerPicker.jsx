import {SIMPLE_COVERAGE_OPTIONS} from '@/lib/simpleCoverage';
import {wardrobeExposure} from '@/lib/wardrobeNudity';

// Each choice maps to a supported coverage recipe. Garment values are not erased.
const choices=[
  {key:'use selected outfit',label:'All clothing on',description:'Restore the selected outfit'},
  {key:'lingerie showing',label:'Show underneath layer',description:'Reveal lingerie beneath outer clothing'},
  {key:'lingerie only',label:'Remove outer clothing',description:'Keep lingerie'},
  {key:'topless',label:'Remove upper clothing',description:'Keep lower clothing'},
  {key:'bottomless',label:'Remove lower clothing',description:'Keep upper clothing'},
  {key:'unbuttoned',label:'Open fastenings',description:'Unbutton the selected garment'},
  {key:'unzipped',label:'Unzip clothing',description:'Part the selected garment'},
  {key:'hiked up',label:'Raise hem',description:'Shift the lower garment upward'},
  {key:'pulled down',label:'Lower garment',description:'Shift clothing down from shoulders'},
  {key:'hosiery only',label:'Hosiery only',description:'Remove other clothing'},
  {key:'heels only',label:'Shoes only',description:'Keep heels only'},
  {key:'accessories only',label:'Accessories only',description:'Keep accessories, remove clothing'},
  {key:'nude',label:'Remove all clothing',description:'Keep compatible selected accessories'},
];
const coverageValue=key=>SIMPLE_COVERAGE_OPTIONS.find(option=>option.label===key)?.value||key;
export default function WardrobeLayerPicker({value={},onChange,disabled=false}){
  const selected=wardrobeExposure(value);
  const isFullSet=value.outfit_mode==='full'||(!value.outfit_mode&&!!value.outfit_set);
  const noLingerie=isFullSet&&value.set_lingerie_mode==='none';
  const select=key=>{
    if(disabled)return;
    onChange({...value,exposure_mode:coverageValue(key),_exposurePrompt:undefined,nudity_level:0,nudity_outfit:''});
  };
  return <section className="wardrobe-layer-picker" aria-label="Layer-by-layer clothing controls">
    <div><strong>Adjust clothing layers</strong><p>Quickly change what remains on the character. Your garment selections stay saved.</p></div>
    <div className="wardrobe-layer-options" role="group" aria-label="Layer adjustments">
      {choices.map(item=>{
        const target=coverageValue(item.key);
        const unavailable=noLingerie&&['lingerie showing','lingerie only'].includes(item.key);
        return <button type="button" key={item.key} disabled={disabled||unavailable} aria-pressed={selected===target} onClick={()=>select(item.key)}>
          <strong>{item.label}</strong><small>{unavailable?'Enable an underneath layer first':item.description}</small>
        </button>;
      })}
    </div>
    <p className="wardrobe-layer-note" aria-live="polite">These are ready-made layer combinations. For individual tops, bottoms, hosiery, footwear and accessories, use the clothing details below.</p>
  </section>;
}
