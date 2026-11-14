import {SPHERICAL_SUBJECT_VIEWS} from '@/lib/cameraViewChoices';

const directions=[
  ['front','Front'],['front left three-quarter','Front left ¾'],['left profile','Left profile'],
  ['rear left three-quarter','Rear left ¾'],['back','Back'],['rear right three-quarter','Rear right ¾'],
  ['right profile','Right profile'],['front right three-quarter','Front right ¾'],
];
const elevations=[
  ['at eye level','Eye level'],['from below','Below'],['from above','Above'],
  ['from ground level','Ground level'],['from high overhead','High overhead'],
];
export default function CameraOrbitPicker({value='',onChange,disabled=false}) {
  const selection=directions.flatMap(([direction])=>elevations.map(([elevation])=>({direction,elevation,key:`${direction} ${elevation}`}))).find(item=>item.key===value);
  const direction=selection?.direction||'front';
  const elevation=selection?.elevation||'at eye level';
  const choose=(nextDirection,nextElevation)=>onChange(`${nextDirection} ${nextElevation}`);
  return <section className="camera-orbit-picker" aria-label="Visual camera direction selector">
    <div className="camera-orbit-heading"><strong>Camera direction</strong><small>Choose where the camera looks from. This uses descriptive prompts, not a 3D camera.</small></div>
    <div className="camera-orbit-diagram">
      <svg viewBox="0 0 300 200" role="img" aria-label="Camera positions surrounding the subject">
        <ellipse cx="150" cy="100" rx="110" ry="66" fill="none" stroke="currentColor" strokeOpacity=".35" strokeDasharray="5 5"/>
        <circle cx="150" cy="100" r="24" fill="#b39adf" fillOpacity=".2" stroke="#b39adf"/>
        <circle cx="150" cy="94" r="7" fill="#b39adf"/>
        <path d="M139 119 Q139 104 150 104 Q161 104 161 119" fill="#b39adf"/>
        {directions.map(([key,label],index)=>{
          const x=150+110*Math.sin(index*Math.PI/4),y=100-66*Math.cos(index*Math.PI/4);
          return <g key={key}><circle cx={x} cy={y} r={key===direction?11:5} fill={key===direction?'#b39adf':'#77738a'} stroke={key===direction?'white':'none'} strokeWidth="2"/><title>{label}</title></g>;
        })}
        <text x="150" y="15" textAnchor="middle" fontSize="11" fill="currentColor">FRONT</text>
        <text x="150" y="194" textAnchor="middle" fontSize="11" fill="currentColor">BACK</text>
      </svg>
    </div>
    <div className="camera-orbit-directions" role="group" aria-label="Horizontal camera direction">
      {directions.map(([key,label])=><button key={key} type="button" disabled={disabled} aria-pressed={direction===key&&!!selection} onClick={()=>choose(key,elevation)}>{label}</button>)}
    </div>
    <label>Camera elevation<select value={elevation} disabled={disabled} onChange={event=>choose(direction,event.target.value)}>{elevations.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <small aria-live="polite">{selection?'Selected: '+value:SPHERICAL_SUBJECT_VIEWS[value]?'Selected: '+value:'Choose a direction to apply an orbit viewpoint. Existing camera settings are unchanged.'}</small>
  </section>;
}
