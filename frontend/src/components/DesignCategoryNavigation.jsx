import SettingFinder from './SettingFinder';
export default function DesignCategoryNavigation({stages,sections,activeSection,onSection,onReview,review,onSetting}) {
  const known=new Set(stages.flatMap(stage=>stage.sections || []));
  const groups=[...stages.filter(stage=>stage.sections?.length),{key:'other',title:'Other categories',sections:sections.filter(section=>!known.has(section.key)).map(section=>section.key)}];
  const matchingGroups = groups.map(group => ({...group, matches: group.sections.map(key => sections.find(section => section.key === key)).filter(Boolean)}));
  return <nav className="design-category-nav" aria-label="Design categories">
    <SettingFinder sections={sections} onSelect={onSetting || (item => onSection(item.section))} />
    {matchingGroups.map(group=>{const matches=group.matches;
      return !!matches.length && <div key={group.key}><h3>{group.title}</h3>{matches.map(section=><button key={section.key} type="button" aria-current={!review && activeSection===section.key?'page':undefined} onClick={()=>onSection(section.key)}>{section.title}</button>)}</div>;
    })}
    <button type="button" className="design-review-button" aria-current={review?'page':undefined} onClick={onReview}>Review & create</button>
  </nav>;
}
