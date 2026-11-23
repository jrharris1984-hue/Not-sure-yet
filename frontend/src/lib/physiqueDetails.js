// Independent physique controls; saved as regular DNA fields and compiled into one clause per axis.
export const PHYSIQUE_DETAIL_GROUPS=[
 {name:'Breasts',controls:[['bust_upper_fullness','Upper fullness'],['bust_lower_fullness','Lower fullness'],['bust_spacing','Spacing'],['bust_width','Base width'],['bust_outer_contour','Outer contour'],['bust_natural_drape','Natural drape']]},
 {name:'Hips',controls:[['hip_upper_fullness','Upper hip fullness'],['hip_lower_fullness','Lower hip fullness'],['hip_dip_depth','Hip dip depth'],['hip_waist_transition','Waist-to-hip transition'],['hip_rear_depth','Rear depth']]},
 {name:'Waist',controls:[['waist_taper','Waist taper'],['waist_torso_length','Torso length'],['waist_abdominal_definition','Abdominal definition'],['waist_ribcage_transition','Ribcage transition'],['waist_side_curve','Side-waist curve']]},
 {name:'Thighs',controls:[['thigh_inner_fullness','Inner thigh fullness'],['thigh_outer_fullness','Outer thigh fullness']]},
 {name:'Glutes',controls:[['glute_upper_fullness','Upper fullness'],['glute_lower_fullness','Lower fullness'],['glute_lateral_width','Lateral width'],['glute_lift','Lift'],['glute_lower_curve','Lower curve'],['glute_side_projection','Side projection']]},
];
const descriptions={
 bust_outer_contour:["narrow outer breast contour","rounded outer breast contour","dramatically broad outer breast contour"],
 bust_natural_drape:["firm supported breast contour","natural weighted breast drape","pronounced natural lower drape"],
 hip_waist_transition:["gradual waist-to-hip transition","defined waist-to-hip transition","dramatic waist-to-hip contrast"],
 hip_rear_depth:["subtle rear hip depth","rounded rear hip depth","extreme rear hip depth"],
 waist_ribcage_transition:["straight ribcage-to-waist line","gentle ribcage-to-waist taper","dramatic ribcage-to-waist taper"],
 waist_side_curve:["subtle side-waist indentation","pronounced side-waist indentation","extreme hourglass side-waist indentation"],
 glute_lower_curve:["subtle lower glute curve","rounded lower glute curve","dramatic lower glute curve"],
 glute_side_projection:["subtle side glute projection","broad side glute projection","enormous side glute projection"],
 thigh_inner_fullness:["slender inner thigh contour","full inner thigh contour","extremely full inner thigh contour"],
 thigh_outer_fullness:["narrow outer thigh contour","broad outer thigh contour","extremely broad outer thigh contour"],
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
