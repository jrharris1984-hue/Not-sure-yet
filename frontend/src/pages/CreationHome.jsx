import { Link } from "react-router-dom";
import { ArrowRight, Image, Pencil, Copy, UserRound, Camera, Video, Clapperboard, Type, SlidersHorizontal, Library as LibraryIcon } from "lucide-react";

const groups = [
  { title: "Image", icon: Image, entries: [
    { label: "Create an image", description: "Start from an idea or build visually", to: "/create/image-start" },
    { label: "Edit an image", description: "Change an existing image", to: "/create/guided?start=image", icon: Pencil },
    { label: "Make variations", description: "Explore new versions of an image", to: "/create/tools", icon: Copy },
  ] },
  { title: "Character & shoots", icon: UserRound, entries: [
    { label: "Create a character", description: "Build and save a character", to: "/character/new" },
    { label: "Start a photoshoot", description: "Plan a shoot with a character", to: "/shoots", icon: Camera },
  ] },
  { title: "Video", icon: Video, entries: [
    { label: "Image to video", description: "Animate an existing image", to: "/create/video" },
    { label: "Text to video", description: "Describe a video to create", to: "/create/text-video", icon: Clapperboard },
  ] },
];

function Choice({ to, icon: Icon, title, description }) {
  return <Link to={to} className="group flex min-h-[88px] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-amber-400/50 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-amber-300"><Icon size={22}/></span>
    <span className="min-w-0 flex-1"><strong className="block text-base text-white">{title}</strong><span className="mt-1 block text-sm text-zinc-400">{description}</span></span>
    <ArrowRight size={18} className="shrink-0 text-zinc-500 group-hover:text-amber-300"/>
  </Link>;
}

export default function CreationHome({ chooseImage = false }) {
  return <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-8 sm:pt-12" data-testid={chooseImage ? "image-start-screen" : "creation-home"}>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Ultra Studio · Create</span>
      <Link className="inline-flex items-center gap-2 text-sm text-zinc-300 underline-offset-4 hover:underline" to="/library"><LibraryIcon size={16}/> Character library</Link>
    </div>
    {chooseImage ? <>
      <Link to="/" className="mb-5 inline-block text-sm text-zinc-400 hover:text-white">← All creation options</Link>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How would you like to start?</h1>
      <p className="mb-8 mt-3 max-w-2xl text-zinc-400">Start with words or choose visual details. You can refine your creation as you go.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice to="/create/guided?start=describe" icon={Type} title="Describe an idea" description="Tell Ultra Studio what you imagine."/>
        <Choice to="/create/guided?start=build" icon={SlidersHorizontal} title="Build with options" description="Choose subjects, appearance, clothing, scene and more."/>
      </div>
    </> : <>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">What would you like to create?</h1>
      <p className="mb-8 mt-3 text-zinc-400">Choose a starting point. The details come later.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map(group => <section key={group.title} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><group.icon size={20} className="text-amber-300"/>{group.title}</h2>
          <div className="space-y-2">{group.entries.map(entry => <Choice key={entry.label} to={entry.to} icon={entry.icon || group.icon} title={entry.label} description={entry.description}/>)}</div>
        </section>)}
      </div>
    </>}
  </div>;
}
