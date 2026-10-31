import {useEffect,useState} from 'react';
import {Compass, ArrowRight} from 'lucide-react';
import SettingFinder from './SettingFinder';

export default function DesignCategoryNavigation({stages=[],sections,searchSections=sections,activeSection,onSection,onReview,review,onSetting,compact=false}) {
  const groups=stages.map(stage=>({key:stage.id || stage.key,title:stage.title,items:sections.filter(item=>stage.sections?.includes(item.key))})).filter(group=>group.items.length);
  const extras=sections.filter(item=>!groups.some(group=>group.items.includes(item)));
  if(extras.length)groups.push({key:'other',title:groups.length?'Other categories':'Categories',items:extras});
  const active=groups.find(group=>group.items.some(item=>item.key===activeSection))?.key;
  const [browsing,setBrowsing]=useState(active);
  useEffect(()=>setBrowsing(active),[active,activeSection]);
  const group=groups.find(item=>item.key===browsing) || groups[0];
  return <nav className={compact?'studio-directory compact-directory':'design-category-nav studio-directory'} aria-label="Design categories">
    <div className="directory-heading"><Compass size={17} aria-hidden="true"/><strong>Section navigator</strong></div>
    <div className="directory-tools"><SettingFinder sections={searchSections} onSelect={onSetting || (item=>onSection(item.section))}/></div>
    <div className="directory-groups" role="group" aria-label="Category groups">{groups.map(item=><button type="button" key={item.key} aria-pressed={item===group} onClick={()=>setBrowsing(item.key)}>{item.title}</button>)}</div>
    <div className="directory-sections" role="group" aria-label={group?.title || 'Categories'}>{group?.items.map(item=><button type="button" key={item.key} aria-current={!review && item.key===activeSection?'page':undefined} onClick={()=>onSection(item.key)}>{item.title}</button>)}</div>
    {onReview && <button type="button" className="directory-review" onClick={onReview}>Review &amp; create<ArrowRight size={15}/></button>}
  </nav>;
}
