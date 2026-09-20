import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

const DISMISS_KEY = "ultra-studio-install-dismissed";
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (standalone || Date.now() - dismissedAt < ONE_WEEK) return undefined;

    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setVisible(false);
    setInstallEvent(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <aside className="pwa-install-banner fixed inset-x-3 z-50 mx-auto max-w-md rounded-2xl border border-amber-500/30 bg-[#17141D]/95 p-3 shadow-2xl backdrop-blur-xl md:hidden" role="dialog" aria-label="Install Ultra Studio">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold">Install Ultra Studio</p>
          <p className="text-xs text-zinc-400">Open it from your Android home screen like an app.</p>
        </div>
        <button onClick={install} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black" data-testid="btn-install-app">
          <Download className="h-4 w-4" /> Install
        </button>
        <button onClick={dismiss} className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200" aria-label="Dismiss install prompt">
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
