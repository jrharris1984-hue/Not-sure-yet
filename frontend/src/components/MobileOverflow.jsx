import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

/**
 * Simple dropdown that hides its children behind a "•••" button on mobile.
 * On sm+ viewports it renders its children inline unchanged.
 * Use to declutter action-button rows on small screens.
 */
export default function MobileOverflow({ children, testId = "mobile-overflow" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <>
      {/* Inline on sm+ — no wrapper at all */}
      <div className="hidden sm:contents">{children}</div>

      {/* Kebab menu on <sm */}
      <div ref={ref} className="sm:hidden relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid={`btn-${testId}`}
          className="h-9 w-9 grid place-items-center rounded-lg border hairline text-zinc-200 hover:bg-white/5"
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
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
            className="absolute right-0 top-full mt-1 z-50 pane glass p-2 min-w-[220px] flex flex-col gap-1 shadow-2xl"
          >
            {children}
          </div>
        )}
      </div>
    </>
  );
}
