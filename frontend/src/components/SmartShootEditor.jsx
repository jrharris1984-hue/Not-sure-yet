import { SMART_PHOTOSHOOT_PRESETS, SMART_VARIATION_STRENGTHS } from '@/lib/batchSmartPhotoshoot';

const styles = Object.values(SMART_PHOTOSHOOT_PRESETS).sort((a,b) =>
  a.categoryLabel.localeCompare(b.categoryLabel) || a.label.localeCompare(b.label));
const variations = [
  ['pose', 'Vary pose'], ['camera', 'Vary camera angle'], ['framing', 'Vary framing'], ['expression', 'Vary expression'],
];

export default function SmartShootEditor({enabled,preset,strength,options,plan,onEnabled,onPreset,onStrength,onOptions,onKeep,onRedo,onShuffle}) {
  return <section className="wp-smart-shoot" aria-label="Smart Shoot editor">
    <div className="wp-smart-shoot-heading"><div><h3>Smart Shoot</h3><p>Plan a different pose and camera for each image. Character identity, wardrobe and scene stay as selected.</p></div>
      <label className="wp-smart-shoot-toggle"><input type="checkbox" aria-label="Enable Smart Shoot" checked={enabled} onChange={event=>onEnabled(event.target.checked)}/>Enable</label>
    </div>
    {enabled && <>
      <div className="wp-smart-shoot-controls">
        <label>Shoot style<select aria-label="Smart Shoot style" value={preset} onChange={event=>onPreset(event.target.value)}>{styles.map(item=><option key={item.key} value={item.key}>{item.categoryLabel} · {item.label}</option>)}</select></label>
        <label>Variation<select aria-label="Smart Shoot variation strength" value={strength} onChange={event=>onStrength(event.target.value)}>{SMART_VARIATION_STRENGTHS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="wp-smart-shoot-variations" role="group" aria-label="Shot variations">{variations.map(([key,label])=><label key={key}><input type="checkbox" checked={options[key]===true} onChange={event=>onOptions({...options,[key]:event.target.checked})}/>{label}</label>)}</div>
      <div className="wp-smart-shoot-actions"><span>{plan.length} planned shots · unique seeds</span><button type="button" className="wp-button wp-secondary" onClick={onShuffle}>Shuffle plan</button></div>
      <ol className="wp-smart-shoot-plan" data-testid="wizard-smart-shoot-plan">{plan.map((shot,index)=><li key={`${index}-${shot.title}`}>
        <div><strong>{index+1}. {shot.title}</strong><span>{[shot.pose?.label,shot.camera?.label,shot.framing,shot.expression].filter(Boolean).join(' · ') || 'Current selections'} · seed varies</span></div>
        <div className="wp-smart-shoot-shot-actions"><button type="button" aria-pressed={!!shot.kept} onClick={()=>onKeep(index)}>{shot.kept?'Kept':'Keep'}</button><button type="button" onClick={()=>onRedo(index)}>Redo</button></div>
      </li>)}</ol>
    </>}
  </section>;
}
