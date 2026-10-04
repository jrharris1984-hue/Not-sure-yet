import { useEffect, useState } from "react";

export default function CreateJourney({ stages, index, activeSection, sections, onStage, onSection, modelName }) {
  const stage = stages[index] || stages[0];
  const categories = stage.categories || (stage.sections.length ? [stage] : []);
  const [expanded, setExpanded] = useState("");
  useEffect(() => {
    setExpanded(categories.find((category) => category.sections.includes(activeSection))?.key || categories[0]?.key || "");
    // Stages and categories come from a stable shared configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.key, activeSection]);
  return (
    <section className="create-journey rounded-2xl p-4 sm:p-5" data-testid="desktop-quick-create">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[.2em] text-cyan-300">Ultra Studio · Create</div>
          <h2 className="mt-1 font-display text-xl font-bold text-white">Your next image</h2>
          <p className="mt-1 text-xs text-zinc-400">Choose a category to open its controls. Your selections stay with you.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">{modelName || "Choose a model"}</span>
      </div>
      <nav className="mt-5 grid grid-cols-3 gap-2" aria-label="Creation stages">
        {stages.map((item, position) => <button key={item.key} type="button" onClick={() => onStage(position)}
          aria-current={position === index ? "step" : undefined}
          className={`create-stage rounded-xl border p-3 text-left ${position === index ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-black/15 hover:border-white/30"}`}>
          <span className="block text-[10px] font-mono text-cyan-300">{String(position + 1).padStart(2, "0")}</span>
          <span className="mt-1 block text-sm font-bold text-white">{item.title}</span>
          <span className="mt-1 hidden text-[11px] text-zinc-400 sm:block">{item.detail}</span>
        </button>)}
      </nav>
      {!!categories.length && <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2" aria-label={`${stage.title} categories`}>
          {categories.map((category) => <button key={category.key} type="button"
            aria-expanded={expanded === category.key} onClick={() => { setExpanded(category.key); onSection(category.sections[0]); }}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${expanded === category.key ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 text-zinc-400 hover:text-white"}`}>
            {category.title}
          </button>)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3" aria-label="Category controls">
          {categories.find((category) => category.key === expanded)?.sections.map((key) => <button key={key} type="button"
            aria-pressed={activeSection === key} onClick={() => onSection(key)}
            className={`rounded-lg px-3 py-2 text-xs ${activeSection === key ? "bg-white/10 font-semibold text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
            {sections.find((section) => section.key === key)?.title || key}
          </button>)}
        </div>
      </div>}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <button type="button" disabled={!index} onClick={() => onStage(index - 1)}
          className="rounded-lg px-3 py-2 text-xs text-zinc-300 disabled:opacity-30">Back</button>
        <span className="text-[10px] text-zinc-500">{index + 1} of {stages.length}</span>
        <button type="button" disabled={index === stages.length - 1} onClick={() => onStage(index + 1)}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-black disabled:invisible">
          {stages[index + 1]?.title || "Continue"}
        </button>
      </div>
    </section>
  );
}
