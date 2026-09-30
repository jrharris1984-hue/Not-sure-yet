import { Link } from "react-router-dom";
import { STUDIO_PROFILES } from "@/lib/studioProfiles";

const studios = [
  { to: "/character/new", title: "Character Studio", description: "The complete character and scene editor.", accent: "border-amber-400/40" },
  ...Object.entries(STUDIO_PROFILES).map(([key, profile]) => ({
    to: `/studio/${key}`, title: profile.title, description: profile.description, accent: "border-cyan-400/40",
  })),
];

export default function StudioHub() {
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <div className="section-label">Choose your studio</div>
    <h1 className="mt-2 font-display text-3xl font-bold text-white">Start a creation</h1>
    <p className="mt-2 text-sm text-zinc-400">Each studio has its own draft and guided selections. Model and render controls are shared.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {studios.map((entry) => <Link key={entry.to} to={entry.to}
        className={`pane min-h-48 border ${entry.accent} p-5 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-cyan-400`}>
        <h2 className="font-display text-xl font-bold text-zinc-100">{entry.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{entry.description}</p>
        <span className="mt-8 inline-block text-xs font-semibold text-cyan-200">Open studio →</span>
      </Link>)}
    </div>
  </main>;
}
