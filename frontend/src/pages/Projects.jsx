import { Link } from "react-router-dom";
import { ArrowRight, Camera, FileText, Images, Layers3, Plus, Search, Sparkles, UserRound, WandSparkles } from "lucide-react";

const startActions = [
  { to: "/create", title: "Open Studio", detail: "Create or edit images and video in one workspace.", Icon: WandSparkles, primary: true },
  { to: "/create/guided?start=build", title: "Create a character", detail: "Follow the guided setup, then continue into a photoshoot.", Icon: UserRound },
  { to: "/shoots", title: "Plan a photoshoot", detail: "Choose a saved character and open the storyboard.", Icon: Camera },
];

const workspaces = [
  { to: "/gallery", title: "Gallery", detail: "Find renders, compare results, and continue editing.", Icon: Images },
  { to: "/library", title: "Characters", detail: "Open saved characters and their creative history.", Icon: UserRound },
  { to: "/create", title: "Control library", detail: "Search detailed character, wardrobe, and scene controls in Studio.", Icon: Search },
  { to: "/settings/prompts", title: "Prompt library", detail: "Search, organize, and manage reusable prompt entries.", Icon: FileText },
];

export default function Projects() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-8 sm:py-10" data-testid="projects-workspace">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">ULTRA STUDIO · PROJECT DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your creative workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Start a new project or return to your images, characters, and shoots. Creation, editing, and video tools open in the same Studio workspace.</p>
        </div>
        <Link to="/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-400 px-5 font-semibold text-zinc-950 transition hover:bg-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
          <Plus size={18} /> Start creating
        </Link>
      </header>

      <section aria-labelledby="start-project-heading" className="mb-9">
        <div className="mb-3 flex items-center gap-2"><Sparkles size={17} className="text-violet-300"/><h2 id="start-project-heading" className="text-lg font-semibold">Start a project</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {startActions.map(({to,title,detail,Icon,primary}) => (
            <Link key={title} to={to} className={`group flex min-h-36 flex-col rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300 ${primary ? "border-violet-400/40 bg-violet-400/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"}`}>
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-violet-200"><Icon size={21}/></span>
              <span className="flex items-center justify-between gap-2 font-semibold">{title}<ArrowRight size={16} className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-violet-200"/></span>
              <span className="mt-1 text-sm leading-5 text-zinc-400">{detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="continue-heading">
        <div className="mb-3 flex items-center gap-2"><Layers3 size={17} className="text-cyan-300"/><h2 id="continue-heading" className="text-lg font-semibold">Continue your work</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {workspaces.map(({to,title,detail,Icon}) => (
            <Link key={title} to={to} className="flex min-h-28 items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 transition hover:border-cyan-300/40 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
              <span className="rounded-xl bg-white/[0.06] p-2 text-cyan-200"><Icon size={18}/></span>
              <span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-zinc-400">{detail}</span></span>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">Project collections and saved project timelines are not yet available; these shortcuts open your existing Studio libraries.</p>
      </section>
    </main>
  );
}
