import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/media";

// Gestures belong to the handles; scrolling controls never dismisses a sheet.
function Handle({ label, onUp, onDown, onClick }) {
  const start = useRef(null);
  const dragged = useRef(false);
  return <button type="button" className="sheet-handle" aria-label={label} onClick={() => { if (!dragged.current) onClick(); dragged.current = false; }}
    onPointerDown={event => { dragged.current = false; start.current = event.clientY; event.currentTarget.setPointerCapture?.(event.pointerId); }}
    onPointerUp={event => {
      if (start.current === null) return;
      const delta = event.clientY - start.current;
      dragged.current = Math.abs(delta) > 45;
      start.current = null;
      if (delta > 45) onDown();
      else if (delta < -45) onUp?.();
    }} onPointerCancel={() => { start.current = null; }}><span /></button>;
}

export default function MobileBuilderSheets({ sections, section, onSection, subjects, activeId, onSubject,
  onPeople, values, renderControls, preview, livePreview, renderStatus, renderError, outputControls,
  onSave, saving, onGenerate, generating, canGenerate, issues = [], imageCount, onTools }) {
  const [height, setHeight] = useState("half");
  const [detail, setDetail] = useState(null);
  const closeButton = useRef(null);
  useEffect(() => { setDetail(null); }, [section.key]);
  useEffect(() => {
    if (!detail) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    return () => { previous?.isConnected && previous.focus(); };
  }, [detail]);
  const close = () => setDetail(null);
  const label = detail === "output" ? "Generation settings" : section.fields.find(field => field.key === detail)?.label || section.title;
  return <section className="mobile-sheet-builder md:hidden" data-testid="mobile-sheet-builder">
    <div className="sheet-workspace">
      <header className="flex items-center justify-between gap-2">
        <div><div className="section-label">Character workspace</div><div className="text-sm font-semibold">{subjects.length} {subjects.length === 1 ? "person" : "people"} · editing {subjects.find(person => person.id === activeId)?.label || "A"}</div></div>
        <button type="button" className="chip" disabled={saving} onClick={onSave}>{saving ? "Saving…" : "Save"}</button>
      </header>
      <div className="sheet-preview">
        {livePreview || (preview ? <img src={mediaUrl(preview)} alt="Latest character result" /> : <div className="text-center text-zinc-500 text-sm p-6">Your generated character will appear here.<br /><span className="text-xs">Open a category below to start.</span></div>)}
      </div>
      <div className="text-xs text-zinc-400" role="status">{renderStatus ? `Generation: ${renderStatus}` : "Ready to create"}</div>
      {renderError && <p className="text-xs text-rose-300">{renderError}</p>}
    </div>
    <div className={`primary-creation-sheet sheet-${height}`} data-testid="primary-creation-sheet">
      <Handle label="Expand or collapse creation tools" onClick={() => setHeight(height === "half" ? "expanded" : "half")}
        onUp={() => setHeight("expanded")} onDown={() => setHeight(height === "expanded" ? "half" : "peek")} />
      <div className="sheet-primary-content" inert={!!detail} aria-hidden={detail ? true : undefined}>
        <div className="flex gap-2 items-center px-3 pb-2 overflow-x-auto">
          <button type="button" className="chip shrink-0" onClick={onPeople}>People · {subjects.length}</button>
          {subjects.map(person => <button type="button" key={person.id} aria-pressed={person.id === activeId}
            className={`chip shrink-0 ${person.id === activeId ? "active" : ""}`} onClick={() => onSubject(person.id)}>Edit {person.label}</button>)}
        </div>
        <nav className="sheet-category-tabs" aria-label="Character categories">
          {sections.map(item => <button type="button" key={item.key} aria-pressed={item.key === section.key}
            className={`chip shrink-0 ${item.key === section.key ? "active" : ""}`} onClick={() => { onSection(item.key); setHeight("half"); }}>{item.title}</button>)}
        </nav>
        <div className="sheet-field-scroll">
          <div className="flex justify-between items-center mb-3"><h2 className="font-semibold">{section.title}</h2><button type="button" className="text-xs text-cyan-200" onClick={() => setDetail("all")}>All controls</button></div>
          <div className="grid grid-cols-2 gap-2">
            {section.fields.map(field => <button key={field.key} type="button" className="sheet-field-card" onClick={() => setDetail(field.key)}>
              <span className="block text-sm font-semibold">{field.label}</span>
              <span className="block text-xs text-zinc-400 mt-1 truncate">{Array.isArray(values[field.key]) ? values[field.key].join(", ") || "Choose" : String(values[field.key] ?? "Choose") || "Choose"}</span>
            </button>)}
          </div>
        </div>
      </div>
      {detail && <>
        <button type="button" className="sheet-scoped-scrim" aria-label="Close detail panel" onClick={close} />
        <section className="nested-creation-sheet" role="dialog" aria-modal="false" aria-labelledby="sheet-detail-title"
          onKeyDown={event => {
            if (event.key === "Escape") { event.stopPropagation(); close(); }
            if (event.key === "Tab") {
              const nodes = Array.from(event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(node => !node.closest('[hidden]'));
              const first = nodes[0], last = nodes[nodes.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
          }}>
          <Handle label="Dismiss detail panel" onClick={close} onDown={close} />
          <header className="flex items-center justify-between px-3 pb-3"><h2 id="sheet-detail-title" className="font-semibold">{label}</h2><button ref={closeButton} type="button" className="chip" onClick={close}>Done</button></header>
          <div className="sheet-detail-scroll">{detail === "output" ? outputControls : renderControls(detail)}</div>
        </section>
      </>}
    </div>
    <footer className="sheet-generation-dock">
      <div className="flex gap-2"><button type="button" className="chip" onClick={() => { setHeight("half"); setDetail("output"); }}>Settings</button>
        <button type="button" className="chip" onClick={onTools}>More tools</button>
        <button type="button" className="flex-1 rounded-xl bg-emerald-400 text-black py-3 text-sm font-bold disabled:opacity-40" disabled={!canGenerate || generating} onClick={onGenerate}>{generating ? "Queuing…" : `Generate (${imageCount})`}</button></div>
      {issues.length > 0 && <p className="text-xs text-amber-200 mt-1">{issues.join(" ")}</p>}
    </footer>
  </section>;
}
