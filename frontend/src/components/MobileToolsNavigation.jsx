import { Users, SlidersHorizontal, Layers, Sparkles, ImagePlus, ClipboardList, FolderOpen, Images, ChevronLeft } from 'lucide-react';
export const MOBILE_TOOL_GROUPS = [
  { id: 'presets', title: 'Presets & people', description: 'Heritage, character presets, cast and randomize.', icon: Users },
  { id: 'generation', title: 'Model & output', description: 'Workflow, quality, canvas and sampling.', icon: SlidersHorizontal },
  { id: 'loras', title: 'LoRAs', description: 'Style models, strengths and likeness.', icon: Layers },
  { id: 'prompts', title: 'Prompt & AI', description: 'Describe the scene, review prompts and get AI help.', icon: Sparkles },
  { id: 'references', title: 'References & pose', description: 'Reference images, framing and pose assistance.', icon: ImagePlus },
  { id: 'review', title: 'Character review', description: 'Review the current cast and selected traits.', icon: ClipboardList },
  { id: 'files', title: 'Files & tags', description: 'Import, export, tags and photo shoots.', icon: FolderOpen },
  { id: 'results', title: 'Results', description: 'Generation progress, images and downloads.', icon: Images },
];
export default function MobileToolsNavigation({ group, onGroup, onBack }) {
  const selected = MOBILE_TOOL_GROUPS.find(item => item.id === group);
  return <section className="mobile-tools-navigation md:hidden" data-testid="mobile-tools-navigation">
    <header className="flex items-center justify-between gap-2 mb-3"><button type="button" className="chip" onClick={onBack}><ChevronLeft className="h-4 w-4" />Back to builder</button>
      {selected && <button type="button" className="chip" onClick={() => onGroup('overview')}>All tools</button>}</header>
    <h1 className="font-display font-bold text-xl">{selected?.title || 'More tools'}</h1>
    <p className="text-xs text-zinc-400 mt-1 mb-3">{selected?.description || 'Choose a category. Your character selections stay in place.'}</p>
    {selected ? <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Tool categories">{MOBILE_TOOL_GROUPS.map(item => <button type="button" key={item.id} className={`chip shrink-0 ${item.id === group ? 'active' : ''}`} aria-pressed={item.id === group} onClick={() => onGroup(item.id)}><item.icon className="h-4 w-4" />{item.title}</button>)}</nav>
      : <div className="grid grid-cols-2 gap-3">{MOBILE_TOOL_GROUPS.map(item => <button type="button" key={item.id} className="pane rounded-xl p-4 text-left" onClick={() => onGroup(item.id)}>
        <item.icon className="h-5 w-5 mb-2 text-brass" aria-hidden="true" /><span className="block text-sm font-semibold">{item.title}</span><span className="block text-xs text-zinc-400 mt-1">{item.description}</span></button>)}</div>}
  </section>;
}
