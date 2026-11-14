import {GARMENT_LAYERS,layerVisible} from './wardrobeLayerOverrides';
import {wardrobeMode} from './wardrobeMode';
import {wardrobeNudity} from './wardrobeNudity';

const present=v=>Array.isArray(v)?v.length>0:v!==undefined&&v!==null&&v!==''&&v!=='none'&&v!=='barefoot';
const display=v=>Array.isArray(v)?v.join(', '):String(v);
export function wardrobeLiveSummary(value={}){
 const full=wardrobeMode(value)==='full';
 const exposure=wardrobeNudity(value);
 const selected=GARMENT_LAYERS.map(layer=>{
   const pieces=layer.fields.filter(field=>present(value[field])).map(field=>({field,name:display(value[field])}));
   return {...layer,pieces,visible:layerVisible(value,layer.key)};
 });
 const active=selected.filter(layer=>layer.visible&&layer.pieces.length);
 const hidden=selected.filter(layer=>!layer.visible&&layer.pieces.length);
 const warnings=[];
 if(full&&selected.some(layer=>!layer.visible))warnings.push('Individual visibility overrides are saved but do not apply to complete outfit sets.');
 if(!full&&present(value.outfit_preset)&&selected.some(layer=>!layer.visible))warnings.push('An outfit preset can include multiple garments; select individual pieces for precise layer control.');
 if(!full&&present(value.dress_style)&&((present(value.top)&&layerVisible(value,'upper'))||(present(value.bottom)&&layerVisible(value,'lower'))))warnings.push('A dress and separate top or bottom are selected. The dress takes priority in the generated outfit.');
 if(!full&&present(value.skirt_style)&&present(value.bottom)&&layerVisible(value,'lower'))warnings.push('Skirt and bottoms are both selected. The existing compiler prioritizes the skirt.');
 if(exposure.suppressClothing&&active.some(layer=>!['accessories','hosiery'].includes(layer.key)))warnings.push('The selected coverage mode suppresses clothing even when individual garment switches are on.');
 if(exposure.mode==='lingerie only'&&active.some(layer=>['upper','lower','dress'].includes(layer.key)))warnings.push('Lingerie-only coverage overrides outer garment selections.');
 if(exposure.mode==='nude'&&active.length)warnings.push('Nude coverage overrides clothing selections; saved items can be restored by changing coverage.');
 return {full,exposure,active,hidden,warnings,selected};
}
