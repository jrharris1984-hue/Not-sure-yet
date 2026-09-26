import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

/**
 * Simple dropdown that hides its children behind a "•••" button on mobile.
 * On sm+ viewports it renders its children inline unchanged.
 * Use to declutter action-button rows on small screens.
 */
export default function MobileOverflow({ children, testId = "mobile-overflow", always = false, label = "More" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onModalClosed = () => setOpen(false);
    window.addEventListener("ultra-studio:overflow-close", onModalClosed);
    const onDoc = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      // Preset dialogs are rendered through document.body portals. Although
      // they are outside `ref` in the DOM, they still belong to a launcher in
      // this overflow menu and must remain mounted while the dialog is used.
      if (target?.closest("[data-overflow-stay-open]")) return;
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("ultra-studio:overflow-close", onModalClosed);
    };
  }, [open]);

  return (
    <>
      {/* Inline on sm+ — no wrapper at all */}
      {!always && <div className="hidden sm:contents">{children}</div>}

      {/* Kebab menu on <sm */}
      <div ref={ref} className={`${always ? "relative" : "sm:hidden relative"}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid={`btn-${testId}`}
          className={`${always ? "h-10 px-3 inline-flex gap-2" : "h-9 w-9 grid"} items-center justify-center rounded-lg border hairline text-zinc-200 hover:bg-white/5`}
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
          {always && <span className="text-sm">{label}</span>}
        </button>
        {open && (
          <div
            data-testid={`${testId}-panel`}
            onClick={(event) => {
              // Modal launchers must remain mounted after their trigger is tapped.
              // They close this menu naturally when the user later taps outside it.
              if (event.target.closest("[data-overflow-stay-open]")) return;
              setOpen(false);
            }}
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-auto sm:top-full sm:mt-1 z-[70] pane glass p-2 sm:min-w-[220px] max-h-[60vh] overflow-y-auto flex flex-col gap-1 shadow-2xl"
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
}
