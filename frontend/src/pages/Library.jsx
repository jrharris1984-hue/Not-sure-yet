import StudioLoading from "@/components/StudioLoading";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, Star, StarOff, Plus, Search, Camera, Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { API_BASE, endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function characterImageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.endsWith("/view") && parsed.searchParams.has("filename"))
      return `${API_BASE}/comfyui/media?${parsed.searchParams.toString()}`;
  } catch { /* Use the supplied URL. */ }
  return url;
}

export default function Library() {
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [imageCharacter, setImageCharacter] = useState(null);
  const qc = useQueryClient();
  const { data: chars = [], isLoading } = useQuery({
    queryKey: ["characters", q, onlyFav, activeTags],
    queryFn: () => endpoints.listCharacters({
      q: q || undefined,
      favorite: onlyFav || undefined,
      tag: activeTags.length ? activeTags : undefined,
    }),
  });
  const { data: tagCloud = [] } = useQuery({
    queryKey: ["character-tags"],
    queryFn: endpoints.listCharacterTags,
  });
  const toggleTag = (t) =>
    setActiveTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const del = useMutation({
    mutationFn: (id) => endpoints.deleteCharacter(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["character-tags"] });
    },
  });
  const dup = useMutation({
    mutationFn: (id) => endpoints.duplicateCharacter(id),
    onSuccess: () => {
      toast.success("Duplicated");
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["character-tags"] });
    },
  });
  const fav = useMutation({
    mutationFn: ({ id, v }) => endpoints.updateCharacter(id, { favorite: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
  });
  const { data: characterImages = [] } = useQuery({
    queryKey: ["character-renders", imageCharacter?.id],
    queryFn: () => endpoints.characterRenders(imageCharacter.id),
    enabled: !!imageCharacter,
  });
  const chooseImage = useMutation({
    mutationFn: (renderId) => endpoints.updateCharacter(imageCharacter.id, { default_image_render_id: renderId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters"] }); setImageCharacter(null); toast.success("Default image updated"); },
    onError: () => toast.error("Could not set the character image"),
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div>
          <div className="section-label">Library</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Your talent roster</h1>
          <p className="text-sm text-zinc-400 mt-1">Cast your models. Refine their DNA. Render the scene.</p>
        </div>
        <div className="flex-1" />
        <Link
          to="/character/new"
          data-testid="btn-library-new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5"
        >
          <Plus className="h-4 w-4" /> New character
        </Link>
      </div>

      <div className="pane p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            data-testid="input-library-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag, prompt..."
            className="pl-9 bg-elevated border-hairline text-zinc-100"
          />
        </div>
        <button
          data-testid="btn-library-fav-filter"
          onClick={() => setOnlyFav((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm ${
            onlyFav ? "bg-amber-500/10 text-amber-200 border-amber-500/40" : "text-zinc-300"
          }`}
        >
          <Star className="h-4 w-4" /> Favorites
        </button>
      </div>

      {/* Tag filter row */}
      {tagCloud.length > 0 && (() => {
        const collapseLimit = 5;
        const showAll = tagsExpanded || tagCloud.length <= collapseLimit;
        const visible = showAll ? tagCloud : tagCloud.slice(0, collapseLimit);
        const hidden = tagCloud.length - collapseLimit;
        return (
          <div className="pane p-3 flex flex-wrap items-center gap-1.5" data-testid="library-tag-cloud">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mr-1">Tags</span>
            {visible.map((t) => {
              const active = activeTags.includes(t.tag);
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => toggleTag(t.tag)}
                  data-testid={`btn-tag-filter-${t.tag}`}
                  className={`chip !py-1 !min-h-0 ${active ? "active" : ""}`}
                >
                  {t.tag}
                  <span className="ml-1 text-[9px] opacity-60">{t.count}</span>
                </button>
              );
            })}
            {!showAll && hidden > 0 && (
              <button
                type="button"
                onClick={() => setTagsExpanded(true)}
                data-testid="btn-tag-cloud-expand"
                className="chip !py-1 !min-h-0 !text-zinc-400"
              >
                +{hidden} more
              </button>
            )}
            {tagsExpanded && tagCloud.length > collapseLimit && (
              <button
                type="button"
                onClick={() => setTagsExpanded(false)}
                data-testid="btn-tag-cloud-collapse"
                className="chip !py-1 !min-h-0 !text-zinc-500"
              >
                show less
              </button>
            )}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTags([])}
                data-testid="btn-tag-filter-clear"
                className="ml-auto text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-100"
              >
                clear tags
              </button>
            )}
          </div>
        );
      })()}

      {isLoading ? (
        <StudioLoading label="Loading characters…" />
      ) : chars.length === 0 ? (
        <div className="pane p-10 text-center">
          <div className="section-label mb-2">Empty stage</div>
          <h3 className="font-display text-xl">Casting call · no models yet</h3>
          <p className="text-sm text-zinc-400 mt-1">Describe your fantasy in words and let AI fill the DNA, or hand-build every trait — pussy, curves, wardrobe, pose — from scratch.</p>
          <Link
            to="/character/new"
            data-testid="btn-empty-new"
            className="inline-flex mt-4 items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2"
          >
            <Plus className="h-4 w-4" /> Create your first
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chars.map((c, i) => (
            <div
              key={c.id}
              data-testid={`character-library-card-${i}`}
              className="pane relative overflow-hidden flex flex-col hover:border-zinc-600 transition-colors group"
            >
              <Link to={`/character/${c.id}`} className="block aspect-[3/4] bg-elevated" aria-label={`Open ${c.name || "Untitled"}`}>
                {c.thumbnail ? <img src={characterImageUrl(c.thumbnail)} alt={c.name || "Character image"} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-zinc-500"><ImageIcon className="h-10 w-10" /></div>}
              </Link>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/character/${c.id}`} className="min-w-0 flex-1">
                    <div className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
                      {c.dna?.identity?.archetype || "Character"}
                    </div>
                    <div className="font-display font-bold text-base truncate text-zinc-50 drop-shadow-md">{c.name || "Untitled"}</div>
                  </Link>
                  <button
                    data-testid={`btn-fav-${i}`}
                    onClick={() => fav.mutate({ id: c.id, v: !c.favorite })}
                    className={`h-8 w-8 grid place-items-center rounded-md backdrop-blur-sm bg-black/30 ${c.favorite ? "text-amber-300" : "text-zinc-400 hover:text-zinc-100"}`}
                  >
                    {c.favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-auto flex items-center gap-1">
                <button type="button" onClick={() => setImageCharacter(c)} data-testid={`btn-character-image-${i}`}
                  className="h-7 w-7 grid place-items-center rounded-md border hairline text-zinc-300" title="Choose default image" aria-label={`Choose default image for ${c.name || "Untitled"}`}>
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <Link
                  to={`/character/${c.id}`}
                  data-testid={`btn-open-${i}`}
                  className="flex-1 text-center rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-semibold py-1.5 hover:bg-amber-500/20"
                >
                  Open
                </Link>
                <Link
                  to={`/shoot/new/${c.id}`}
                  data-testid={`btn-shoot-${i}`}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-xs font-semibold px-2 py-1.5 hover:bg-emerald-500/20"
                  title="Photo shoot"
                >
                  <Camera className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Shoot</span>
                </Link>
                <button
                  data-testid={`btn-duplicate-${i}`}
                  onClick={() => dup.mutate(c.id)}
                  className="hidden sm:grid h-7 w-7 place-items-center rounded-md border hairline text-zinc-300 hover:bg-white/5"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  data-testid={`btn-delete-${i}`}
                  onClick={() => window.confirm("Delete character?") && del.mutate(c.id)}
                  className="h-7 w-7 grid place-items-center rounded-md border hairline text-zinc-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {imageCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Choose character image" onClick={() => setImageCharacter(null)}>
          <div className="pane max-h-[85vh] w-full max-w-3xl overflow-y-auto p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Choose image for {imageCharacter.name}</h2>
              <button type="button" onClick={() => setImageCharacter(null)} aria-label="Close image chooser"><X className="h-5 w-5" /></button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {characterImages.filter((r) => r.output_files?.[0]).map((r) => (
                <button key={r.id} type="button" disabled={chooseImage.isPending} onClick={() => chooseImage.mutate(r.id)}
                  className={`aspect-square overflow-hidden rounded-lg border ${imageCharacter.default_image_render_id === r.id ? "border-amber-400" : "hairline"}`} aria-label="Use this image as default">
                  <img src={characterImageUrl(r.output_files[0])} alt="Character render" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {!characterImages.some((r) => r.output_files?.[0]) && <p className="text-sm text-zinc-400">Render an image for this character to choose it here.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
