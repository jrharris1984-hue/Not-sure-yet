import {useState} from 'react';
import {matchesSection} from '@/lib/sectionSearch';
export default function DesignCategoryNavigation({stages,sections,activeSection,onSection,onReview,review}) {
  const [query,setQuery]=useState('');
  const known=new Set(stages.flatMap(stage=>stage.sections || []));
  const groups=[...stages.filter(stage=>stage.sections?.length),{key:'other',title:'Other categories',sections:sections.filter(section=>!known.has(section.key)).map(section=>section.key)}];
  const matchingGroups = groups.map(group => ({...group, matches: group.sections.map(key => sections.find(section => section.key === key)).filter(Boolean).filter(section => matchesSection(section, query, group.title))}));
  return <nav className="design-category-nav" aria-label="Design categories">
    <label>Find a setting<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search all settings…" /></label>
    {query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}
    {!matchingGroups.some(group => group.matches.length) && <p role="status" className="text-xs text-zinc-400">No matching categories. Clear your search or try another term.</p>}
    {matchingGroups.map(group=>{const matches=group.matches;
      return !!matches.length && <div key={group.key}><h3>{group.title}</h3>{matches.map(section=><button key={section.key} type="button" aria-current={!review && activeSection===section.key?'page':undefined} onClick={()=>onSection(section.key)}>{section.title}</button>)}</div>;
    })}
    <button type="button" className="design-review-button" aria-current={review?'page':undefined} onClick={onReview}>Review & create</button>
  </nav>;
}
