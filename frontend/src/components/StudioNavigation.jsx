import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Library, Image as ImageIcon, Settings2, Plus, Camera, ListOrdered, Database, MoreHorizontal, Wrench } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

export const STUDIO_NAV = [
  { to: "/", label: "Characters", icon: Library, testId: "nav-library" },
  { to: "/media", label: "Media", icon: Database, testId: "nav-media" },
  { to: "/shoots", label: "Shoots", icon: Camera, testId: "nav-shoots" },
  { to: "/gallery", label: "Gallery", icon: ImageIcon, testId: "nav-gallery" },
  { to: "/tools", label: "Tools", icon: Wrench, testId: "nav-tools" },
  { to: "/queue", label: "Queue", icon: ListOrdered, testId: "nav-queue" },
  { to: "/settings", label: "Settings", icon: Settings2, testId: "nav-settings" },
];

export function StudioNavLinks({ compact = false, returnTo }) {
  const location = useLocation();
  const aliasActive = (item) => item.to === "/tools" && location.pathname.startsWith("/image-tools/");
  return STUDIO_NAV.map((item) => <NavLink key={item.to} to={item.to} end={item.to === "/"}
    state={item.to === "/gallery" && returnTo ? { returnTo } : undefined}
    data-testid={compact ? `${item.testId}-tablet` : item.testId}
    className={({ isActive }) => `studio-nav-link flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${isActive || aliasActive(item) ? "studio-nav-link-active" : "text-zinc-400"}`}>
    <item.icon className="h-4 w-4" />{item.label}
  </NavLink>);
}

export default function MobileStudioNavigation({ returnTo }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  const secondary = STUDIO_NAV.filter((item) => ["/media", "/shoots", "/queue", "/settings"].includes(item.to));
  const secondaryActive = secondary.some((item) => location.pathname.startsWith(item.to)) || location.pathname.startsWith("/shoot/");
  const primary = STUDIO_NAV.filter((item) => ["/", "/gallery", "/tools"].includes(item.to));
  const itemClass = (active) => `studio-mobile-link flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] ${active ? "text-cyan-200 studio-mobile-link-active" : "text-zinc-400"}`;
  const navItem = (item) => <NavLink key={item.to} to={item.to} end={item.to === "/"}
    state={item.to === "/gallery" && returnTo ? { returnTo } : undefined}
    data-testid={`${item.testId}-mobile`} className={({ isActive }) => itemClass(isActive || (item.to === "/tools" && location.pathname.startsWith("/image-tools/")))}>
    <item.icon className="h-5 w-5" />{item.label}
  </NavLink>;
  return <nav aria-label="Mobile studio navigation" className="mobile-bottom-nav glass md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10">
    <div className="grid grid-cols-5">
      {navItem(primary[0])}
      <Link to="/create" data-testid="btn-new-character-mobile" className={`${itemClass(location.pathname === "/create" || location.pathname.startsWith("/create/") || location.pathname.startsWith("/character"))} text-lime-300`}>
        <Plus className="h-5 w-5" />Create
      </Link>
      {primary.slice(1).map(navItem)}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><button type="button" className={itemClass(secondaryActive)} data-testid="nav-more-mobile">
          <MoreHorizontal className="h-5 w-5" />More
        </button></SheetTrigger>
        <SheetContent side="bottom" className="studio-more-sheet rounded-t-3xl px-5 pt-6 pb-8">
          <SheetTitle>Studio pages</SheetTitle>
          <SheetDescription className="mt-1">Your media, photo shoots, render queue, and studio settings.</SheetDescription>
          <div className="mt-5 grid gap-2">
            {secondary.map((item) => <SheetClose key={item.to} asChild><Link to={item.to} data-testid={`${item.testId}-mobile`}
              className="flex min-h-14 items-center gap-3 rounded-xl border hairline bg-elevated px-4 py-3 text-sm text-zinc-200">
              <item.icon className="h-5 w-5 text-cyan-300" />{item.label}
            </Link></SheetClose>)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </nav>;
}
