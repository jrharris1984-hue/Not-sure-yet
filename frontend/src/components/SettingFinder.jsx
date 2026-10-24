import {useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {matchesSection} from '@/lib/sectionSearch';
import './SettingFinder.css';

export default function SettingFinder({sections, onSelect}) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(30);
  const results = useMemo(() => sections.flatMap(section => (section.fields || [])
    .filter(field => matchesSection({...section, fields:[field]}, query))
    .map(field => ({section:section.key, category:section.title, field:field.key, label:field.label}))), [sections, query]);
  const close = () => { dialog.current?.close(); trigger.current?.focus(); };
  return <>
    <button ref={trigger} type="button" className="setting-finder-trigger" onClick={() => {
      setQuery(''); setLimit(30); dialog.current?.showModal(); input.current?.focus();
    }}>Find a setting</button>
    {createPortal(<dialog ref={dialog} className="setting-finder" aria-label="Find a setting" onClose={() => trigger.current?.focus()}>
      <header><div><h2>Find a setting</h2><p>Search every category, then open a control.</p></div><button type="button" onClick={close} aria-label="Close setting finder">Close</button></header>
      <label>Setting or option<input ref={input} type="search" value={query} placeholder="Try hair color, shoes, or lighting…" onChange={event => {setQuery(event.target.value); setLimit(30);}} /></label>
      <div className="setting-finder-summary" role="status">{results.length} {results.length === 1 ? 'control' : 'controls'}{query.trim() ? ' found' : ' available'}</div>
      <div className="setting-finder-results">
        {results.slice(0,limit).map(item => <button type="button" key={`${item.section}:${item.field}`} onClick={() => {close(); onSelect(item);}}>
          <span>{item.label}</span><small>{item.category}</small><span aria-hidden="true">›</span>
        </button>)}
        {!results.length && <p>No matching controls. Try a category name or a shorter search.</p>}
        {results.length > limit && <button type="button" onClick={() => setLimit(value => value + 30)}>Show more controls</button>}
      </div>
      {query && <button type="button" className="setting-finder-clear" onClick={() => {setQuery('');setLimit(30);input.current?.focus();}}>Clear search</button>}
    </dialog>, document.body)}
  </>;
}
