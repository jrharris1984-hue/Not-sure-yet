import { Link } from 'react-router-dom';
import { ImagePlus, Shuffle, Video, ArrowUpRight } from 'lucide-react';
import { workflowCatalog } from '@/lib/workflowCatalog';

export const IMAGE_TOOL_KINDS = ['edit', 'enhance', 'variation', 'video'];
export function imageToolGroups(workflows = []) {
  const available = workflowCatalog(workflows).primary;
  return [
    { id: 'edit', title: 'Edit a photo', description: 'Change details, repair an image, transfer a pose, or choose a camera angle.', icon: ImagePlus, kinds: ['edit', 'enhance'] },
    { id: 'variation', title: 'Create variations', description: 'Explore nearby visual changes from an existing image.', icon: Shuffle, kinds: ['variation'] },
    { id: 'video', title: 'Animate an image', description: 'Start from a photograph and choose movement and duration.', icon: Video, kinds: ['video'] },
  ].map(group => ({ ...group, workflows: available.filter(workflow => group.kinds.includes(workflow.kind)) }));
}

export default function HomeImageTools({ workflows, loading, error }) {
  return <section className="space-y-3" data-testid="home-image-tools">
    <div className="pane p-4 space-y-3"><h2 className="font-display text-xl font-bold">Create from a prompt</h2>
      <p className="text-sm text-zinc-400">Free-form prompts with optional AI help. No character setup required.</p>
      <div className="grid gap-2 sm:grid-cols-3">{[['image', 'Text to image'], ['video', 'Image to video'], ['text-video', 'Text to video']].map(([mode, label]) => <Link key={mode} to={`/create/${mode}`} className="rounded-lg border border-cyan-400/30 px-3 py-3 text-cyan-200 hover:bg-cyan-500/10">{label} <ArrowUpRight className="inline h-4 w-4"/></Link>)}</div>
    </div>
    <div><h2 className="font-display text-xl font-bold">Work with an existing image</h2>
      <p className="mt-1 text-sm text-zinc-400">Open a tool, upload your image, and describe the change.</p></div>
    {error ? <p className="text-sm text-amber-200">Image tools could not load. Try refreshing, or check <Link to="/settings" className="underline">Settings</Link>.</p>
      : loading ? <p className="text-sm text-zinc-400">Loading image tools…</p>
      : <div className="grid gap-3 lg:grid-cols-3">{imageToolGroups(workflows).map(group => <div key={group.id} className="pane p-4 space-y-3">
        <div className="flex items-center gap-2 text-cyan-200"><group.icon className="h-5 w-5"/><h3 className="font-semibold">{group.title}</h3></div>
        <p className="text-xs leading-relaxed text-zinc-400">{group.description}</p>
        <div className="space-y-2">{group.workflows.length ? group.workflows.map(workflow => <Link key={workflow.id} to={`/image-tools/${encodeURIComponent(workflow.id)}`}
          className="flex items-center justify-between gap-2 rounded-lg border hairline bg-white/[.02] px-3 py-2.5 text-sm text-zinc-200 hover:border-cyan-400/40 hover:bg-cyan-500/5">
          <span className="min-w-0 break-words">{workflow.name}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-cyan-300"/>
        </Link>) : <p className="text-xs text-zinc-500">No workflow configured. <Link to="/settings" className="text-cyan-300 underline">Add or refresh workflows</Link>.</p>}</div>
      </div>)}</div>}
  </section>;
}
