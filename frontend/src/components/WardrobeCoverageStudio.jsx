import {wardrobeExposure} from '@/lib/wardrobeNudity';

const levels=[
  {key:'use selected outfit',label:'Fully clothed',hint:'Use the selected outfit'},
  {key:'slightly revealing',label:'Slightly revealing',hint:'Keep most of the outfit'},
  {key:'revealing outfit',label:'Revealing',hint:'Show more skin'},
  {key:'lingerie showing',label:'Lingerie showing',hint:'Outer clothing with visible lingerie'},
  {key:'lingerie only',label:'Lingerie only',hint:'Remove outer layers'},
  {key:'open or shifted outfit',label:'Clothing adjusted',hint:'Open or shift selected garments'},
  {key:'partially nude',label:'Partially undressed',hint:'Some clothing remains'},
  {key:'nude',label:'Nude',hint:'Remove clothing; retain permitted accessories'},
];
export default function WardrobeCoverageStudio({value={},onChange,disabled=false}){
  const selected=wardrobeExposure(value);
  const active=levels.findIndex(item=>item.key===selected);
  const fullSetWithoutLingerie=(value.outfit_mode==='full'||(!value.outfit_mode&&value.outfit_set))&&value.set_lingerie_mode==='none';
  const select=key=>{
    if(disabled)return;
    onChange({...value,exposure_mode:key,_exposurePrompt:undefined,nudity_level:0,nudity_outfit:''});
  };
  return <section className="wardrobe-coverage-studio" aria-label="Wardrobe coverage studio">
    <div className="wardrobe-coverage-title"><div><strong>How dressed should the character be?</strong><p>Choose a starting point, then fine-tune the outfit below.</p></div></div>
    <div className="wardrobe-coverage-levels" role="group" aria-label="Clothing coverage">
      {levels.map((item,index)=>{
        const unavailable=fullSetWithoutLingerie&&['lingerie showing','lingerie only'].includes(item.key);
        return <button key={item.key} type="button" disabled={disabled||unavailable} aria-pressed={selected===item.key} onClick={()=>select(item.key)} className="wardrobe-coverage-choice">
          <span className="wardrobe-coverage-index">{index+1}</span><span><strong>{item.label}</strong><small>{unavailable?'Enable an underneath layer first':item.hint}</small></span>
        </button>;
      })}
    </div>
    <p className="wardrobe-coverage-current" aria-live="polite">{active>=0?`Current: ${levels[active].label}`:'Custom coverage selected. Use the detailed clothing coverage setting below to edit it.'}</p>
    <details className="wardrobe-coverage-help"><summary>How clothing changes work</summary><p>Coverage changes keep your selected outfit and garment details saved. Use the clothing controls below to change individual layers, fabric, footwear or accessories. For specific options such as topless, bottomless, hosiery only or shifted garments, use the existing Clothing coverage detail.</p></details>
  </section>;
}
