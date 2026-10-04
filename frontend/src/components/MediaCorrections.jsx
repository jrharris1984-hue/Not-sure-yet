import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaPeopleMetadata } from '@/lib/mediaLibraryMetadata';
import { endpoints } from '@/lib/api';

const FIELDS = [
  ['person_count', 'Actual people count'], ['mirror_reflection', 'Mirror / reflection'],
  ['search_description', 'Description'], ['interaction', 'Action / interaction'],
  ['physical_appearance', 'Appearance'], ['wardrobe_details', 'Wardrobe'], ['pose', 'Position / pose'],
  ['framing', 'Framing'], ['lighting', 'Lighting'], ['environment', 'Location'],
  ['hair_color', 'Hair color'], ['hair_length', 'Hair length'], ['hair_style', 'Hair style'],
];
const normalizeTag = value => value.trim().toLowerCase().replace(/_/g, ' ');

export default function MediaCorrections({ item, onSaved, onDirtyChange }) {
  const [values, setValues] = useState({});
  const [confirmed, setConfirmed] = useState([]);
  const [tags, setTags] = useState([]);
  const [organization, setOrganization] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [tagType, setTagType] = useState('detail');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { onDirtyChange?.(dirty || !!busy); }, [dirty, busy, onDirtyChange]);
  const catalog = useQuery({ queryKey: ['media-library-tags'], queryFn: endpoints.mediaLibraryTags });
  const signature = JSON.stringify([item.id, item.correction_review]);
  useEffect(() => {
    const review = item.correction_review;
    const initial = Object.fromEntries(FIELDS.map(([key]) => [key, item[key] ?? (key === 'person_count' ? null : key === 'mirror_reflection' ? 'uncertain' : '')]));
    initial.search_description ||= item.subject_description || '';
    const metadata = mediaPeopleMetadata(item);
    initial.person_count = item.person_count ?? metadata.personCount;
    initial.people = Array.isArray(item.people) ? item.people : metadata.people.map(person => ({
      description: person.description || '', gender: person.gender || '', physical_appearance: person.physicalAppearance || '',
      wardrobe_details: person.wardrobe || '', pose: person.pose || '', hair_color: person.hairColor || '',
      hair_length: person.hairLength || '', hair_style: person.hairStyle || '',
    }));
    setValues({ ...initial, ...(review?.values || {}) });
    setConfirmed(review?.confirmed_fields || []);
    setTags([...new Set((review?.descriptive_tags || [...(item.general_tags || []), ...(item.adult_content_tags || [])]).map(normalizeTag))]);
    setOrganization(review?.organization_tags || []);
    setDirty(false); setMessage('');
    // Only reset when a saved record changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  const change = (key, value) => {
    setValues(cur => ({ ...cur, [key]: value }));
    setConfirmed(cur => cur.includes(key) ? cur : [...cur, key]); setDirty(true);
  };
  const addTag = () => {
    const tag = normalizeTag(newTag); if (!tag) return;
    (tagType === 'detail' ? setTags : setOrganization)(cur => cur.includes(tag) ? cur : [...cur, tag]);
    setNewTag(''); setDirty(true);
  };
  const save = async () => {
    setBusy('save'); setMessage('');
    try {
      await endpoints.saveMediaCorrections(item.id, { values, confirmed_fields: confirmed, descriptive_tags: tags, organization_tags: organization });
      await onSaved(); await catalog.refetch(); setDirty(false); setMessage('Corrections saved. Studio imports now use these details.');
    } catch (e) { setMessage(e?.response?.data?.detail || 'Could not save corrections. Your edits are still here.'); }
    finally { setBusy(''); }
  };
  const reanalyze = async () => {
    setBusy('analysis'); setMessage('');
    try {
      await endpoints.reanalyzeMedia(item.id); await onSaved(); setMessage('Reanalysis complete. Confirmed fields and your tags were preserved.');
    } catch (e) { setMessage(e?.response?.data?.detail || 'Reanalysis failed. Saved corrections were preserved.'); }
    finally { setBusy(''); }
  };
  const fieldClass = 'mt-1 w-full rounded-lg bg-elevated border hairline px-2 py-2 text-sm';
  return <details className="rounded-lg border hairline p-3" data-testid="media-corrections">
    <summary className="cursor-pointer font-semibold text-sm text-cyan-200">Correct analysis & tags</summary>
    <p className="text-xs text-zinc-400 mt-2">Edited facts are confirmed automatically. Uncheck a confirmation to let AI revise it. Save before using in Studio. Organization tags are excluded from generation.</p>
    <fieldset disabled={!!busy} className="space-y-3 mt-3">
      {FIELDS.map(([key, label]) => <div key={key}>
        <label className="block text-xs text-zinc-400">{label}
          {key === 'person_count' ? <input aria-label={label} type="number" min={0} max={20} value={values[key] ?? ''} placeholder="Unknown" className={fieldClass}
            onChange={e => change(key, e.target.value === '' ? null : Number(e.target.value))} />
          : key === 'mirror_reflection' ? <select aria-label={label} value={values[key] || 'uncertain'} className={fieldClass} onChange={e => change(key, e.target.value)}>
              <option value="uncertain">Uncertain</option><option value="yes">Yes — reflection present</option><option value="no">No reflection</option></select>
          : <textarea aria-label={label} rows={2} maxLength={3000} value={values[key] || ''} className={fieldClass} onChange={e => change(key, e.target.value)} />}
        </label>
        <label className="text-[10px] flex gap-2 items-center mt-1"><input type="checkbox" checked={confirmed.includes(key)}
          onChange={e => { setConfirmed(cur => e.target.checked ? [...cur, key] : cur.filter(k => k !== key)); setDirty(true); }} />Confirmed — keep during reanalysis</label>
      </div>)}
      {values.people?.length > 0 && Number.isInteger(values.person_count) && values.people.length !== values.person_count && <p className="text-xs text-amber-200">People records and actual count differ. Check for duplicate reflections or missing records.</p>}
      <details className="text-xs"><summary className="cursor-pointer">Separate people records ({values.people?.length || 0})</summary>
        <p className="text-zinc-400 mt-2">A reflection belongs to the same person. Remove duplicate reflected records; use the people count above for the real count.</p>
        {(values.people || []).map((person, index) => <div key={index} className="border hairline rounded p-2 mt-2">
          <span>Person {index + 1}</span><button type="button" className="ml-2 text-red-300" onClick={() => change('people', values.people.filter((_, i) => i !== index))}>Remove</button>
          {['description', 'gender', 'physical_appearance', 'wardrobe_details', 'pose', 'hair_color', 'hair_style'].map(key => <label key={key} className="block mt-2">{key.replace(/_/g, ' ')}<input className={fieldClass} maxLength={3000} value={person[key] || ''} onChange={e => change('people', values.people.map((p, i) => i === index ? { ...p, [key]: e.target.value } : p))} /></label>)}
        </div>)}
        <button type="button" disabled={(values.people?.length || 0) >= 20} className="chip mt-2" onClick={() => change('people', [...(values.people || []), {}])}>Add person record</button>
        <label className="flex gap-2 mt-2"><input type="checkbox" checked={confirmed.includes('people')} onChange={e => { setConfirmed(cur => e.target.checked ? [...cur, 'people'] : cur.filter(k => k !== 'people')); setDirty(true); }} />Confirm all person records</label>
      </details>
      {[['Image detail tags', tags, setTags], ['Organization tags', organization, setOrganization]].map(([label, list, setter]) => <div key={label}><div className="text-xs text-zinc-400">{label}</div><div className="flex flex-wrap gap-1 mt-1">
        {list.map(tag => <button type="button" className="chip" key={tag} aria-label={`Remove ${label}: ${tag}`} onClick={() => { setter(cur => cur.filter(t => t !== tag)); setDirty(true); }}>{tag} ×</button>)}
      </div></div>)}
      <label className="block text-xs">Select an existing tag or create one<input list={`media-tags-${item.id}`} maxLength={80} value={newTag} className={fieldClass} onChange={e => setNewTag(e.target.value)} />
        <datalist id={`media-tags-${item.id}`}>{[...new Set([...(catalog.data?.tags || []), ...tags, ...organization])].map(tag => <option value={tag} key={tag} />)}</datalist>
      </label>
      <div className="flex flex-wrap gap-2"><select value={tagType} onChange={e => setTagType(e.target.value)} className="bg-elevated rounded border hairline p-2 text-xs"><option value="detail">Image detail</option><option value="organization">Organization only</option></select>
        <button type="button" className="chip" onClick={addTag}>Add tag</button></div>
      <div className="flex flex-wrap gap-2"><button type="button" className="chip active" onClick={save}>{busy === 'save' ? 'Saving…' : 'Save corrections'}</button>
        <button type="button" className="chip disabled:opacity-40" disabled={dirty || item.media_type === 'video'} onClick={reanalyze}>{busy === 'analysis' ? 'Analyzing…' : 'Reanalyze unconfirmed details'}</button></div>
      {dirty && <p className="text-xs text-amber-200">Unsaved corrections. Save before reanalysis or importing.</p>}
    </fieldset>
    <p className="text-xs text-zinc-400 mt-2">Reanalysis uses Ultra Studio’s image-review model in Settings, with two checks for reflections and mixed person details. Saved tags and confirmations persist in Ultra Studio.</p>
    {message && <p role="status" className="text-xs mt-2 text-cyan-200">{message}</p>}
  </details>;
}
