import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, Star, StarOff, Plus, Search, Camera } from "lucide-react";
import { useState } from "react";
import { endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Library() {
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const qc = useQueryClient();
  const { data: chars = [], isLoading } = useQuery({
    queryKey: ["characters", q, onlyFav],
    queryFn: () => endpoints.listCharacters({ q: q || undefined, favorite: onlyFav || undefined }),
  });

  const del = useMutation({
    mutationFn: (id) => endpoints.deleteCharacter(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["characters"] }); },
  });
  const dup = useMutation({
    mutationFn: (id) => endpoints.duplicateCharacter(id),
    onSuccess: () => { toast.success("Duplicated"); qc.invalidateQueries({ queryKey: ["characters"] }); },
  });
  const fav = useMutation({
    mutationFn: ({ id, v }) => endpoints.updateCharacter(id, { favorite: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
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

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pane h-48 animate-pulse" />
          ))}
        </div>
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
              className="pane p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <Link to={`/character/${c.id}`} className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                    {c.dna?.identity?.archetype || "Character"}
                  </div>
                  <div className="font-display font-bold text-base truncate">{c.name || "Untitled"}</div>
                </Link>
                <button
                  data-testid={`btn-fav-${i}`}
                  onClick={() => fav.mutate({ id: c.id, v: !c.favorite })}
                  className={`h-8 w-8 grid place-items-center rounded-md ${c.favorite ? "text-amber-300" : "text-zinc-500 hover:text-zinc-200"}`}
                >
                  {c.favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-xs text-zinc-400 line-clamp-3 font-mono">{c.prompt_positive || "no prompt yet"}</div>
              <div className="mt-auto flex items-center gap-1">
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
                  <Camera className="h-3.5 w-3.5" /> Shoot
                </Link>
                <button
                  data-testid={`btn-duplicate-${i}`}
                  onClick={() => dup.mutate(c.id)}
                  className="h-7 w-7 grid place-items-center rounded-md border hairline text-zinc-300 hover:bg-white/5"
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
          ))}
        </div>
      )}
    </div>
  );
}
