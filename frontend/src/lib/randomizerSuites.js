import { randomizeSection, SECTIONS } from './dna';
import { enforcePhotoConsistency, photoCastIssues } from './photoConsistency';
import { HERITAGE_OUTFIT_GROUP, heritagePhotoOutfit } from './heritageStyling';
import { updateWorkspaceField } from './workspaceFields';
import { applyCustomRandomizer } from './customRandomizers';
const suite=(id,label,category,sections,detail,extra={})=>({id,label,category,sections,detail,...extra});
const person=['physique','face','hair','skin'];
const photo=['pose','scene','lighting','camera','style'];
const scene=(id,label,environment,source)=>suite(id,label,'Scenes',['scene','lighting','camera','style'],`Coordinate ${environment}, light and camera.`,{shared:true,setting:{environment,source}});
export const RANDOMIZER_SUITES=[
  suite('whole','Complete photo setup','Whole setups',[...person,'wardrobe',...photo],'Appearance, coordinated clothing, pose and scene.',{shared:true,outfit:'everyday'}),
  suite('person','Fresh character look','Whole setups',person,'New appearance; keep outfit and scene.'),
  suite('portrait','Portrait session','Whole setups',[...person,...photo],'New look in a softly lit studio.',{shared:true,setting:{environment:'studio',source:'softbox'},framing:'waist-up'}),
  suite('street','Street portrait','Whole setups',['wardrobe',...photo],'Everyday fashion and an outdoor city setting.',{shared:true,outfit:'everyday',setting:{environment:'urban street',source:'natural'}}),
  suite('coast','Coastal session','Whole setups',['wardrobe',...photo],'Light clothing, daylight and a coastal setting.',{shared:true,outfit:'light',setting:{environment:'beach',source:'natural'}}),
  suite('face','Face & expression','Character details',['face'],'Vary facial traits and expression.'),
  suite('expression','Expression only','Character details',['face'],'Keep facial structure; vary expression.',{fields:{face:['expression']}}),
  suite('eyes','Eye color only','Character details',['face'],'Change eye color; keep the rest.',{fields:{face:['eye_color']}}),
  suite('hair','Hair makeover','Character details',['hair'],'Coordinate cut, length and natural color.'),
  suite('hair-color','Hair color only','Character details',['hair'],'Try another natural hair color.',{fields:{hair:['color']}}),
  suite('body','Natural body build','Character details',['physique'],'Vary proportions within natural-photo ranges.'),
  suite('skin','Skin detail','Character details',['skin'],'Vary texture and freckles; retain skin tone.'),
  suite('identity','Identity & age','Character details',['identity'],'Vary unlocked identity details; uncheck Keep identity first.'),
  suite('everyday','Everyday outfits','Wardrobe',['wardrobe'],'Choose a coordinated everyday clothing set.',{outfit:'everyday'}),
  suite('heritage','Heritage-inspired style','Wardrobe',['wardrobe'],'Contemporary outfit suggestions based on selected heritage.',{outfit:'heritage'}),
  suite('linen','Linen & light layers','Wardrobe',['wardrobe'],'Coordinate a light linen outfit.',{outfit:'light'}),
  suite('tailored','Tailored casual','Wardrobe',['wardrobe'],'Try blazers, trousers and coordinated separates.',{outfit:'tailored'}),
  scene('studio','Soft studio','studio','softbox'),scene('window','Window-light room','living room','window'),
  scene('city','City daylight','urban street','natural'),scene('beach','Beach daylight','beach','natural'),
  scene('forest','Forest portrait','forest','natural'),
  suite('pose','Pose & framing','Photography',['pose','camera'],'Coordinate a natural pose and framing.',{shared:true}),
  suite('full-body','Full-body composition','Photography',['pose','camera'],'Keep the whole person visible.',{shared:true,framing:'full body'}),
  suite('close','Portrait composition','Photography',['pose','camera'],'A closer portrait crop.',{shared:true,framing:'waist-up'}),
  suite('lighting','Lighting variation','Photography',['lighting'],'Try coherent photographic light.',{shared:true}),
  suite('camera','Lens & composition','Photography',['camera'],'Vary photographic lens and composition.',{shared:true}),
  suite('footwear','Footwear focus','Photography',['pose','feet','camera'],'A natural footwear composition; retain the outfit.',{shared:true,footwear:true}),
];
const copy=value=>JSON.parse(JSON.stringify(value));
const pick=(values,old)=>{const pool=values.filter(v=>v!==old);const list=pool.length?pool:values;return list[Math.floor(Math.random()*list.length)];};
export function randomizerChanges(before,after) {
  return after.flatMap((p,index)=>Object.entries(p.dna).flatMap(([section,fields])=>Object.entries(fields || {}).flatMap(([field,value])=>JSON.stringify(value)===JSON.stringify(before[index]?.dna[section]?.[field])?[]:[{person:index+1,section,field,before:before[index]?.dna[section]?.[field],after:value}])));
}
export function proposeRandomizer(people,id,{active=0,target='active',keepIdentity=true,keepBody=false,custom}={}) {
  const spec=RANDOMIZER_SUITES.find(s=>s.id===id);
  if(!custom && !spec)throw new Error('Choose a randomizer suite.');
  if(!people.length)return {people,changes:[],issues:['Add a character first.']};
  const sharedSections=custom?[...new Set(custom.rules?.map(rule=>rule.section) || [])]:spec.sections;
  const shared=spec?.shared || (custom && sharedSections.some(section=>['scene','lighting','camera','style'].includes(section)));
  let issues=[];
  for(let attempt=0;attempt<24;attempt++) {
    let result=copy(people);
    result=result.map((p,index)=>{
      if(!shared && target!=='all' && index!==active)return p;
      const locks={...p.locks,...(keepIdentity?{identity:true}:{}),...(keepBody?{physique:true}:{})};
      const fieldLocks=copy(p.field_locks || {});
      if(spec?.fields)for(const section of spec.sections)for(const field of SECTIONS.find(s=>s.key===section)?.fields || [])if(!spec.fields[section]?.includes(field.key))fieldLocks[section]={...fieldLocks[section],[field.key]:true};
      p={...p,locks,field_locks:fieldLocks};
      if(custom){const proposed=applyCustomRandomizer([{...p,id:String(index),label:`Person ${index+1}`}],custom,locks);issues.push(...proposed.issues);return {...p,dna:proposed.subjects[0].dna};}
      for(const section of spec.sections)if(!locks[section])p.dna[section]=randomizeSection(section,p.dna[section],fieldLocks[section],{profile:'natural',avoidCurrent:true});
      const set=(section,field,value)=>{p=updateWorkspaceField(p,section,field,value);};
      if(spec.outfit && !locks.wardrobe){
        let choices=HERITAGE_OUTFIT_GROUP.options;
        if(spec.outfit==='light')choices=choices.filter(v=>/linen|lightweight/.test(v));
        if(spec.outfit==='tailored')choices=choices.filter(v=>/tailored|blazer|trousers/.test(v));
        const outfit=spec.outfit==='heritage'?heritagePhotoOutfit(p.dna.identity.ethnicity,p.dna.wardrobe.outfit_set):pick(choices,p.dna.wardrobe.outfit_set);
        set('wardrobe','outfit_set',outfit);
      }
      if(spec.setting){set('scene','environment',spec.setting.environment);set('scene','indoor_outdoor',['studio','living room'].includes(spec.setting.environment)?'indoor':'outdoor');set('lighting','source',spec.setting.source);}
      if(spec.framing)set('pose','distance',people.length>1?'full body':spec.framing);
      if(spec.footwear){set('pose','action','sitting on edge');set('pose','hands','at sides');set('pose','focus','feet');set('pose','distance',people.length>1?'full body':'detail shot');set('feet','composition_mode','feet focus');set('feet','framing',people.length>1?'full body':'knees-down');set('feet','foot_pose','feet side by side');set('feet','sole_presentation','');set('camera','lens','50mm');}
      p.dna=enforcePhotoConsistency(p.dna,locks,fieldLocks,spec.sections);
      return p;
    });
    // Shared-scene suites use one photographic setup while retaining each person's locks.
    if(shared)for(let i=1;i<result.length;i++)for(const section of sharedSections.filter(s=>['scene','lighting','camera','style'].includes(s))) {
      if(result[i].locks[section])continue;
      for(const [field,value] of Object.entries(result[0].dna[section] || {}))if(!result[i].field_locks[section]?.[field] && !['background','props','extra'].includes(field))result[i].dna[section]={...result[i].dna[section],[field]:copy(value)};
    }
    // Temporary scope locks are never saved back to the character.
    result=result.map((p,i)=>({...people[i],dna:p.dna}));
    issues=[...issues,...photoCastIssues(result.map((p,i)=>({...p,label:`Person ${i+1}`})))];
    if(!issues.length){const changes=randomizerChanges(people,result);return {people:result,changes,issues:changes.length?[]:['No unlocked choices changed. Try another suite or adjust Keep options.']};}
    if(attempt<23)issues=[];
  }
  return {people,changes:[],issues:[...new Set(issues)]};
}
