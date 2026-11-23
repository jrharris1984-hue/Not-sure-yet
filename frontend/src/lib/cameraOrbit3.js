// Camera orbit positions are descriptive guidance, not true 3D camera coordinates.
export const ORBIT_VIEWS=[
 {value:'front',label:'Front'},
 {value:'front right three-quarter',label:'Front right ¾'},
 {value:'right profile',label:'Right profile'},
 {value:'rear right three-quarter',label:'Rear right ¾'},
 {value:'back',label:'Back'},
 {value:'rear left three-quarter',label:'Rear left ¾'},
 {value:'left profile',label:'Left profile'},
 {value:'front left three-quarter',label:'Front left ¾'},
];
export const ORBIT_ELEVATIONS=[
 {value:'eye level',label:'Eye level',cameraAngle:'eye-level'},
 {value:'from below',label:'Low',cameraAngle:'slightly low'},
 {value:'from ground level',label:'Ground level',cameraAngle:'knee level'},
 {value:'from above',label:'High',cameraAngle:'slightly high'},
 {value:'from high overhead',label:'Overhead',cameraAngle:'overhead diagonal'},
];
export const cameraOrbitSelection=(subjectView,cameraAngle)=>{
 const raw=String(subjectView||'front');
 const direction=ORBIT_VIEWS.find(v=>raw===v.value||raw.startsWith(v.value+' from ')||raw.startsWith(v.value+' at '))?.value||'front';
 const elevation=ORBIT_ELEVATIONS.find(e=>e.cameraAngle===cameraAngle)?.value||'eye level';
 return {direction,elevation,cameraAngle:cameraAngle||'eye-level'};
};
