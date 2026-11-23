// Independent physique controls; saved as regular DNA fields and compiled into one clause per axis.
export const PHYSIQUE_DETAIL_GROUPS=[
 {name:'Breasts',controls:[['bust_upper_fullness','Upper fullness'],['bust_lower_fullness','Lower fullness'],['bust_spacing','Spacing'],['bust_width','Base width'],['bust_outer_contour','Outer contour'],['bust_natural_drape','Natural drape'],['bust_roundness','Roundness'],['bust_thickness','Front-to-back thickness'],['bust_side_fullness','Side fullness']]},
 {name:'Hips',controls:[['hip_upper_fullness','Upper hip fullness'],['hip_lower_fullness','Lower hip fullness'],['hip_dip_depth','Hip dip depth'],['hip_waist_transition','Waist-to-hip transition'],['hip_rear_depth','Rear depth'],['hip_roundness','Hip roundness'],['hip_thickness','Hip thickness'],['hip_outer_curve','Outer curve']]},
 {name:'Waist',controls:[['waist_taper','Waist taper'],['waist_torso_length','Torso length'],['waist_abdominal_definition','Abdominal definition'],['waist_ribcage_transition','Ribcage transition'],['waist_side_curve','Side-waist curve'],['waist_roundness','Waist contour roundness'],['waist_thickness','Torso depth'],['waist_front_profile','Front profile']]},
 {name:'Thighs',controls:[['thigh_inner_fullness','Inner thigh fullness'],['thigh_outer_fullness','Outer thigh fullness'],['thigh_roundness','Thigh roundness'],['thigh_thickness','Thigh thickness'],['thigh_taper','Knee taper']]},
 {name:'Glutes',controls:[['glute_upper_fullness','Upper fullness'],['glute_lower_fullness','Lower fullness'],['glute_lateral_width','Lateral width'],['glute_lift','Lift'],['glute_lower_curve','Lower curve'],['glute_side_projection','Side projection'],['glute_roundness','Glute roundness'],['glute_thickness','Glute thickness'],['glute_projection_profile','Projection profile']]},
 {name:'Shoulders',controls:[['shoulder_slope','Shoulder slope'],['shoulder_roundness','Shoulder contour roundness'],['clavicle_definition','Clavicle definition'],['shoulder_back_width','Upper-back width']]},
 {name:'Arms',controls:[['upper_arm_shape','Upper-arm contour'],['arm_muscularity','Arm muscular definition'],['arm_softness','Arm softness'],['forearm_fullness','Forearm fullness']]},
 {name:'Calves',controls:[['calf_roundness','Calf roundness'],['calf_muscularity','Calf muscular definition'],['ankle_taper','Ankle taper'],['lower_leg_length','Lower-leg proportion']]},
];
const descriptions={
 bust_roundness:["subtle rounded breast contour","distinctly rounded breast contour","highly spherical breast contour"],
 bust_thickness:["shallow breast depth","substantial breast depth","extreme breast depth"],
 bust_side_fullness:["narrow side breast contour","full lateral breast contour","dramatic side breast fullness"],
 hip_roundness:["subtle rounded hip contour","smooth rounded hip contour","dramatically rounded hip contour"],
 hip_thickness:["slim hip profile","substantial hip depth","extremely thick hip profile"],
 hip_outer_curve:["gentle outer hip curve","sweeping outer hip curve","dramatic outer hip arc"],
 waist_roundness:["subtle curved waist contour","smooth rounded waist contour","strongly sculpted waist curve"],
 waist_thickness:["shallow torso depth","substantial torso depth","very thick torso depth"],
 waist_front_profile:["flat abdominal profile","soft rounded abdominal profile","pronounced rounded abdominal profile"],
 glute_roundness:["subtle rounded glute contour","strongly rounded glute contour","dramatically spherical glute contour"],
 glute_thickness:["shallow glute depth","substantial glute depth","monumental glute depth"],
 glute_projection_profile:["gentle rearward glute curve","pronounced rearward glute arc","dramatically projecting rearward glute silhouette"],
 thigh_roundness:["subtle rounded thigh contour","full rounded thigh contour","extremely rounded thigh contour"],
 thigh_thickness:["slender upper thigh profile","thick upper thigh profile","massively thick upper thigh profile"],
 thigh_taper:["gradual upper-thigh to knee taper","pronounced upper-thigh to knee taper","dramatic upper-thigh to knee taper"],
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
 glute_lift:['low-set glute silhouette','lifted glute silhouette','strongly elevated glute silhouette'],
 shoulder_width:['very narrow shoulder width with a compact upper-body frame','narrow shoulders with a softly tapered upper body','balanced shoulder width in proportion to the hips','broad shoulders with a clear upper-body line','very broad shoulders with a strong, expansive upper-body frame'],
 shoulder_slope:['steeply sloped shoulders','softly sloping shoulder line','balanced shoulder slope','gently squared shoulder line','strongly squared broad shoulder line'],
 shoulder_roundness:['angular shoulder contour','subtle rounded shoulder contour','smoothly rounded shoulder contour','full rounded deltoid contour','prominently rounded shoulder and deltoid contour'],
 clavicle_definition:['softly defined collarbone line','subtle clavicle definition','clear natural clavicle definition','pronounced collarbone definition','strong high-definition clavicle line'],
 shoulder_back_width:['narrow upper-back silhouette','slim upper-back contour','balanced upper-back width','broad upper-back silhouette','very broad upper-back frame'],
 upper_arm_fullness:['slender upper arms with minimal fullness','slim upper arms with gentle contour','balanced upper-arm fullness','full rounded upper arms','very full upper arms with substantial volume'],
 upper_arm_shape:['softly tapered upper-arm contour','slim upper-arm contour','balanced upper-arm shape','rounded defined upper-arm contour','strongly rounded upper-arm silhouette'],
 arm_muscularity:['smooth arms with no visible muscle definition','subtle natural arm definition','clear toned arm definition','pronounced athletic arm definition','strong muscular arm definition with visible separation'],
 arm_softness:['firm upper-arm contour','lightly softened upper-arm contour','natural soft-tissue fullness in the arms','soft full upper-arm contour','very soft, visibly full upper-arm contour'],
 forearm_fullness:['slender forearms with a narrow contour','lean forearms with gentle shape','balanced forearm fullness','full rounded forearms','very full forearms with a broad contour'],
 calf_fullness:['slender calves with little lower-leg volume','lean calves with a gentle contour','balanced calf fullness','full rounded calves','very full calves with substantial lower-leg volume'],
 calf_roundness:['straight narrow calf contour','subtle calf curve','smooth rounded calf contour','pronounced rounded calf contour','strongly rounded full calf silhouette'],
 calf_muscularity:['soft calf contour with no visible definition','subtle natural calf definition','clear athletic calf shape','pronounced calf-muscle definition','strong muscular calf definition'],
 ankle_taper:['gradual lower-leg line with little ankle taper','soft ankle taper','balanced calf-to-ankle taper','defined taper from calf to ankle','sharp narrow ankle taper beneath a full calf'],
 lower_leg_length:['shorter lower-leg proportion','slightly compact lower-leg proportion','balanced lower-leg proportion','long lower-leg proportion','very long lower-leg proportion']
};
export const PHYSIQUE_DETAIL_KEYS=Object.keys(descriptions);
export function physiqueDetailPrompt(ph={}){
 return PHYSIQUE_DETAIL_KEYS.map(key=>{
 const n=Math.max(0,Math.min(100,Number(ph[key])||0));
 if(!n)return '';
 const tier=descriptions[key].length>=5?Math.min(4,Math.floor(n/20)):n<=33?0:n<=66?1:2;
 return descriptions[key][tier];
 }).filter(Boolean).join(', ');
}
