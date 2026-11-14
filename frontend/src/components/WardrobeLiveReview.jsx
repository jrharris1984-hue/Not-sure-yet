import {wardrobeLiveSummary} from '@/lib/wardrobeLiveSummary';
import {wardrobeMode} from '@/lib/wardrobeMode';

export default function WardrobeLiveReview({value={},onChange,disabled=false}){
 const summary=wardrobeLiveSummary(value);
 const reset=()=>onChange({...value,exposure_mode:'use selected outfit',_exposurePrompt:undefined,_layerVisibility:{},nudity_level:0,nudity_outfit:''});
 return <section className="wardrobe-live-review" aria-label="Live outfit summary" aria-live="polite">
  <div className="wardrobe-live-review-heading"><strong>Current outfit summary</strong><span>{summary.full?'Complete outfit':'Individual garments'}</span></div>
  <p>Coverage: <strong>{summary.exposure.selection}</strong></p>
  {summary.full?<p>Selected set: {value.outfit_set||'No complete outfit selected'}</p>:<>
   <div className="wardrobe-live-lists">
    <div><strong>Selected and enabled</strong>{summary.active.length?<ul>{summary.active.map(layer=><li key={layer.key}>{layer.label}: {layer.pieces.map(piece=>piece.name).join(', ')}</li>)}</ul>:<p>No individual garments selected and enabled.</p>}</div>
    <div><strong>Hidden but saved</strong>{summary.hidden.length?<ul>{summary.hidden.map(layer=><li key={layer.key}>{layer.label}: {layer.pieces.map(piece=>piece.name).join(', ')}</li>)}</ul>:<p>No saved layers are hidden.</p>}</div>
   </div>
  </>}
  {summary.warnings.length>0&&<div className="wardrobe-live-warnings" role="status"><strong>Review these combinations</strong><ul>{summary.warnings.map(note=><li key={note}>{note}</li>)}</ul></div>}
  <button type="button" disabled={disabled} className="wardrobe-live-reset" onClick={reset}>Restore all saved layers and full coverage</button>
 </section>;
}
