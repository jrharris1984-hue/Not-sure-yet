import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
import { photoshootCatalog } from '@/lib/batchSmartPhotoshoot';
import SmartPhotoshootDesigner from '@/components/SmartPhotoshootDesigner';
import { toast } from 'sonner';

export default function SmartPhotoshootLibrary() {
  const qc = useQueryClient();
  const sectionRef = useRef(null);
  const detailsRef = useRef(null);
  useEffect(() => {
    if (window.location.hash === '#smart-photoshoot-library') {
      detailsRef.current.open = true;
      sectionRef.current.scrollIntoView?.({ block: 'start' });
    }
  }, []);
  const { data: settings, isLoading, error } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const presets = useMemo(() => settings?.custom_photoshoot_presets || [], [settings?.custom_photoshoot_presets]);
  const catalog = useMemo(() => photoshootCatalog(presets), [presets]);
  const [source, setSource] = useState(null);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('saved');
  const save = async preset => {
    const latest = await endpoints.settings();
    const updated = await endpoints.updateSettings({ custom_photoshoot_presets: [...(latest.custom_photoshoot_presets || []).filter(item => item.key !== preset.key), preset] });
    qc.setQueryData(['settings'], updated);
    toast.success('Photoshoot saved to Library');
  };
  const remove = async key => {
    const latest = await endpoints.settings();
    const updated = await endpoints.updateSettings({ custom_photoshoot_presets: (latest.custom_photoshoot_presets || []).filter(item => item.key !== key) });
    qc.setQueryData(['settings'], updated);
    toast.success('Photoshoot removed from Library');
  };
  const visible = catalog.categories.map(category => ({ ...category,
    presets: category.presets.filter(preset => (scope === 'all' || preset.custom) &&
      `${preset.label} ${preset.description} ${category.label}`.toLowerCase().includes(search.toLowerCase())),
  })).filter(category => category.presets.length);
  return <section ref={sectionRef} id="smart-photoshoot-library" className="pane scroll-mt-6 p-4 sm:p-5" data-testid="smart-photoshoot-library">
    <details ref={detailsRef}>
      <summary className="cursor-pointer text-base font-semibold text-cyan-200">Smart Photoshoot Library <span className="text-xs text-zinc-400">· {presets.length} saved</span></summary>
      <p className="mt-2 text-sm text-zinc-400">Save planned shots from the Smart Photoshoot director, then edit several shots together here. Saved shoots appear in the director’s Shoot style menu.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input aria-label="Search photoshoots" placeholder="Search shoots…" value={search} onChange={e => setSearch(e.target.value)} className="min-h-11 flex-1 rounded-lg border hairline bg-elevated px-3 text-sm text-zinc-100" />
        <select aria-label="Photoshoot library filter" value={scope} onChange={e => setScope(e.target.value)} className="min-h-11 rounded-lg border hairline bg-elevated px-3 text-sm text-zinc-100">
          <option value="saved">My saved shoots</option><option value="all">All shoot styles</option>
        </select>
        <button type="button" disabled={isLoading || !!error} onClick={() => setSource('__blank__')} className="min-h-11 rounded-lg bg-cyan-400 px-4 text-sm font-bold text-black disabled:opacity-40">New shoot</button>
      </div>
      {isLoading ? <p className="mt-3 text-sm text-zinc-400">Loading shoots…</p> : error ? <p role="alert" className="mt-3 text-sm text-red-300">Could not load your shoots. Refresh to try again.</p> : <>
        {!visible.length && <p className="mt-3 text-sm text-zinc-400">No matching saved shoots. Save a planned shoot or choose All shoot styles to customize a built-in style.</p>}
        <div className="mt-3 max-h-[32rem] space-y-4 overflow-y-auto overscroll-contain">
          {visible.map(category => <div key={category.key}>
            <h2 className="mb-2 text-xs font-semibold text-zinc-400">{category.label}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {category.presets.map(preset => <button key={preset.key} type="button" onClick={() => setSource(preset.key)}
                className="min-h-20 rounded-xl border hairline p-3 text-left hover:border-cyan-500/40">
                <span className="block text-sm font-semibold text-zinc-100">{preset.label}</span>
                <span className="mt-1 block text-xs text-zinc-400">{preset.sequence.length} shots · {preset.custom ? 'Edit shots' : 'Customize a copy'}</span>
              </button>)}
            </div>
          </div>)}
        </div>
      </>}
    </details>
    <SmartPhotoshootDesigner open={source !== null} sourcePreset={source || '__blank__'} customPresets={presets} onClose={() => setSource(null)} onSave={save} onDelete={remove} />
  </section>;
}
