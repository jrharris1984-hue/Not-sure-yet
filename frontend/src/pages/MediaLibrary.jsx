import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Images, Video, RefreshCw, X, Database, Folder, FolderOpen, LayoutGrid, ChevronRight, Home } from "lucide-react";
import { endpoints } from "@/lib/api";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 48;

function Meta({ label, value }) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return null;
  const shown = Array.isArray(value) ? value.join(", ") : String(value);
  return <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">{label}</div><div className="text-sm text-zinc-200 break-words">{shown}</div></div>;
}

export default function MediaLibrary() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("image");
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("gallery");
  const [folderPath, setFolderPath] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setOffset(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const health = useQuery({ queryKey:["media-library-health"], queryFn:endpoints.mediaLibraryHealth, refetchInterval:15000, retry:1 });
  const stats = useQuery({ queryKey:["media-library-stats"], queryFn:endpoints.mediaLibraryStats, refetchInterval:15000, retry:1 });
  const folders = useQuery({
    queryKey:["media-library-folders", folderPath, type, status],
    queryFn:() => endpoints.mediaLibraryFolders({ path:folderPath, media_type:type, status, analyzed_only:status==="complete", hide_sidecars:true }),
    enabled:view==="folders", retry:1,
  });

  const media = useQuery({
    queryKey:["media-library", search, type, status, offset, view, folderPath],
    queryFn:() => endpoints.mediaLibraryList({ q:search || undefined, media_type:type, status, hide_sidecars:true, folder_path:view==="folders" ? folderPath : undefined, limit:PAGE_SIZE, offset }),
    retry:1,
  });

  const useInStudio = (item) => {
    const reusable = {
      mediaId: item.id,
      sourceName: item.file_name,
      description: item.search_description || item.subject_description || "",
      bodyBuild: item.body_build || "",
      bodyProportions: item.body_proportions || "",
      physicalAppearance: item.physical_appearance || "",
      hairColor: item.hair_color || "",
      hairLength: item.hair_length || "",
      hairStyle: item.hair_style || "",
      expression: item.facial_expression || "",
      wardrobe: item.wardrobe_details || "",
      pose: item.pose || "",
      orientation: item.body_orientation || "",
      framing: item.framing || "",
      cameraAngle: item.camera_angle || "",
      cameraDistance: item.camera_distance || "",
      composition: item.composition || "",
      lighting: item.lighting || "",
      background: item.background || "",
      environment: item.environment || "",
      photographicStyle: item.photographic_style || "",
      generalTags: item.general_tags || [],
    };
    nav("/character/new", { state: { mediaLibraryTraits: reusable } });
  };

  const items = media.data?.items || [];
  const total = media.data?.total || 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-10 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div>
          <div className="section-label">Media</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">AI Media Library</h1>
          <p className="text-sm text-zinc-400 mt-1">Browse the collection and its live Qwen analysis from the media server.</p>
        </div>
        <div className="flex-1" />
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono ${health.data?.online ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "hairline text-zinc-500"}`}>
          <span className={`h-2 w-2 rounded-full ${health.data?.online ? "bg-emerald-400" : "bg-zinc-600"}`} />
          MEDIA {health.data?.online ? "online" : "offline"}
        </div>
      </div>

      {stats.data && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Files", stats.data.total], ["Standalone", stats.data.standalone_images],
          ["Analyzed", stats.data.analyzed], ["Pending", stats.data.pending],
        ].map(([k,v]) => <div key={k} className="pane p-3"><div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{k}</div><div className="font-display text-xl font-bold">{Number(v||0).toLocaleString()}</div></div>)}
      </div>}

      <div className="pane p-3 flex flex-col lg:flex-row gap-2">
        <div className="inline-flex rounded-lg border hairline p-1 bg-elevated">
          <button onClick={()=>{setView("gallery");setFolderPath("");setOffset(0);}} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${view==="gallery"?"bg-cyan-500/15 text-cyan-200":"text-zinc-400"}`}><LayoutGrid className="h-3.5 w-3.5"/>Gallery</button>
          <button onClick={()=>{setView("folders");setOffset(0);}} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${view==="folders"?"bg-cyan-500/15 text-cyan-200":"text-zinc-400"}`}><FolderOpen className="h-3.5 w-3.5"/>Folders</button>
        </div>
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search filename, pose, clothing, lighting, environment, tags..." className="pl-9 bg-elevated border-hairline text-zinc-100" />
        </div>
        <select value={type} onChange={e=>{setType(e.target.value);setOffset(0);}} className="rounded-lg bg-elevated border hairline px-3 py-2 text-sm text-zinc-200">
          <option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option>
        </select>
        <select value={status} onChange={e=>{setStatus(e.target.value);setOffset(0);}} className="rounded-lg bg-elevated border hairline px-3 py-2 text-sm text-zinc-200">
          <option value="all">Any status</option><option value="complete">Analyzed only</option><option value="pending">Pending</option><option value="error">Error</option><option value="not_required">Not required</option>
        </select>
        <button onClick={()=>{health.refetch();stats.refetch();media.refetch();}} className="inline-flex items-center justify-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"><RefreshCw className="h-4 w-4"/>Refresh</button>
      </div>

      {view==="folders" && <div className="pane p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button onClick={()=>{setFolderPath("");setOffset(0);}} className="rounded-md p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" title="Media root"><Home className="h-4 w-4"/></button>
          {(folders.data?.breadcrumbs || []).map((crumb,index)=><div key={crumb.path || index} className="flex items-center gap-1"><ChevronRight className="h-3 w-3 text-zinc-600"/><button onClick={()=>{setFolderPath(crumb.path);setOffset(0);}} className="rounded-md px-2 py-1 text-zinc-300 hover:bg-white/5">{crumb.name}</button></div>)}
        </div>
        {folders.isLoading ? <div className="text-xs text-zinc-500">Loading folders…</div> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {(folders.data?.folders || []).map(folder=><button key={folder.path} onClick={()=>{setFolderPath(folder.path);setOffset(0);}} className="rounded-lg border hairline bg-black/20 p-3 text-left hover:border-cyan-400/40">
              <div className="flex items-center gap-2"><Folder className="h-5 w-5 text-amber-300"/><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{folder.name}</div><div className="mt-0.5 text-[10px] text-zinc-500">{Number(folder.media_count||0).toLocaleString()} media · {Number(folder.analyzed_count||0).toLocaleString()} analyzed</div></div></div>
            </button>)}
            {!folders.isLoading && !(folders.data?.folders || []).length && <div className="text-xs text-zinc-500 p-2">No subfolders here.</div>}
          </div>}
      </div>}

      {media.isError ? <div className="pane p-8 text-center text-zinc-400"><Database className="h-8 w-8 mx-auto mb-2"/><div className="font-semibold text-zinc-200">Media server unavailable</div><div className="text-xs mt-1">{media.error?.response?.data?.detail || media.error?.message}</div></div>
      : media.isLoading ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">{Array.from({length:18}).map((_,i)=><div key={i} className="pane aspect-[3/4] animate-pulse"/>)}</div>
      : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {items.map(item => <button key={item.id} onClick={()=>setSelected(item)} className="pane overflow-hidden text-left hover:border-cyan-400/40 transition-colors group">
            <div className="relative aspect-[3/4] bg-elevated overflow-hidden">
              {item.thumbnail_url ? <img src={endpoints.mediaLibraryThumbnailUrl(item.id)} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"/> : <div className="h-full grid place-items-center text-zinc-600">{item.media_type==="video"?<Video/>:<Images/>}</div>}
              <span className={`absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-mono uppercase backdrop-blur bg-black/70 ${item.analysis_status==="complete"?"text-emerald-300":"text-zinc-300"}`}>{item.analysis_status}</span>
            </div>
            <div className="p-2.5"><div className="text-xs font-semibold truncate">{item.file_name}</div><div className="text-[10px] text-zinc-500 mt-1 truncate">{item.width && item.height ? `${item.width}×${item.height}` : item.media_type}</div></div>
          </button>)}
        </div>}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">{total.toLocaleString()} results · page {page} of {pages}</div>
        <div className="flex gap-2"><button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-PAGE_SIZE))} className="rounded-lg border hairline px-3 py-2 text-sm disabled:opacity-30">Previous</button><button disabled={offset+PAGE_SIZE>=total} onClick={()=>setOffset(offset+PAGE_SIZE)} className="rounded-lg border hairline px-3 py-2 text-sm disabled:opacity-30">Next</button></div>
      </div>

      {selected && <div className="fixed inset-0 z-50 bg-black/85 p-3 sm:p-6 flex items-center justify-center" onClick={()=>setSelected(null)}>
        <div className="pane w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 z-10 glass border-b hairline p-3 flex items-center gap-3"><div className="min-w-0 flex-1"><div className="font-display font-bold truncate">{selected.file_name}</div><div className="text-[10px] text-zinc-500 font-mono">{selected.analysis_status}</div></div><button onClick={()=>setSelected(null)} className="h-9 w-9 grid place-items-center rounded-lg border hairline"><X className="h-4 w-4"/></button></div>
          <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)] gap-5 p-4">
            <div><img src={endpoints.mediaLibraryOriginalUrl(selected.id)} alt="" className="w-full max-h-[72vh] object-contain rounded-lg bg-black"/></div>
            <div className="space-y-4">
              <Meta label="Description" value={selected.search_description || selected.subject_description}/>
              <Meta label="Appearance" value={selected.physical_appearance}/>
              <Meta label="Build / proportions" value={[selected.body_build, selected.body_proportions].filter(Boolean).join(" · ")}/>
              <Meta label="Hair" value={[selected.hair_color, selected.hair_length, selected.hair_style].filter(Boolean).join(" · ")}/>
              <Meta label="Wardrobe" value={selected.wardrobe_details}/>
              <Meta label="Pose" value={selected.pose}/>
              <Meta label="Framing / camera" value={[selected.framing, selected.camera_angle, selected.camera_distance].filter(Boolean).join(" · ")}/>
              <Meta label="Lighting" value={selected.lighting}/>
              <Meta label="Environment" value={selected.environment || selected.background}/>
              <Meta label="Style" value={selected.photographic_style}/>
              <Meta label="Tags" value={[...(selected.general_tags||[]), ...(selected.adult_content_tags||[])]}/>
              {selected.analysis_status === "complete" && <button onClick={()=>useInStudio(selected)} className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-3 transition-colors">Use in Studio</button>}
              {selected.analysis_status !== "complete" && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Qwen analysis is not complete for this item yet. The metadata panel will fill in automatically after analysis.</div>}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
