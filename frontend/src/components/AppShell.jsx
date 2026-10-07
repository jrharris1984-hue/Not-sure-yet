import { initializeStudioTheme } from "@/lib/studioThemes";
import { WebPromptResearchOptions, PromptResearchNotes } from '@/components/WebPromptResearch';
import { useAssistantResearch } from '@/lib/assistantResearch';
import { useEffect, useRef } from "react";
import MobileStudioNavigation, { StudioNavLinks } from "@/components/StudioNavigation";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import NowRenderingStrip from "@/components/NowRenderingStrip";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

function ComfyStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["comfy-health"],
    queryFn: endpoints.comfyHealth,
    refetchInterval: 15000,
  });
  const online = !isError && data?.online === true;
  const label = isLoading ? "checking" : isError ? "unavailable" : online ? "online" : "offline";
  return (
    <div
      data-testid="comfyui-ws-status-badge"
      className="flex items-center gap-1.5 sm:gap-2 rounded-full border hairline px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono"
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-zinc-600"}`}
      />
      <span className="text-zinc-400">COMFY</span>
      <span className={online ? "text-emerald-300" : "text-zinc-500"}>{label}</span>
    </div>
  );
}

export default function AppShell({ children }) {
  const loc = useLocation();
  useEffect(() => initializeStudioTheme(), []);
  const research = useAssistantResearch();
  const isBuilder = loc.pathname.startsWith("/character");
  const showResearchWorkspace = loc.pathname === "/research" || loc.pathname.startsWith("/create/");
  const mainRef = useRef(null);
  const pageGroup = loc.pathname.split("/")[1] || "library";
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const animation = mainRef.current?.animate?.([{ opacity: .75, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 180, easing: "ease-out" });
    return () => animation?.cancel();
  }, [pageGroup]);
  return (
    <div className="studio-shell min-h-screen flex flex-col">
      <a className="studio-skip-link" href="#studio-main">Skip to content</a>
      <header className="glass studio-app-header sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-home">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/10 border border-amber-400/50 grid place-items-center shadow-[0_0_18px_rgba(166,255,38,0.16)]">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-sm sm:text-base tracking-tight">Ultra Studio</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80">Create · Refine · Render</div>
            </div>
            <span className="hidden sm:inline-flex items-center rounded-md border border-rose-500/50 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-rose-300 ml-1">
              18+
            </span>
          </Link>
          <nav className="hidden xl:flex items-center gap-1 rounded-2xl border hairline bg-black/25 p-1" aria-label="Studio navigation">
            <StudioNavLinks returnTo={isBuilder ? loc.pathname : undefined} />
          </nav>
          <div className="flex items-center gap-2">
            <ComfyStatus />
            {!isBuilder && (
              <Link
                to="/character/new"
                data-testid="btn-new-character"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create
              </Link>
            )}
          </div>
        </div>
        <nav className="hidden md:flex xl:hidden gap-1 overflow-x-auto scroll-fade border-t border-white/5 px-6 py-1.5" aria-label="Tablet studio navigation">
          <StudioNavLinks compact returnTo={isBuilder ? loc.pathname : undefined} />
        </nav>
      </header>

      <NowRenderingStrip />
      <main id="studio-main" ref={mainRef} tabIndex={-1} className="studio-main flex-1 min-w-0">
        {showResearchWorkspace && <div className="mx-auto max-w-4xl px-4 pt-3">
          <WebPromptResearchOptions/>
          {research.result && <details className="mt-2 text-xs"><summary className="cursor-pointer text-cyan-300">Latest AI research sources</summary><PromptResearchNotes result={research.result}/></details>}
        </div>}
        {children}
      </main>
      <PwaInstallPrompt />

      <MobileStudioNavigation returnTo={isBuilder ? loc.pathname : undefined} />
      <div className="mobile-bottom-spacer h-16 md:h-0" />
    </div>
  );
}
