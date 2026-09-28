import { Link, NavLink, useLocation } from "react-router-dom";
import { Library, Sparkles, Image as ImageIcon, Settings2, Plus, Camera, ListOrdered } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import NowRenderingStrip from "@/components/NowRenderingStrip";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const nav = [
  { to: "/", label: "Library", icon: Library, testId: "nav-library" },
  { to: "/shoots", label: "Shoots", icon: Camera, testId: "nav-shoots" },
  { to: "/gallery", label: "Gallery", icon: ImageIcon, testId: "nav-gallery" },
  { to: "/queue", label: "Queue", icon: ListOrdered, testId: "nav-queue" },
  { to: "/settings", label: "Settings", icon: Settings2, testId: "nav-settings" },
];

function ComfyStatus() {
  const { data } = useQuery({
    queryKey: ["comfy-health"],
    queryFn: endpoints.comfyHealth,
    refetchInterval: 15000,
  });
  const online = !!data?.online;
  return (
    <div
      data-testid="comfyui-ws-status-badge"
      className="flex items-center gap-1.5 sm:gap-2 rounded-full border hairline px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono"
    >
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "bg-zinc-600"}`}
      />
      <span className="text-zinc-400">COMFY</span>
      <span className={online ? "text-emerald-300" : "text-zinc-500"}>{online ? "online" : "offline"}</span>
    </div>
  );
}

export default function AppShell({ children }) {
  const loc = useLocation();
  const isBuilder = loc.pathname.startsWith("/character");
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass sticky top-0 z-40 border-b border-cyan-400/20 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
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
          <div className="hidden md:flex items-center gap-1 rounded-xl border hairline bg-black/40 p-1" aria-label="Studio navigation">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                state={n.to === "/gallery" && isBuilder ? { returnTo: loc.pathname } : undefined}
                data-testid={n.testId}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "border border-amber-400/40 bg-amber-500/10 text-amber-200 shadow-[0_0_16px_rgba(166,255,38,0.08)]" : "border border-transparent text-zinc-400 hover:text-cyan-200 hover:bg-white/5"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ComfyStatus />
            {!isBuilder && (
              <Link
                to="/character/new"
                data-testid="btn-new-character"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> New
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <NowRenderingStrip />
      <PwaInstallPrompt />

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav glass md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-cyan-400/25 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-6 gap-0">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              state={n.to === "/gallery" && isBuilder ? { returnTo: loc.pathname } : undefined}
              data-testid={`${n.testId}-mobile`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-widest ${
                  isActive ? "bg-amber-500/10 text-amber-200" : "text-zinc-400"
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
          <Link
            to="/character/new"
            data-testid="btn-new-character-mobile"
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-widest text-amber-300"
          >
            <Plus className="h-5 w-5" />
            New
          </Link>
        </div>
      </nav>
      <div className="mobile-bottom-spacer h-16 md:h-0" />
    </div>
  );
}
