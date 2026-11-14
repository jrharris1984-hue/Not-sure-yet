import {GARMENT_LAYERS,layerVisible,setLayerVisible} from '@/lib/wardrobeLayerOverrides';
import {wardrobeMode} from '@/lib/wardrobeMode';

export default function WardrobeIndependentLayers({value={},onChange,disabled=false}){
 const full=wardrobeMode(value)==='full';
 const available=GARMENT_LAYERS.map(layer=>({...layer,chosen:layer.fields.filter(key=>value[key]&&value[key]!=='none'&&value[key]!=='barefoot').map(key=>String(value[key])).join(', ')}));
 return <section className="wardrobe-independent-layers" aria-label="Independent garment layers">
 <strong>Individual garment visibility</strong>
 <p>Turn individual layers on or off without deleting their saved clothing choices.</p>
 {full&&<p role="status">Switch to Build from garments to control layers individually. Complete outfit sets remain intact.</p>}
 <div className="wardrobe-independent-grid">{available.map(layer=><label key={layer.key}>
 <input type="checkbox" checked={layerVisible(value,layer.key)} disabled={disabled||full} onChange={event=>onChange(setLayerVisible(value,layer.key,event.target.checked))}/>
 <span><strong>{layer.label}</strong><small>{layer.chosen||'No garment selected yet'}</small></span>
 </label>)}</div>
 <small>Turn a layer back on to restore its saved selection. Detailed clothing choices remain below.</small>
 </section>;
}
