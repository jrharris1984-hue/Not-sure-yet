import HomeImageTools from "@/components/HomeImageTools";
import PostGenerationActions from "@/components/PostGenerationActions";
import StudioLoading from "@/components/StudioLoading";
import { loadBodyCreationRecipe } from "@/lib/bodyCreationRecipe";
import { endpoints } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Images, Wrench } from "lucide-react";
import { toast } from "sonner";

const primaryOutput = render => render?.output_variants?.enhanced?.[0] || render?.output_files?.[0] || "";
const isVideoOutput = (url = "") => /\.(webm|mp4|mov)(?:[?&]|$)/i.test(decodeURIComponent(url));

export default function Tools() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const renderId = searchParams.get("render") || "";
  const { data: workflows = [], isLoading: workflowsLoading, isError: workflowsError } = useQuery({
    queryKey: ["workflows"],
    queryFn: endpoints.listWorkflows,
  });
  const { data: renders = [], isLoading: rendersLoading } = useQuery({
    queryKey: ["renders"],
    queryFn: endpoints.listRenders,
    enabled: !!renderId,
  });
  const source = renderId ? renders.find(render => render.id === renderId) : null;
  const postGenerationWorkflows = workflows.filter((workflow) => workflow.kind !== "text_video");
  const sourceUrl = source ? mediaUrl(primaryOutput(source)) : "";
  const sourceIsVideo = isVideoOutput(sourceUrl);

  const reuse = useMutation({
    mutationFn: async ({ render, targetKind, referenceMode, instruction }) => {
      const previewUrl = mediaUrl(primaryOutput(render));
      const reference = await endpoints.prepareRenderReference(render.id, previewUrl);
      const saved = referenceMode === "keep_character" ? await endpoints.getRenderRecipe(render.id) : null;
      return { render, targetKind, referenceMode, instruction, reference, saved, previewUrl };
    },
    onSuccess: ({ render, targetKind, referenceMode, instruction, reference, saved, previewUrl }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(path, { state: {
        galleryReference: reference,
        editInstruction: instruction,
        previewUrl,
        targetKind,
        referenceMode,
        characterRecipe: saved?.recipe,
      } });
    },
    onError: error => toast.error(error?.response?.data?.detail || "Could not prepare this image for the selected tool"),
  });

  const body = useMutation({
    mutationFn: async render => ({ render, result: await loadBodyCreationRecipe(render, endpoints) }),
    onSuccess: ({ render, result }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(`${path}/s/physique`, { state: { renderRecipe: result, renderRecipeMode: "body_creation" } });
    },
    onError: error => toast.error(error?.response?.data?.detail || error.message || "Could not load the original creation setup"),
  });

  const sourceBusy = reuse.isPending || body.isPending;

  const launchWorkflow = async (workflow) => {
    if (!source || sourceIsVideo || workflow.kind === "text_video") {
      nav(`/image-tools/${encodeURIComponent(workflow.id)}`);
      return;
    }
    try {
      const previewUrl = sourceUrl;
      const reference = await endpoints.prepareRenderReference(source.id, previewUrl);
      nav(`/image-tools/${encodeURIComponent(workflow.id)}`, {
        state: {
          galleryReference: reference,
          previewUrl,
          targetKind: workflow.kind,
          sourceRenderId: source.id,
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not prepare this source image for the selected workflow");
    }
  };

  return <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="tools-page">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="section-label">Tools</div>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold">Image & video tools</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">Creation builds the image. Tools handle what happens after: edit, repair, pose, reference, variation, upscale/enhance, and animation workflows.</p>
      </div>
      <Link to="/gallery" className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200">
        <Images className="h-4 w-4" /> Choose from Gallery
      </Link>
    </header>

    {renderId && rendersLoading && <StudioLoading label="Loading source image…" />}

    {renderId && !rendersLoading && !source && <div className="pane border-amber-500/30 p-4 text-sm text-amber-100">
      That Gallery image is no longer available. Choose another image from Gallery or use a tool without a starting image.
    </div>}

    {source && <section className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]" data-testid="tools-source">
      <div className="pane overflow-hidden">
        <div className="border-b hairline px-3 py-2">
          <div className="section-label">Starting image</div>
          <p className="mt-1 truncate text-xs text-zinc-400">{source.workflow_name || source.workflow_type || "Gallery render"}</p>
        </div>
        <div className="grid min-h-64 place-items-center bg-black/25">
          {sourceIsVideo
            ? <video src={sourceUrl} controls playsInline className="max-h-[440px] w-full object-contain" />
            : <img src={sourceUrl} alt="Selected Gallery source" className="max-h-[440px] w-full object-contain" />}
        </div>
      </div>
      {sourceIsVideo ? <div className="pane p-4 text-sm text-zinc-400">
        This is a video result. Still-image edit, pose, reference, and body tools need an image source. You can review or download the video in Gallery, or start another workflow below.
      </div> : <PostGenerationActions
        busy={sourceBusy}
        onEdit={() => reuse.mutate({ render: source, targetKind: "edit" })}
        onPose={() => reuse.mutate({ render: source, targetKind: "edit", referenceMode: "new_pose" })}
        onAnimate={() => reuse.mutate({ render: source, targetKind: "video" })}
        onReference={() => reuse.mutate({ render: source, targetKind: "face", referenceMode: "keep_character" })}
        onBody={() => body.mutate(source)}
      />}
    </section>}

    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-cyan-300" />
        <div>
          <h2 className="font-display text-xl font-bold">All workflows</h2>
          <p className="text-xs text-zinc-400">Choose a workflow directly. When a still image is selected above, compatible workflows keep that source attached.</p>
        </div>
      </div>
      <HomeImageTools workflows={postGenerationWorkflows} loading={workflowsLoading} error={workflowsError} showCreateShortcuts={false} showHeading={false} onWorkflow={source && !sourceIsVideo ? launchWorkflow : undefined} />
    </section>
  </div>;
}
