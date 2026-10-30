import './VisualChoice.css';
import {Check} from 'lucide-react';

const COLORS={hazel:'#8c7843','dark brown':'#50372c','light brown':'#a47b55','light blue':'#a5c8e4','emerald green':'#23866a',black:'#20232b',white:'#f6f4ef',ivory:'#eee6d3',cream:'#e9dabc',beige:'#c9b18d',tan:'#b99069',brown:'#79543d',brunette:'#79543d',blonde:'#dfbf7e','ash blonde':'#baaf91','platinum blonde':'#e9e4d5',red:'#ca5358',auburn:'#874336',ginger:'#ba7041',copper:'#b37446',orange:'#dd8a48',yellow:'#e6c75d',gold:'#c9a354',green:'#679579',olive:'#858456',blue:'#648cc8',navy:'#364768',teal:'#55a59e',turquoise:'#5cbcb7',purple:'#997ac1',violet:'#997ac1',lavender:'#c2afd8',pink:'#dc9db5',rose:'#c98a9c',burgundy:'#77394c',silver:'#bfc5cd',gray:'#959ba4',grey:'#959ba4'};
export function choiceSwatch(field,value) {
  if(!/(?:color|colour)(?:-|$)/i.test(field || ''))return null;
  return COLORS[String(value).toLowerCase()] || null;
}
export default function VisualChoice({value,label=value,active,onClick,testId,field}) {
  const swatch=choiceSwatch(field,value);
  return <button type="button" className={`studio-choice visual-choice ${active?'active':''} ${swatch?'is-color-choice':''}`} title={`${label}${swatch?' · approximate color':''}${active?' · Selected; click again to clear':''}`} aria-pressed={active} data-testid={testId} onClick={onClick}>
    {swatch && <span className="visual-choice-swatch" aria-hidden="true" style={{backgroundColor:swatch}}/>}
    <span className="visual-choice-label">{label}</span>
    <span className="visual-choice-check" aria-hidden="true">{active && <Check size={14}/>}</span>
  </button>;
}
