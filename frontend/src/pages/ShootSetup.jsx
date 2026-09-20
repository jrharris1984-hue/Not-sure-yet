import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Shuffle, Play, Loader2, X, ChevronLeft } from "lucide-react";
import { endpoints } from "@/lib/api";
import { SECTIONS } from "@/lib/dna";
import { POSE_PACKS, samplePoses, cycleOutfits } from "@/lib/posePacks";
import LoraPanel from "@/components/LoraPanel";
import { likenessOverrides } from "@/components/LikenessLoraPanel";

// Flat pool of all pose actions from the DNA schema
const POSE_SECTION = SECTIONS.find((s) => s.key === "pose");
const POSE_FIELD = POSE_SECTION.fields.find((f) => f.key === "action");
const ALL_POSES = POSE_FIELD.groups.flatMap((g) => g.options);

// Flat pool of outfit_preset options
const WARDROBE_SECTION = SECTIONS.find((s) => s.key === "wardrobe");
const OUTFIT_FIELD = WARDROBE_SECTION.fields.find((f) => f.key === "outfit_preset");
const ALL_OUTFITS = OUTFIT_FIELD.groups.flatMap((g) => g.options);
const OUTFIT_GROUPS = OUTFIT_FIELD.groups;

export default function ShootSetup() {
  const { characterId } = useParams();
  const nav = useNavigate();

  const { data: character, isLoading: charLoading } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => endpoints.getCharacter(characterId),
    enabled: !!characterId,
  });
  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });

  const [count, setCount] = useState(8);
  const [workflowId, setWorkflowId] = useState("");
  const [poseMode, setPoseMode] = useState("pack"); // random | pack | manual
  const [packKey, setPackKey] = useState("editorial");
  const [manualPoses, setManualPoses] = useState([]);
  const [outfits, setOutfits] = useState([]); // list of outfit_preset strings
  const [lockScenario, setLockScenario] = useState(true);
  const [seedMode, setSeedMode] = useState("fresh"); // same | character_pose | fresh
  const [baseSeed, setBaseSeed] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [name, setName] = useState("");
  const savedLikenessOverrides = useMemo(
    () => likenessOverrides(character?.subjects || []),
    [character?.subjects]
  );

  useEffect(() => {
    if (!workflowId && workflows.length) {
      setWorkflowId(settings?.default_workflow_id || workflows[0].id);
    }
  }, [workflows, settings, workflowId]);

  // Preview: compute what each frame will be
  const previewFrames = useMemo(() => {
    const poses = samplePoses({ mode: poseMode, packKey, manualPoses, count, allPoses: ALL_POSES });
    const outs = cycleOutfits(outfits.map((o) => ({ outfit_preset: o })), count);
    return poses.map((p, i) => ({ pose_action: p, outfit_overrides: outs[i] || {} }));
  }, [poseMode, packKey, manualPoses, count, outfits]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        name: name || `${character?.name || "Shoot"} · ${count} shots`,
        character_id: characterId,
        workflow_id: workflowId,
        count,
        frames: previewFrames,
        lora_overrides: { ...loraOverrides, ...savedLikenessOverrides },
        pose_mode: poseMode,
        pose_pack: poseMode === "pack" ? packKey : "",
        seed_mode: seedMode,
        base_seed: baseSeed === "" ? null : Number(baseSeed),
        lock_scenario: lockScenario,
      };
      return endpoints.createShoot(body);
    },
    onSuccess: (s) => {
      toast.success(`Shoot queued · ${s.count} frames`);
      nav(`/shoot/${s.id}`);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Shoot creation failed"),
  });

  const toggleManualPose = (p) => {
    setManualPoses((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  };
  const toggleOutfit = (o) => {
    setOutfits((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]));
  };

  if (charLoading) return <div className="p-8 text-zinc-400">Loading character…</div>;
  if (!character) return <div className="p-8 text-zinc-400">Character not found. <Link to="/" className="underline">Back</Link></div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="shoot-setup-page">
      <div className="flex items-center gap-3">
        <Link to={`/character/${characterId}`} data-testid="btn-shoot-back" className="text-zinc-400 hover:text-zinc-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="section-label flex items-center gap-2"><Camera className="h-3 w-3" /> Photo Shoot</div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">{character.name || "Untitled"}</h1>
          <p className="text-sm text-zinc-400">Batch render this character across varied poses and outfits — one seed to the next, sequentially.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Left column - config */}
        <div className="space-y-4">
          {/* Basics */}
          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-basics-panel">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Shoot name</span>
                <input
                  data-testid="input-shoot-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${character.name} · ${count} shots`}
                  className="w-full bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Workflow</span>
                <select
                  data-testid="select-shoot-workflow"
                  value={workflowId}
                  onChange={(e) => { setWorkflowId(e.target.value); setLoraOverrides({}); }}
                  className="w-full bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100"
                >
                  {workflows.length === 0 && <option value="">No workflows — open Settings</option>}
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>{w.kind.toUpperCase()} · {w.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Shot count</span>
                  <span className="text-amber-300 font-mono text-sm" data-testid="shoot-count-value">{count}</span>
                </div>
                <input
                  data-testid="slider-shoot-count"
                  type="range"
                  min={4}
                  max={20}
                  step={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>4</span><span>8</span><span>12</span><span>16</span><span>20</span>
                </div>
              </label>
            </div>
          </section>

          {/* Pose source */}
          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-pose-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-label">Poses</div>
                <p className="text-xs text-zinc-500">Pick the pose source for this shoot.</p>
              </div>
              <div className="flex gap-1">
                {[
                  { k: "random", label: "Random" },
                  { k: "pack", label: "Pack" },
                  { k: "manual", label: "Pick" },
                ].map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setPoseMode(m.k)}
                    data-testid={`btn-pose-mode-${m.k}`}
                    className={`chip ${poseMode === m.k ? "active" : ""}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {poseMode === "pack" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POSE_PACKS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPackKey(p.key)}
                    data-testid={`btn-pose-pack-${p.key}`}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      packKey === p.key
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-hairline hover:bg-white/5"
                    }`}
                  >
                    <div className="font-display font-bold text-sm">{p.name}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{p.hint}</div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">{p.poses.length} poses</div>
                  </button>
                ))}
              </div>
            )}

            {poseMode === "manual" && (
              <div className="space-y-2">
                {manualPoses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-amber-500/5 border border-amber-500/30">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                      {manualPoses.length} picked
                    </span>
                    {manualPoses.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleManualPose(p)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-100 border border-amber-500/40 px-2 py-0.5 text-[11px] hover:bg-amber-500/25"
                      >
                        {p} <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
                {POSE_FIELD.groups.map((g) => (
                  <div key={g.name}>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{g.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleManualPose(opt)}
                          data-testid={`btn-manual-pose-${opt.replace(/\s+/g, "-")}`}
                          className={`chip ${manualPoses.includes(opt) ? "active" : ""}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {poseMode === "random" && (
              <div className="text-xs text-zinc-400 p-3 rounded-md bg-elevated border border-hairline flex items-center gap-2">
                <Shuffle className="h-3.5 w-3.5 text-amber-300" />
                {count} random poses will be sampled from the full pose library ({ALL_POSES.length} options).
              </div>
            )}
          </section>

          {/* Outfits */}
          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-outfit-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-label">Outfit rotation</div>
                <p className="text-xs text-zinc-500">Leave empty to keep the character's saved outfit. Pick multiple to cycle across shots.</p>
              </div>
              {outfits.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOutfits([])}
                  data-testid="btn-clear-outfits"
                  className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-100"
                >
                  clear all
                </button>
              )}
            </div>

            {outfits.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-amber-500/5 border border-amber-500/30">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                  {outfits.length} chosen
                </span>
                {outfits.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleOutfit(o)}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-100 border border-amber-500/40 px-2 py-0.5 text-[11px] hover:bg-amber-500/25"
                  >
                    {o} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {OUTFIT_GROUPS.map((g) => (
              <div key={g.name}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOutfit(opt)}
                      data-testid={`btn-outfit-${opt.replace(/\s+/g, "-")}`}
                      className={`chip ${outfits.includes(opt) ? "active" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Advanced: scenario + seed */}
          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-advanced-panel">
            <div className="section-label">Consistency</div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                data-testid="check-lock-scenario"
                checked={lockScenario}
                onChange={(e) => setLockScenario(e.target.checked)}
                className="accent-amber-400 h-4 w-4"
              />
              <div>
                <div className="text-sm text-zinc-200">Keep scenario/location locked across shots</div>
                <div className="text-[11px] text-zinc-500">Recommended for a coherent shoot.</div>
              </div>
            </label>

            <div className="space-y-2">
              <div className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Seed mode</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { k: "same", label: "Locked", hint: "Same seed for every shot — max character consistency, minimal pose variety." },
                  { k: "character_pose", label: "Locked + offset", hint: "Base seed anchors the character; +1 per shot adds slight pose drift." },
                  { k: "fresh", label: "Fresh", hint: "New seed per shot — max pose variety, character may drift." },
                ].map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setSeedMode(m.k)}
                    data-testid={`btn-seed-mode-${m.k}`}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      seedMode === m.k
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-hairline hover:bg-white/5"
                    }`}
                  >
                    <div className="font-display font-bold text-sm">{m.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{m.hint}</div>
                  </button>
                ))}
              </div>
              {(seedMode === "same" || seedMode === "character_pose") && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Base seed</span>
                  <input
                    data-testid="input-base-seed"
                    type="number"
                    value={baseSeed}
                    onChange={(e) => setBaseSeed(e.target.value)}
                    placeholder="random"
                    className="w-40 bg-elevated border border-hairline rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setBaseSeed(String(Math.floor(Math.random() * 2 ** 31)))}
                    data-testid="btn-randomize-seed"
                    className="text-[10px] font-mono uppercase tracking-widest text-amber-300 hover:text-amber-200"
                  >
                    randomize
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right column - preview + LoRA + dispatch */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <section className="pane p-4 space-y-3" data-testid="shoot-preview-panel">
            <div className="section-label">Preview · {count} shots</div>
            <div className="max-h-[360px] overflow-y-auto space-y-1 -mx-1 px-1">
              {previewFrames.map((f, i) => (
                <div
                  key={i}
                  data-testid={`shoot-preview-frame-${i}`}
                  className="flex items-start gap-2 text-[11px] font-mono p-2 rounded-md bg-elevated border border-hairline"
                >
                  <span className="text-zinc-500 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-200 truncate">{f.pose_action || <span className="text-zinc-500 italic">no pose</span>}</div>
                    {f.outfit_overrides?.outfit_preset && (
                      <div className="text-amber-300/80 truncate">{f.outfit_overrides.outfit_preset}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <LoraPanel workflowId={workflowId} values={loraOverrides} onChange={setLoraOverrides} />

          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending || !workflowId}
            data-testid="btn-start-shoot"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-3 disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start shoot · {count} frames
          </button>
        </aside>
      </div>
    </div>
  );
}
