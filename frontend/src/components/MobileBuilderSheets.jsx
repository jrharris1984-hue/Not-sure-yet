import { useEffect, useRef, useState } from "react";
import { clamp, sheetSnap, motionDuration } from "@/lib/dragMotion";
import { UserRound, ScanFace, Scissors, Shirt, PersonStanding, Users, Palette, Sun, Camera, MapPin, Sparkles, Layers, Footprints, Droplets } from "lucide-react";
import { mediaUrl } from "@/lib/media";

const CATEGORY_ICONS = { identity: UserRound, physique: PersonStanding, face: ScanFace, hair: Scissors,
  wardrobe: Shirt, scenario: Users, skin: Palette, lighting: Sun, camera: Camera, scene: MapPin,
  style: Sparkles, pose: PersonStanding, feet: Footprints, watersports: Droplets };

const PERSON_TONES = [
  { accent: "#86efac", wash: "rgba(74, 222, 128, .13)", edge: "rgba(74, 222, 128, .48)" },
  { accent: "#93c5fd", wash: "rgba(96, 165, 250, .13)", edge: "rgba(96, 165, 250, .48)" },
  { accent: "#c4b5fd", wash: "rgba(167, 139, 250, .13)", edge: "rgba(167, 139, 250, .48)" },
  { accent: "#fdba74", wash: "rgba(251, 146, 60, .13)", edge: "rgba(251, 146, 60, .48)" },
];
const personStyle = index => {
  const tone = PERSON_TONES[Math.max(0, index) % PERSON_TONES.length];
  return { "--person-accent": tone.accent, "--person-wash": tone.wash, "--person-edge": tone.edge };
};

// Only handles capture vertical gestures, leaving option lists free to scroll.
function Handle({ label, onStart, onDrag, onEnd, onClick }) {
  const gesture = useRef(null);
  const dragged = useRef(false);
  const finish = (event, cancelled = false) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.id) return;
    gesture.current = null;
    const delta = event.clientY - current.start;
    dragged.current = current.moved || Math.abs(delta) > 5;
    onEnd?.(delta, event.timeStamp - current.time > 80 ? 0 : current.velocity, cancelled);
  };
  return <button type="button" className="sheet-handle" aria-label={label}
    onClick={() => { if (!dragged.current) onClick(); dragged.current = false; }}
    onPointerDown={event => {
      if (event.isPrimary === false || event.button > 0) return;
      dragged.current = false;
      gesture.current = { id: event.pointerId, start: event.clientY, last: event.clientY, time: event.timeStamp, velocity: 0, moved: false };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      onStart?.();
    }}
    onPointerMove={event => {
      const current = gesture.current;
      if (!current || event.pointerId !== current.id) return;
      const elapsed = event.timeStamp - current.time;
      if (elapsed > 0) current.velocity = (event.clientY - current.last) / elapsed;
      current.last = event.clientY; current.time = event.timeStamp;
      const delta = event.clientY - current.start;
      current.moved ||= Math.abs(delta) > 5;
      onDrag?.(delta);
    }}
    onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
    onLostPointerCapture={event => { if (gesture.current) finish(event, true); }}><span /></button>;
}

export default function MobileBuilderSheets({ sections, section, onSection, subjects, activeId, onSubject,
  onPeople, values, renderControls, preview, livePreview, renderStatus, renderError, outputControls,
  onSave, onReset, saving, onGenerate, generating, canGenerate, issues = [], imageCount, onTools, selectedItems = [] }) {
  const [height, setHeight] = useState("half");
  const [detail, setDetail] = useState(null);
  const closeButton = useRef(null);
  const primary = useRef(null);
  const dragBase = useRef(0);
  const [dragHeight, setDragHeight] = useState(null);
  const [detailOffset, setDetailOffset] = useState(0);
  const [detailDragging, setDetailDragging] = useState(false);
  const [detailInteracted, setDetailInteracted] = useState(false);
  const [closing, setClosing] = useState(false);
  const stops = () => {
    const available = primary.current?.parentElement?.getBoundingClientRect().height || window.innerHeight;
    return [{ name: "peek", pixels: 115 }, { name: "half", pixels: available * .52 }, { name: "expanded", pixels: available * .72 }];
  };
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => { setDetail(null); setClosing(false); setDetailOffset(0); }, motionDuration());
    return () => clearTimeout(timer);
  }, [closing]);
  useEffect(() => { setDetail(null); setClosing(false); setDetailOffset(0); }, [section.key]);
  useEffect(() => {
    if (!detail) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    return () => { previous?.isConnected && previous.focus(); };
  }, [detail]);
  const close = () => { setDetailDragging(false); setClosing(true); };
  const open = key => { setDetailInteracted(false); setClosing(false); setDetailOffset(0); setDetail(key); };
  const label = detail === "selected" ? "Selected options" : detail === "output" ? "Generation settings" : section.fields.find(field => field.key === detail)?.label || section.title;
  return <section className="mobile-sheet-builder md:hidden" data-testid="mobile-sheet-builder" style={personStyle(subjects.findIndex(person => person.id === activeId))}>
    <div className="sheet-workspace">
      <header className="flex items-center justify-between gap-2">
        <div><div className="section-label">Character workspace</div><div className="text-sm font-semibold">{subjects.length} {subjects.length === 1 ? "person" : "people"} · editing {subjects.find(person => person.id === activeId)?.label || "A"}</div></div>
        <div className="flex gap-2"><button type="button" className="chip" onClick={onReset} title="Reset the current person’s character options" aria-label="Reset current person">Reset</button><button type="button" className="chip" disabled={saving} onClick={onSave}>{saving ? "Saving…" : "Save"}</button></div>
      </header>
      <div className="sheet-preview">
        {livePreview || (preview ? <img src={mediaUrl(preview)} alt="Latest character result" /> : <div className="text-center text-zinc-500 text-sm p-6">Your generated character will appear here.<br /><span className="text-xs">Open a category below to start.</span></div>)}
      </div>
      <div className={`studio-generation-status status-${renderStatus || "ready"}`} role="status"><span className="studio-status-dot" aria-hidden="true" />{renderStatus ? `Generation: ${renderStatus}` : "Ready to create"}</div>
      {renderError && <p className="text-xs text-rose-300">{renderError}</p>}
    </div>
    <div ref={primary} className={`primary-creation-sheet sheet-${height}`} data-testid="primary-creation-sheet"
      style={dragHeight === null ? undefined : { height: dragHeight, transition: "none" }}>
      <Handle label="Expand or collapse creation tools" onClick={() => setHeight(height === "half" ? "expanded" : "half")}
        onStart={() => { dragBase.current = primary.current.getBoundingClientRect().height; setDragHeight(dragBase.current); }}
        onDrag={delta => { const points = stops(); setDragHeight(clamp(dragBase.current - delta, points[0].pixels, points[2].pixels)); }}
        onEnd={(delta, velocity, cancelled) => {
          if (!cancelled) setHeight(sheetSnap(dragBase.current - delta, velocity, stops()).name);
          setDragHeight(null);
        }} />
      <div className="sheet-primary-content" inert={!!detail} aria-hidden={detail ? true : undefined}>
        <div className="flex gap-2 items-center px-3 pb-2 overflow-x-auto">
          <button type="button" className="chip shrink-0" onClick={onPeople}>People · {subjects.length}</button>
          {subjects.map((person, index) => <button type="button" key={person.id} style={personStyle(index)} aria-pressed={person.id === activeId}
            className={`chip sheet-person-button shrink-0 ${person.id === activeId ? "active" : ""}`} onClick={() => onSubject(person.id)}><span className="studio-person-badge" aria-hidden="true" data-label={person.label} />Edit {person.label}</button>)}
        </div>
        <nav className="sheet-category-tabs" aria-label="Character categories">
          {sections.map(item => {
            const Icon = CATEGORY_ICONS[item.key] || Layers;
            return <button type="button" key={item.key} aria-pressed={item.key === section.key}
              className={`chip shrink-0 ${item.key === section.key ? "active" : ""}`} onClick={() => onSection(item.key)}><Icon className="h-4 w-4" aria-hidden="true" />{item.title}</button>;
          })}
        </nav>
        <div className="sheet-field-scroll">
          <div className="flex justify-between items-center mb-3"><h2 className="font-semibold">{section.title}</h2><div className="flex gap-2"><button type="button" className="text-xs text-cyan-200" onClick={() => open("selected")}>Selected · {selectedItems.length}</button><button type="button" className="text-xs text-cyan-200" onClick={() => open("all")}>All controls</button></div></div>
          <div className="grid grid-cols-2 gap-2">
            {section.fields.map(field => <button key={field.key} type="button" className={`sheet-field-card ${Array.isArray(values[field.key]) ? values[field.key].length ? "has-selection" : "" : values[field.key] ? "has-selection" : ""}`} onClick={() => open(field.key)}>
              <span className="block text-sm font-semibold">{field.label}</span>
              <span className="block text-xs text-zinc-400 mt-1 truncate">{Array.isArray(values[field.key]) ? values[field.key].join(", ") || "Choose" : String(values[field.key] ?? "Choose") || "Choose"}</span>
            </button>)}
          </div>
        </div>
      </div>
      {detail && <>
        <button type="button" className="sheet-scoped-scrim" style={{ opacity: closing ? 0 : Math.max(.15, 1 - detailOffset / 250), transition: detailDragging ? "none" : undefined }} aria-label="Close detail panel" onClick={close} />
        <section className={`nested-creation-sheet ${closing ? "sheet-closing" : ""}`} style={{
          transform: closing ? "translate3d(0, 105%, 0)" : `translate3d(0, ${detailOffset}px, 0)`,
          ...(detailDragging ? { transition: "none" } : {}),
          ...(detailInteracted || closing ? { animation: "none" } : {}),
        }} role="dialog" aria-modal="false" aria-labelledby="sheet-detail-title"
          onKeyDown={event => {
            if (event.key === "Escape") { event.stopPropagation(); close(); }
            if (event.key === "Tab") {
              const nodes = Array.from(event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(node => !node.closest('[hidden]'));
              const first = nodes[0], last = nodes[nodes.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
          }}>
          <Handle label="Dismiss detail panel" onClick={close}
            onStart={() => { setDetailInteracted(true); setDetailDragging(true); }} onDrag={delta => setDetailOffset(Math.max(0, delta))}
            onEnd={(delta, velocity, cancelled) => {
              setDetailDragging(false);
              if (!cancelled && (delta > 80 || (delta > 12 && velocity > .5))) close();
              else setDetailOffset(0);
            }} />
          <header className="flex items-center justify-between px-3 pb-3"><h2 id="sheet-detail-title" className="font-semibold">{label}</h2><button ref={closeButton} type="button" className="chip" onClick={close}>Done</button></header>
          <div className="sheet-detail-scroll">{detail === "selected" ? <div className="space-y-2">
            {selectedItems.length ? selectedItems.map(item => <button type="button" key={`${item.section}-${item.field}`} className="studio-selected-option w-full rounded-xl border p-3 text-left"
              onClick={() => { onSection(item.section); close(); }}><span className="block text-xs text-zinc-400">{item.category} · {item.label}</span><span className="block text-sm mt-1">{item.value}</span></button>) : <p className="text-sm text-zinc-400">Choose a few options to review them here.</p>}
          </div> : detail === "output" ? outputControls : renderControls(detail)}</div>
        </section>
      </>}
    </div>
    <footer className="sheet-generation-dock">
      <div className="flex gap-2"><button type="button" className="chip" onClick={() => { setHeight("half"); open("output"); }}>Settings</button>
        <button type="button" className="chip" onClick={onTools}>More tools</button>
        <button type="button" className="sheet-generate-button flex-1 rounded-xl bg-emerald-400 text-black py-3 text-sm font-bold disabled:opacity-40" disabled={!canGenerate || generating} onClick={onGenerate}>{generating ? "Queuing…" : `Generate (${imageCount})`}</button></div>
      {issues.length > 0 && <p className="text-xs text-amber-200 mt-1">{issues.join(" ")}</p>}
    </footer>
  </section>;
}
