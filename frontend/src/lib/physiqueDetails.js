// Independent physique controls; saved as regular DNA fields and compiled into one clause per axis.
export const PHYSIQUE_DETAIL_GROUPS=[
 {name:'Breasts',controls:[['bust_upper_fullness','Upper fullness'],['bust_lower_fullness','Lower fullness'],['bust_spacing','Spacing'],['bust_width','Base width']]},
 {name:'Hips',controls:[['hip_upper_fullness','Upper hip fullness'],['hip_lower_fullness','Lower hip fullness'],['hip_dip_depth','Hip dip depth']]},
 {name:'Waist',controls:[['waist_taper','Waist taper'],['waist_torso_length','Torso length'],['waist_abdominal_definition','Abdominal definition']]},
 {name:'Glutes',controls:[['glute_upper_fullness','Upper fullness'],['glute_lower_fullness','Lower fullness'],['glute_lateral_width','Lateral width'],['glute_lift','Lift']]},
];
const descriptions={
 bust_upper_fullness:['subtle upper breast fullness','rounded upper breast fullness','dramatic upper breast fullness'],
 bust_lower_fullness:['subtle lower breast fullness','weighted lower breast fullness','very pronounced lower breast fullness'],
 bust_spacing:['closely spaced breast contours','moderately separated breast contours','widely spaced breast contours'],
 bust_width:['narrow breast base','broad breast base','very broad breast base'],
 hip_upper_fullness:['subtle upper hip curve','rounded upper hip fullness','dramatic upper hip fullness'],
 hip_lower_fullness:['subtle lower hip fullness','rounded lower hip fullness','extreme lower hip fullness'],
 hip_dip_depth:['smooth outer hip transition','noticeable hip dips','deeply indented hip dips'],
 waist_taper:['subtle waist taper','strong waist taper','extremely cinched waist taper'],
 waist_torso_length:['short waist-to-hip torso','elongated waist-to-hip torso','very long waist-to-hip torso'],
 waist_abdominal_definition:['soft abdomen','defined abdominal contour','sharply defined abdominal contour'],
 glute_upper_fullness:['subtle upper glute fullness','rounded upper glute fullness','dramatic upper glute shelf'],
 glute_lower_fullness:['subtle lower glute fullness','weighted lower glute fullness','extreme lower glute fullness'],
 glute_lateral_width:['narrow glute lateral contour','broad outer glute contour','enormously wide outer glute contour'],
 glute_lift:['low-set glute silhouette','lifted glute silhouette','strongly elevated glute silhouette']
};
export const PHYSIQUE_DETAIL_KEYS=Object.keys(descriptions);
export function physiqueDetailPrompt(ph={}){
 return PHYSIQUE_DETAIL_KEYS.map(key=>{
 const n=Math.max(0,Math.min(100,Number(ph[key])||0));
 if(!n)return '';
 const tier=n<=33?0:n<=66?1:2;
 return descriptions[key][tier];
 }).filter(Boolean).join(', ');
}
