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
    {matchingGroups.map(group=>{const matches=group.matches;
      return !!matches.length && <div key={group.key}><button type="button" aria-expanded={expanded===group.key} onClick={()=>setExpanded(expanded===group.key?null:group.key)} className="min-h-11 font-semibold">{group.title}<span aria-hidden="true">{expanded===group.key?" ▾":" ▸"}</span></button>{expanded===group.key && matches.map(section=><button key={section.key} type="button" aria-current={!review && activeSection===section.key?'page':undefined} onClick={()=>onSection(section.key)}>{section.title}</button>)}</div>;
    })}
    <button type="button" className="design-review-button" aria-current={review?'page':undefined} onClick={onReview}>Review & create</button>
  </nav>;
}
