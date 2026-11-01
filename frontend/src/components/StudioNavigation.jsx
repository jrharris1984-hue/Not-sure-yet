import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Home, Plus, Users, Camera, Images, FolderKanban, Database, Wrench, ListOrdered, Settings2, MoreHorizontal } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { DESKTOP_WORKSPACES, getMobileWorkspaces, SECONDARY_DESTINATIONS } from "@/lib/studioNavigationV2";

const ICONS = { home: Home, create: Plus, characters: Users, shoots: Camera, projects: FolderKanban, library: Images, media: Database, tools: Wrench, queue: ListOrdered, settings: Settings2 };

function isDestinationActive(item, pathname) {
  if (item.id === "home") return pathname === "/";
  if (item.id === "create") return pathname.startsWith("/create");
  if (item.id === "characters") return pathname.startsWith("/library") || pathname.startsWith("/character");
  if (item.id === "shoots") return pathname.startsWith("/shoot");
  if (item.id === "tools") return pathname.startsWith("/tools") || pathname.startsWith("/image-tools");
  return pathname === item.path || pathname.startsWith(item.path + "/");
}

function DestinationLink({ item, returnTo, mobile = false, onClick }) {
  const location = useLocation();
  const Icon = ICONS[item.id] || Home;
  const active = isDestinationActive(item, location.pathname);
  const state = item.id === "library" && returnTo ? { returnTo } : undefined;
  return (
    <NavLink to={item.path} state={state} onClick={onClick}
      data-testid={`nav-${item.id}${mobile ? "-mobile" : ""}`}
      aria-current={active ? "page" : undefined}
      className={mobile ? `studio-mobile-link flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] ${active ? "studio-mobile-link-active text-cyan-200" : "text-zinc-400"}` : `studio-nav-link flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${active ? "studio-nav-link-active" : "text-zinc-400"}`}>
      <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
    </NavLink>
  );
}

export const STUDIO_NAV = [...DESKTOP_WORKSPACES, ...SECONDARY_DESTINATIONS];

export function StudioNavLinks({ compact = false, returnTo }) {
  return (
    <>
      {DESKTOP_WORKSPACES.map(item => <DestinationLink key={item.id} item={item} returnTo={returnTo} />)}
      <details className="mt-4 border-t border-white/10 pt-3">
        <summary className="studio-nav-link flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-400" data-testid="nav-more-desktop">
          <MoreHorizontal size={18} aria-hidden="true" /><span>More</span>
        </summary>
        <div className="mt-2 flex flex-col gap-1 pl-2">
          {SECONDARY_DESTINATIONS.map(item => <DestinationLink key={item.id} item={item} />)}
        </div>
      </details>
    </>
  );
}

export default function MobileStudioNavigation({ returnTo, compactHeader = false }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  const primary = getMobileWorkspaces();
  const secondary = [
    ...DESKTOP_WORKSPACES.filter(item => !primary.some(mobile => mobile.id === item.id)),
    ...SECONDARY_DESTINATIONS,
  ];
  const moreActive = secondary.some(item => isDestinationActive(item, location.pathname));
  return (
    <nav aria-label="Mobile studio navigation" className={compactHeader ? "studio-header-navigation md:hidden" : "mobile-bottom-nav glass md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10"}>
      <div className={compactHeader ? "flex items-center" : "grid grid-cols-5"}>
        {!compactHeader && primary.map(item => (
          <DestinationLink key={item.id} item={item} returnTo={returnTo} mobile />
        ))}
        {compactHeader && (
          <Link to="/gallery" state={returnTo ? { returnTo } : undefined}
            data-testid="nav-gallery-mobile" className="studio-nav-link flex min-h-11 items-center gap-1 px-2 text-xs">
            <Images size={18} /><span>Gallery</span>
          </Link>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" data-testid="nav-more-mobile"
              className={`studio-mobile-link flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] ${moreActive ? "studio-mobile-link-active text-cyan-200" : "text-zinc-400"}`}
              aria-label="More studio pages">
              <MoreHorizontal size={20} /><span>{compactHeader ? "Pages" : "More"}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="studio-more-sheet max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-zinc-950 px-5 pb-8 pt-6 text-white">
            <SheetTitle>More Studio Pages</SheetTitle>
            <SheetDescription>Additional workspaces and settings.</SheetDescription>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {secondary.map(item => (
                <SheetClose asChild key={item.id}>
                  <DestinationLink item={item} returnTo={returnTo} mobile />
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
