import { STUDIO_THEMES, setStudioTheme, useStudioTheme } from '@/lib/studioThemes';
export default function AppearanceSettings() {
  const selected = useStudioTheme();
  return <section className="pane p-5 space-y-4" data-testid="appearance-settings">
    <div><div className="section-label">Appearance</div><h2 className="font-display text-xl font-bold mt-1">Color theme</h2>
      <p className="text-xs text-zinc-400 mt-1">Applies instantly across the app and saves in this browser. Person A/B/C/D colors stay consistent.</p></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Color theme">
      {STUDIO_THEMES.map(theme => <button type="button" key={theme.id} aria-pressed={selected === theme.id}
        onClick={() => setStudioTheme(theme.id)} data-testid={`theme-${theme.id}`}
        className={`studio-theme-tile rounded-xl border p-3 text-left ${selected === theme.id ? 'studio-theme-selected' : 'border-white/15'}`}>
        <span className="flex gap-2 mb-3" aria-hidden="true">{[theme.accent, theme.secondary, theme.surface].map(color => <span key={color} className="h-6 w-6 rounded-full border border-white/20" style={{ background: color }} />)}</span>
        <span className="block text-sm font-semibold">{theme.name}{selected === theme.id && <span className="ml-1" aria-hidden="true">✓</span>}</span>
        <span className="block text-[11px] text-zinc-400 mt-1">{theme.description}</span>
      </button>)}
    </div>
  </section>;
}
