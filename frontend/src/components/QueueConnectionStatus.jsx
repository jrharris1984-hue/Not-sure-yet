export default function QueueConnectionStatus({ health, checking, backendError, onReconnect }) {
  const online = health?.online === true;
  const message = backendError ? "Ultra Studio backend is unreachable. Saved jobs will load when it reconnects."
    : !health ? "Checking ComfyUI connection…"
    : online ? "ComfyUI connected · saved jobs resume automatically."
    : "ComfyUI offline · waiting jobs and seeds are saved. Start ComfyUI or check its address in Settings.";
  return <div role="status" className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${online && !backendError ? "border-emerald-500/30 text-emerald-200" : "border-amber-500/30 text-amber-200"}`}>
    <div>{message}{health?.url && <div className="mt-1 text-xs text-zinc-400">{health.url}</div>}</div>
    <button type="button" disabled={checking} onClick={onReconnect}
      className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-200 disabled:opacity-40">
      {checking ? "Checking…" : "Check connection"}
    </button>
  </div>;
}
