import {UsersRound,ScanFace,Shirt,Camera,Layers,ArrowRight} from 'lucide-react';
import {useEffect, useState} from 'react';
import SettingFinder from './SettingFinder';
export default function DesignCategoryNavigation({stages,sections,activeSection,onSection,onReview,review,onSetting}) {
  const known=new Set(stages.flatMap(stage=>stage.sections || []));
  const groups=[...stages.filter(stage=>stage.sections?.length),{key:'other',title:'Other categories',sections:sections.filter(section=>!known.has(section.key)).map(section=>section.key)}];
  const matchingGroups = groups.map(group => ({...group, matches: group.sections.map(key => sections.find(section => section.key === key)).filter(Boolean)}));
  const activeGroup=matchingGroups.find(group=>group.matches.some(section=>section.key===activeSection))?.key;
  const [expanded,setExpanded]=useState(activeGroup);
  useEffect(()=>setExpanded(activeGroup),[activeGroup]);
  return <nav className="design-category-nav" aria-label="Design categories">
    <SettingFinder sections={sections} onSelect={onSetting || (item => onSection(item.section))} />
    <div className="creation-nav-heading"><span>Create</span><small>Your character & scene</small></div>
    {matchingGroups.map(group=>{const matches=group.matches; const Icon=/people/i.test(group.title)?UsersRound:/appearance/i.test(group.title)?ScanFace:/wardrobe/i.test(group.title)?Shirt:/scene|pose/i.test(group.title)?Camera:Layers;
      return !!matches.length && <div key={group.key} className="creation-nav-group" data-tone={/people/i.test(group.title)?"people":/appearance/i.test(group.title)?"appearance":/wardrobe/i.test(group.title)?"wardrobe":"scene"} data-active={activeGroup===group.key && !review}><button type="button" aria-expanded={expanded===group.key} onClick={()=>setExpanded(expanded===group.key?null:group.key)} className="creation-nav-group-button min-h-11 font-semibold"><span className="creation-nav-icon"><Icon size={19} aria-hidden="true"/></span>{group.title}<span aria-hidden="true">{expanded===group.key?" ▾":" ▸"}</span></button>{expanded===group.key && matches.map(section=><button key={section.key} type="button" aria-current={!review && activeSection===section.key?'page':undefined} className="creation-nav-section" onClick={()=>onSection(section.key)}>{section.title}</button>)}</div>;
    })}
    <button type="button" className="design-review-button" aria-current={review?'page':undefined} onClick={onReview}>Review & create<ArrowRight size={16} aria-hidden="true"/></button>
  </nav>;
}
