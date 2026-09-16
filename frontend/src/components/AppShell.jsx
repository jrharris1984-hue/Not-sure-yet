import { Link, NavLink, useLocation } from "react-router-dom";
import { Library, Sparkles, Image as ImageIcon, Settings2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";

const nav = [
  { to: "/", label: "Library", icon: Library, testId: "nav-library" },
  { to: "/gallery", label: "Gallery", icon: ImageIcon, testId: "nav-gallery" },
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
      className="flex items-center gap-2 rounded-full border hairline px-3 py-1.5 text-xs font-mono"
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
      <header className="glass sticky top-0 z-40 border-b hairline">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-home">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/40 grid place-items-center">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-sm sm:text-base tracking-tight">Ultra Studio</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Character DNA</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testId}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-amber-500/10 text-amber-300" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
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

      {/* Mobile bottom nav */}
      <nav className="glass md:hidden fixed bottom-0 inset-x-0 z-40 border-t hairline">
        <div className="grid grid-cols-4 gap-0">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`${n.testId}-mobile`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-widest ${
                  isActive ? "text-amber-300" : "text-zinc-500"
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
      <div className="h-16 md:h-0" />
    </div>
  );
}
