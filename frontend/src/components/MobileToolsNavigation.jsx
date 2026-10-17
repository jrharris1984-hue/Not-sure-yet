import { useState } from 'react';
import { Users, SlidersHorizontal, Layers, Sparkles, ImagePlus, ClipboardList, FolderOpen, Images, ChevronLeft } from 'lucide-react';
export const MOBILE_TOOL_GROUPS = [
  { id: 'presets', title: 'Presets & people', description: 'Name, cast and randomize. Character presets are on Scenario.', icon: Users },
  { id: 'generation', title: 'Model & output', description: 'Workflow, quality, canvas and sampling.', icon: SlidersHorizontal },
  { id: 'loras', title: 'LoRAs', description: 'Style models, strengths and likeness.', icon: Layers },
  { id: 'prompts', title: 'Prompt & AI', description: 'Describe the scene, review prompts and get AI help.', icon: Sparkles },
  { id: 'references', title: 'References & pose', description: 'Reference images, framing and pose assistance.', icon: ImagePlus },
  { id: 'review', title: 'Character review', description: 'Review the current cast and selected traits.', icon: ClipboardList },
  { id: 'files', title: 'Files & tags', description: 'Import, export, tags and photo shoots.', icon: FolderOpen },
  { id: 'results', title: 'Results', description: 'Generation progress, images and downloads.', icon: Images },
];
export default function MobileToolsNavigation({ group, onGroup, onBack }) {
  const [query, setQuery] = useState('');
  const matches = MOBILE_TOOL_GROUPS.filter(item => `${item.title} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = MOBILE_TOOL_GROUPS.find(item => item.id === group);
  return <section className="mobile-tools-navigation md:hidden" data-testid="mobile-tools-navigation">
    <header className="flex items-center justify-between gap-2 mb-3"><button type="button" className="chip" onClick={onBack}><ChevronLeft className="h-4 w-4" />Back to create</button>
      {selected && <button type="button" className="chip" onClick={() => onGroup('overview')}>All settings</button>}</header>
    <h1 className="font-display font-bold text-xl">{selected?.title || 'Advanced settings'}</h1>
    <p className="text-xs text-zinc-400 mt-1 mb-3">{selected?.description || 'Adjust advanced Builder settings without leaving the Create flow.'}</p>
    {!selected && <label className="block mb-3 text-xs text-zinc-400">Find a tool<input className="studio-control-search mt-2" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try model, pose, prompt or download…" /></label>}
    {selected ? <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Tool categories">{MOBILE_TOOL_GROUPS.map(item => <button type="button" key={item.id} className={`chip shrink-0 ${item.id === group ? 'active' : ''}`} aria-pressed={item.id === group} onClick={() => onGroup(item.id)}><item.icon className="h-4 w-4" />{item.title}</button>)}</nav>
      : <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">{matches.map(item => <button type="button" key={item.id} className="pane rounded-xl p-4 text-left" onClick={() => onGroup(item.id)}>
        <item.icon className="h-5 w-5 mb-2 text-brass" aria-hidden="true" /><span className="block text-sm font-semibold">{item.title}</span><span className="block text-xs text-zinc-400 mt-1">{item.description}</span></button>)}{!matches.length && <p role="status" className="col-span-full text-sm text-zinc-400">No matching tools. Try a shorter search.</p>}</div>}
  </section>;
}
