import {wardrobeExposure} from '@/lib/wardrobeNudity';

const levels=[
  {key:'use selected outfit',label:'Fully clothed',hint:'Keep every selected garment on and correctly worn'},
  {key:'slightly revealing',label:'Slightly revealing',hint:'Keep chest and pelvis covered; allow a modest neckline or leg reveal'},
  {key:'revealing outfit',label:'Revealing outfit',hint:'Use a deep neckline, cutout, slit, or exposed shoulders while staying dressed'},
  {key:'lingerie showing',label:'Lingerie showing',hint:'Open an outer layer so a coordinated set is clearly visible underneath'},
  {key:'lingerie only',label:'Lingerie only',hint:'Show the selected coordinated set without shirts, dresses, or other outerwear'},
  {key:'open or shifted outfit',label:'Clothing adjusted',hint:'Visibly open, lower, or shift a selected garment; other pieces stay on'},
  {key:'partially nude',label:'Partially undressed',hint:'Remove one or more garments while keeping substantial coverage'},
  {key:'nude',label:'No clothing',hint:'Remove garments and underwear; keep selected accessories only'},
];
export default function WardrobeCoverageStudio({value={},onChange,disabled=false}){
  const selected=wardrobeExposure(value);
  const active=levels.findIndex(item=>item.key===selected);
  const select=key=>{
    if(disabled)return;
    onChange({...value,exposure_mode:key,_exposurePrompt:undefined,nudity_level:0,nudity_outfit:''});
  };
  return <section className="wardrobe-coverage-studio" aria-label="Wardrobe coverage studio">
    <div className="wardrobe-coverage-title"><div><strong>How dressed should the character be?</strong><p>Set the overall coverage. Each state has a distinct prompt direction. Use detailed coverage choices below for necklines, slits, layers, and specific garment positions.</p></div></div>
    <div className="wardrobe-coverage-levels" role="group" aria-label="Clothing coverage">
      {levels.map((item,index)=>{
        return <button key={item.key} type="button" disabled={disabled} aria-pressed={selected===item.key} onClick={()=>select(item.key)} className="wardrobe-coverage-choice">
          <span className="wardrobe-coverage-index">{index+1}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span>
        </button>;
      })}
    </div>
    <p className="wardrobe-coverage-current" aria-live="polite">{active>=0?`Current: ${levels[active].label}`:'Custom coverage selected. Choose a detailed coverage style below to control the garment shape or position.'}</p>
    <details className="wardrobe-coverage-help"><summary>How clothing changes work</summary><p>Coverage takes priority over the selected outfit’s default state while keeping that outfit saved for later. Lingerie coverage uses the selected underneath layer, or the outfit’s coordinated matching set if the underneath layer is turned off. Use the Layers step or advanced clothing coverage control for specific layer combinations.</p></details>
  </section>;
}
