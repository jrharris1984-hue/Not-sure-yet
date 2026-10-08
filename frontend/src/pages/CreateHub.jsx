import CharacterPreviewEntry from "@/components/CharacterPreviewEntry";
import { ArrowRight, Film, Image as ImageIcon, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

const choices = [
  {
    to: "/character/new",
    title: "Character-guided image",
    description: "Build or reuse a character, then move through appearance, wardrobe, pose, scene, and generation.",
    icon: UserRound,
    primary: true,
  },
  {
    to: "/create/image",
    title: "Prompt-only image",
    description: "Start from a free-form prompt without creating a character first.",
    icon: ImageIcon,
  },
  {
    to: "/create/video",
    title: "Image to video",
    description: "Animate a starting image with a video workflow.",
    icon: Film,
  },
  {
    to: "/create/text-video",
    title: "Text to video",
    description: "Create video directly from a text prompt.",
    icon: Film,
  },
];

export default function CreateHub() {
  return <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="create-hub">
    <header>
      <div className="section-label">Create</div>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold">What do you want to make?</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">Start new work here. Use Tools later when you want to edit, vary, enhance, reference, or animate an existing result.</p>
      <Link to="/research" className="mt-3 inline-flex items-center gap-1.5 text-sm text-cyan-300 hover:underline"><Sparkles className="h-4 w-4" /> Research models & prompting with AI</Link>
    </header>
    <div className="grid gap-3 sm:grid-cols-2">
      {choices.map((choice) => <Link key={choice.to} to={choice.to}
        className={`pane group flex min-h-40 flex-col justify-between p-5 transition-colors ${choice.primary ? "border-amber-400/40 bg-amber-500/[0.05]" : "hover:border-cyan-400/40"}`}>
        <div>
          <choice.icon className={`h-6 w-6 ${choice.primary ? "text-amber-300" : "text-cyan-300"}`} />
          <h2 className="mt-4 font-display text-lg font-bold">{choice.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{choice.description}</p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-200">Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </Link>)}
    </div>
    <CharacterPreviewEntry />
  </div>;
}
