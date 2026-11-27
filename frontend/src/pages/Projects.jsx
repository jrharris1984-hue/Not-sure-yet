import { Link } from "react-router-dom";
import { ArrowRight, Camera, FileText, Images, Layers3, Plus, Search, Sparkles, UserRound, WandSparkles } from "lucide-react";
import "./Projects.css";

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
    <main className="projects-dashboard studio-page" data-testid="projects-workspace">
      <header className="projects-hero">
        <div>
          <p className="projects-eyebrow">ULTRA STUDIO · PROJECT DASHBOARD</p>
          <h1>Your creative workspace</h1>
          <p>Start with a character, an image, or a shoot. Your detailed controls are available when you need them.</p>
        </div>
        <Link to="/create" className="projects-primary-action">
          <Plus size={18} /> Open Studio
        </Link>
      </header>

      <section aria-labelledby="start-project-heading" className="projects-section">
        <div className="projects-section-title"><Sparkles size={17}/><h2 id="start-project-heading">Start something new</h2></div>
        <div className="projects-start-grid">
          {startActions.map(({to,title,detail,Icon,primary}) => (
            <Link key={title} to={to} className={`projects-action${primary ? " projects-action-primary" : ""}`}>
              <span className="projects-action-icon"><Icon size={21}/></span>
              <span className="projects-action-copy"><strong>{title}</strong><small>{detail}</small></span>
              <ArrowRight size={17} className="projects-arrow"/>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="continue-heading" className="projects-section projects-continue-section">
        <div className="projects-section-title projects-section-secondary"><Layers3 size={17}/><h2 id="continue-heading">Your libraries</h2></div>
        <div className="projects-library-grid">
          {workspaces.map(({to,title,detail,Icon}) => (
            <Link key={title} to={to} className="projects-library-link">
              <span className="projects-library-icon"><Icon size={18}/></span>
              <span><strong>{title}</strong><small>{detail}</small></span>
              <ArrowRight size={15} className="projects-arrow"/>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">Project collections and saved project timelines are not yet available; these shortcuts open your existing Studio libraries.</p>
      </section>
    </main>
  );
}
