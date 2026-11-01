import { Link } from "react-router-dom";
import { FolderKanban, Images, Users, Camera, ArrowUpRight } from "lucide-react";

const destinations = [
  { to: "/gallery", title: "Images", detail: "Browse and continue with your renders", Icon: Images },
  { to: "/library", title: "Characters", detail: "Manage your saved characters", Icon: Users },
  { to: "/shoots", title: "Photoshoots", detail: "Continue your existing shoots", Icon: Camera },
];

export default function Projects() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8" data-testid="projects-workspace">
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><FolderKanban size={28} /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Ultra Studio 2.0</p>
          <h1 className="mt-1 text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-zinc-400">A home for your creative work. Existing images, characters, and shoots remain in their original libraries.</p>
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Project collections are coming</h2>
        <p className="mt-1 text-sm text-zinc-400">Nothing has been moved or deleted. Use the shortcuts below to access your current work.</p>
        <button disabled className="mt-4 cursor-not-allowed rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-500">New Project — Coming Soon</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {destinations.map(({to,title,detail,Icon}) => (
          <Link key={to} to={to} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/40 hover:bg-white/10">
            <div className="flex items-center justify-between"><Icon size={24} /><ArrowUpRight size={18} className="text-zinc-400" /></div>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
