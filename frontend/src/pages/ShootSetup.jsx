import { referenceShootWorkflows, shootContinuityDefaults, shootReferenceInstruction, shootReferencePreview } from "@/lib/shootContinuity";
import { clothingSequence, DEFAULT_CLOTHING_STAGES } from "@/lib/shootClothingSequence";
import { EXPOSURE_CHOICES } from "@/lib/wardrobeNudity";
import GroupedChips from "@/components/GroupedChips";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Shuffle, Play, Loader2, ChevronLeft } from "lucide-react";
import { API_BASE, endpoints } from "@/lib/api";
import { SECTIONS } from "@/lib/dna";
import { POSE_PACKS, samplePoses, cycleOutfits } from "@/lib/posePacks";
import ShootPlanner from "@/components/ShootPlanner";
import { plannedFrameControls } from "@/lib/shootPlanner";
import LoraPanel from "@/components/LoraPanel";
import { likenessOverrides, likenessTriggerText } from "@/components/LikenessLoraPanel";
import { compileModelPrompts } from "@/lib/modelPromptCompilers";
import { resolveBuilderControls } from "@/lib/builderControlResolution";
import { shootFrameDna } from "@/lib/shootFrames";

// Flat pool of all pose actions from the DNA schema
const POSE_SECTION = SECTIONS.find((s) => s.key === "pose");
const POSE_FIELD = POSE_SECTION.fields.find((f) => f.key === "action");
const ALL_POSES = POSE_FIELD.groups.flatMap((g) => g.options);

// Flat pool of outfit_preset options
const WARDROBE_SECTION = SECTIONS.find((s) => s.key === "wardrobe");
const OUTFIT_FIELD = WARDROBE_SECTION.fields.find((f) => f.key === "outfit_preset");
const OUTFIT_GROUPS = OUTFIT_FIELD.groups;
const FACE_SECTION = SECTIONS.find((s) => s.key === "face");
const EXPRESSION_FIELD = FACE_SECTION?.fields.find((f) => f.key === "expression");
const EXPRESSION_GROUPS = EXPRESSION_FIELD?.groups || (EXPRESSION_FIELD?.options?.length
  ? [{ name: "Expressions", options: EXPRESSION_FIELD.options }]
  : []);

const CONTINUITY_PRESETS = [
  { key: "maximum", label: "Maximum match", hint: "Reuse the source seed and location; text-only renders can still change faces.", seedMode: "same", lockScenario: true },
  { key: "balanced", label: "Consistent variety", hint: "Recommended: locked location with a small seed offset for each pose.", seedMode: "character_pose", lockScenario: true },
  { key: "creative", label: "Creative", hint: "Fresh seeds allow more variety, with greater identity drift.", seedMode: "fresh", lockScenario: false },
];

const PAIRING_SHOTS = {
  "mother and daughter": ["Adult mother A is visibly older than adult daughter B; shared facial traits and heritage, with separate recognizable faces"],
  "stepmom and stepdaughter": ["Adult stepmother A is older than adult stepdaughter B; distinct adult identities"],
  "twins": ["Two adult twin sisters with closely matching faces and shared features"],
  "identical twins": ["Two adult identical twins with matching facial features"],
  "sisters": ["Two adult sisters with clear family resemblance and distinct faces"],
  "aunt and niece": ["Adult aunt A is older than adult niece B; shared facial traits and distinct adult ages"],
  "grandma and granddaughter": ["Adult grandmother A is visibly older than adult granddaughter B; coherent family resemblance"],
};

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

  const { data: shootContext, isLoading: contextLoading, isError: contextError, refetch: refetchContext } = useQuery({
    queryKey: ["shoot-context", characterId], queryFn: () => endpoints.characterShootContext(characterId), enabled: !!characterId,
  });
  const [shootStep, setShootStep] = useState("character");
  const shootNavigation = useRef(null);
  const goShootStep = step => {
    setShootStep(step);
    shootNavigation.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  };
  const [identityMode, setIdentityMode] = useState("text");
  const continuityLoaded = useRef(false);
  const [setControls, setSetControls] = useState({ scene: {}, lighting: {}, camera: {} });
  const referenceWorkflows = referenceShootWorkflows(workflows);
  const availableWorkflows = identityMode === "reference" ? referenceWorkflows : workflows.filter(w => ["image", "pony"].includes(w.kind));
  const [aiFrames, setAiFrames] = useState(null);
  const [manualCount, setCount] = useState(8);
  const [sequenceEnabled, setSequenceEnabled] = useState(false);
  const [coverageStages, setCoverageStages] = useState(DEFAULT_CLOTHING_STAGES);
  const [shotsPerStage, setShotsPerStage] = useState(4);
  const [sequenceSet, setSequenceSet] = useState('');
  const coverageFrames = useMemo(() => clothingSequence(coverageStages, shotsPerStage, sequenceSet), [coverageStages, shotsPerStage, sequenceSet]);
  const count = sequenceEnabled ? coverageFrames.length : manualCount;
  const [workflowId, setWorkflowId] = useState("");
  const [poseMode, setPoseMode] = useState("pack"); // random | pack | manual
  const [packKey, setPackKey] = useState("editorial");
  const [manualPoses, setManualPoses] = useState([]);
  const [outfits, setOutfits] = useState([]); // list of outfit_preset strings
  const [expressions, setExpressions] = useState([]);
  const [continuity, setContinuity] = useState("maximum");
  const [lockScenario, setLockScenario] = useState(true);
  const [seedMode, setSeedMode] = useState("same"); // same | character_pose | fresh
  const [baseSeed, setBaseSeed] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [name, setName] = useState("");
  const savedLikenessOverrides = useMemo(
    () => likenessOverrides(character?.subjects || []),
    [character?.subjects]
  );
  const pairing = character?.subjects?.[0]?.dna?.scenario?.cast_type || character?.dna?.scenario?.cast_type || "none";
  const shotScript = useMemo(() => PAIRING_SHOTS[pairing] || [], [pairing]);
  const shootWorkflow = workflows.find((workflow) => workflow.id === workflowId);

  useEffect(() => {
    if (continuityLoaded.current || contextLoading || !character || !workflows.length || !shootContext) return;
    const defaults = shootContinuityDefaults(shootContext, workflows, settings?.default_workflow_id);
    setIdentityMode(defaults.mode); setWorkflowId(defaults.workflowId); setBaseSeed(String(defaults.seed)); setLoraOverrides(defaults.loras);
    continuityLoaded.current = true;
  }, [shootContext, contextLoading, character, workflows, settings]);

  useEffect(() => { setAiFrames(null); }, [workflowId, count, lockScenario, sequenceEnabled]);

  // Preview: compute what each frame will be
  const previewFrames = useMemo(() => {
    const poses = samplePoses({ mode: poseMode, packKey, manualPoses, count, allPoses: ALL_POSES });
    const outs = cycleOutfits(outfits.map((o) => ({ outfit_preset: o })), count);
    return poses.map((sampledPose, i) => {
      const planned = aiFrames ? plannedFrameControls(aiFrames[i], lockScenario) : null;
      const p = planned ? planned.pose_action : sampledPose;
      const scene_direction = shotScript.length ? shotScript[i % shotScript.length] : "";
      const outfit_overrides = sequenceEnabled ? coverageFrames[i] : planned ? planned.outfit_overrides : outs[i] || {};
      const face_overrides = planned ? planned.face_overrides : expressions.length ? { expression: expressions[i % expressions.length] } : {};
      const savedDna = character?.subjects?.[0]?.dna || character?.dna || {};
      const baseDna = { ...savedDna, scene: { ...savedDna.scene, ...setControls.scene }, lighting: { ...savedDna.lighting, ...setControls.lighting }, camera: { ...savedDna.camera, ...setControls.camera } };
      const planControls = { wardrobeOverrides: outfit_overrides, poseOverrides: planned?.pose_overrides, lightingOverrides: { ...setControls.lighting, ...planned?.lighting_overrides }, sceneOverrides: { ...setControls.scene, ...planned?.scene_overrides }, lockScenario };
      const frameDna = shootFrameDna(baseDna, { poseAction: p, outfitPreset: outfit_overrides.outfit_preset, faceOverrides: face_overrides, ...planControls });
      const subjects = (character?.subjects || []).map((subject, index) =>
        ({ ...subject, dna: index === 0 ? frameDna : shootFrameDna({ ...subject.dna, scene: { ...subject.dna?.scene, ...setControls.scene }, lighting: { ...subject.dna?.lighting, ...setControls.lighting }, camera: { ...subject.dna?.camera, ...setControls.camera } }, {
          poseAction: p, outfitPreset: outfit_overrides.outfit_preset, faceOverrides: face_overrides, ...planControls,
        }) }));
      const compiled = shootWorkflow ? compileModelPrompts({
        promptStyle: identityMode === "reference" ? "qwen_rapid" : shootWorkflow.prompt_style,
        workflowKind: identityMode === "reference" ? "image" : shootWorkflow.kind,
        workflowName: identityMode === "reference" ? "Qwen Rapid" : shootWorkflow.name,
        promptFormat: ["compact", "ollama"].includes(settings?.builder_prompt_format) ? "compact" : "detailed",
        dna: frameDna,
        subjects,
        isMulti: subjects.length > 1,
        raunch: character?.raunch || 0,
        fieldLocks: character?.field_locks || {},
        sectionLocks: character?.locks || {},
      }) : null;
      return {
        control_notes: resolveBuilderControls(frameDna).notes.map(note => note.text),
        pose_overrides: planned?.pose_overrides || {},
        lighting_overrides: planned?.lighting_overrides || {},
        scene_overrides: planned?.scene_overrides || {},
        pose_action: p,
        scene_direction,
        outfit_overrides,
        face_overrides,
        // Recompile the frame so an old pose/outfit from the saved prompt cannot compete.
        prompt_positive: compiled ? [
          p && `Frame pose: ${p}`,
          outfit_overrides.outfit_preset && `Frame outfit for every subject: ${outfit_overrides.outfit_preset}`,
          scene_direction,
          compiled.positive,
          identityMode === "text" && likenessTriggerText(character?.subjects || []),
        ].filter(Boolean).join(". ") : "",
        prompt_negative: compiled?.negative || "",
        edit_instruction: identityMode === "reference" ? shootReferenceInstruction([
          compiled?.positive, scene_direction,
        ].filter(Boolean).join(". ")) : "",

      };
    });
  }, [sequenceEnabled, coverageFrames, poseMode, packKey, manualPoses, count, outfits, expressions, shotScript, character, shootWorkflow, aiFrames, lockScenario, setControls, identityMode, settings?.builder_prompt_format]);

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        name: name || `${character?.name || "Shoot"} · ${count} shots`,
        character_id: characterId,
        workflow_id: workflowId,
        count,
        frames: previewFrames,
        lora_overrides: identityMode === "reference" ? {} : { ...loraOverrides, ...savedLikenessOverrides },
        source_render_id: identityMode === "reference" ? shootContext?.render_id : null,
        set_overrides: setControls,
        dispatch_settings: identityMode === "text" && workflowId === shootContext?.recipe?.workflow_id ? shootContext.recipe : {},
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

  const applyContinuity = (preset) => {
    setContinuity(preset.key);
    setSeedMode(preset.seedMode);
    setLockScenario(preset.lockScenario);
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

      <section ref={shootNavigation} className="pane scroll-mt-24 p-3 sm:p-4 space-y-3" aria-label="Shoot plan">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300"><span className="chip">{identityMode === "reference" ? "Saved photo reference" : "Text-based identity"}</span><span>{count} shots</span><span>·</span><span>{shootWorkflow?.name || "Choose workflow"}</span></div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Shoot setup sections">
          {[['character','Character'],['shots','Shot list'],['wardrobe','Wardrobe'],['set','Set & lighting'],['review','Review & queue']].map(([key,label],index) => <button key={key} type="button" aria-pressed={shootStep === key} onClick={() => goShootStep(key)} className={`chip shrink-0 ${shootStep === key ? 'active' : ''}`}>{index + 1}. {label}</button>)}
        </nav>
      </section>
      {contextError && <div role="alert" className="pane p-4 text-sm text-amber-200">Could not load the character's shoot reference.<button type="button" className="chip ml-2" onClick={() => refetchContext()}>Try again</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Left column - config */}
        <div className="space-y-4">
          {shootStep === "character" && <section className="pane p-4 space-y-3">
            <h2 className="section-label">Character continuity</h2>
            <p className="text-sm text-zinc-300">{shootContext?.render_id ? "Uses your chosen default photo, or the latest character render before a shoot." : "Render and save a character photo first to enable photo reference mode."}</p>
            {shootContext?.preview && <img src={shootReferencePreview(shootContext.preview, API_BASE)} alt="Character reference for this shoot" className="h-40 w-full rounded-xl object-contain bg-black/20" />}
            <div className="flex flex-wrap gap-2">{[['reference','Match saved photo'],['text','Generate from selections']].map(([mode,label]) => <button type="button" key={mode} className={`chip ${identityMode === mode ? 'active' : ''}`} aria-pressed={identityMode === mode} disabled={mode === 'reference' && (!shootContext?.render_id || !referenceWorkflows.length)} onClick={() => {
              setIdentityMode(mode); setAiFrames(null);
              const next = mode === 'reference' ? referenceWorkflows[0] : workflows.find(w => w.id === shootContext?.recipe?.workflow_id && ['image','pony'].includes(w.kind)) || workflows.find(w => ['image','pony'].includes(w.kind));
              setWorkflowId(next?.id || ''); setLoraOverrides(mode === 'text' && next?.id === shootContext?.recipe?.workflow_id ? shootContext.recipe.lora_overrides || {} : {});
            }}>{label}</button>)}</div>
            <p className="text-xs text-zinc-400">{identityMode === 'reference' ? 'Uses Qwen Image Edit with the same source photo for every frame. Large pose or wardrobe changes can still cause drift.' : 'Text and seeds describe traits; they cannot lock the exact face. Source workflow, seed and render settings are reused when available.'}</p>
          </section>}
          {/* Basics */}
          <section hidden={shootStep !== "character"} className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-basics-panel">
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
                  {availableWorkflows.map((w) => (
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
                  max={40}
                  disabled={sequenceEnabled}
                  step={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>4</span><span>12</span><span>20</span><span>28</span><span>40</span>
                </div>
              </label>
            </div>
          </section>

          <div hidden={shootStep !== "shots"}>{!sequenceEnabled && count <= 20 && <ShootPlanner characterId={characterId} workflow={shootWorkflow} count={count} lockScenario={lockScenario}
            appliedFrames={aiFrames} onApply={setAiFrames} />}
          {aiFrames && <div className="pane p-4 text-sm text-cyan-200">AI shot plan applied. Pose, outfit and expression rotations below are replaced by the shot cards.
            <button type="button" className="chip ml-2" onClick={() => setAiFrames(null)}>Return to manual rotation</button></div>}</div>
          {/* Pose source */}
          <fieldset disabled={!!aiFrames} className="pane p-4 sm:p-6 space-y-4 disabled:opacity-40" data-testid="shoot-pose-panel" hidden={shootStep !== "shots"}>
            {shotScript.length > 0 && <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3 text-xs text-cyan-100" data-testid="shoot-scenario-script">
              <strong>Scenario shot script · {pairing}</strong>
              <p className="mt-1 text-zinc-300">Each frame follows a portrait direction for the selected relationship. Character appearance and the shared location stay consistent.</p>
            </div>}
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

            {poseMode === "manual" && <GroupedChips groups={POSE_FIELD.groups} value={manualPoses} onChange={setManualPoses} multi testIdPrefix="shoot-manual-pose" />}

            {poseMode === "random" && (
              <div className="text-xs text-zinc-400 p-3 rounded-md bg-elevated border border-hairline flex items-center gap-2">
                <Shuffle className="h-3.5 w-3.5 text-amber-300" />
                {count} random poses will be sampled from the full pose library ({ALL_POSES.length} options).
              </div>
            )}
          </fieldset>

          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-clothing-sequence" hidden={shootStep !== "wardrobe"}>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={sequenceEnabled} onChange={event => { setSequenceEnabled(event.target.checked); setAiFrames(null); }} data-testid="enable-clothing-sequence" />Ordered clothing coverage sequence</label>
            <p className="text-xs text-zinc-400">Repeat each selected coverage stage before moving to the next. Uses the saved outfit and matching lingerie, or choose a complete set below.</p>
            {sequenceEnabled && <>
              <div className="flex items-center gap-3"><label className="text-xs text-zinc-300">Photos per stage <select aria-label="Photos per coverage stage" value={shotsPerStage} onChange={event => setShotsPerStage(Number(event.target.value))} className="bg-elevated border hairline rounded-lg px-3 py-2 ml-2">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></label><span className="text-sm text-brass" data-testid="clothing-sequence-total">{coverageStages.length} stages × {shotsPerStage} photos = {count} photos</span></div>
              <div className="grid grid-cols-2 gap-2">{EXPOSURE_CHOICES.map(stage => <button key={stage} type="button" className={`chip text-left ${coverageStages.includes(stage) ? 'active' : ''}`} aria-pressed={coverageStages.includes(stage)} data-testid={`coverage-stage-${stage.replace(/ /g, '-')}`} onClick={() => setCoverageStages(current => current.includes(stage) ? current.filter(value => value !== stage) : [...current, stage])}>{stage}</button>)}</div>
              <details><summary className="text-xs text-cyan-200 cursor-pointer">Choose a complete outfit for this shoot</summary><div className="pt-3"><GroupedChips groups={WARDROBE_SECTION.fields.find(field => field.key === 'outfit_set').groups} labels={WARDROBE_SECTION.fields.find(field => field.key === 'outfit_set').optionLabels} value={sequenceSet} onChange={setSequenceSet} testIdPrefix="shoot-complete-set" /></div></details>
              {count === 0 && <p className="text-xs text-amber-200">Select at least one coverage stage.</p>}
              <p className="text-xs text-zinc-500">Stages run in coverage order. Poses and expressions can still vary. Outfit rotation and AI shot planning resume when this sequence is turned off.</p>
            </>}
          </section>
          {/* Outfits */}
          <fieldset disabled={!!aiFrames || sequenceEnabled} className="pane p-4 sm:p-6 space-y-4 disabled:opacity-40" data-testid="shoot-outfit-panel" hidden={shootStep !== "wardrobe"}>
            <div className="flex items-center justify-between">
              <div>
                <div className="section-label">Outfit rotation</div>
                <p className="text-xs text-zinc-500">Leave empty to keep the character's saved outfit. Pick multiple to cycle across shots.</p>
              </div>
            </div>
            <GroupedChips groups={OUTFIT_GROUPS} value={outfits} onChange={setOutfits} multi testIdPrefix="shoot-outfit" />
          </fieldset>

          {/* Advanced: scenario + seed */}
          <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-advanced-panel" hidden={shootStep !== "character"}>
            <div className="section-label">Consistency</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CONTINUITY_PRESETS.map((preset) => (
                <button key={preset.key} type="button" onClick={() => applyContinuity(preset)}
                  data-testid={`btn-continuity-${preset.key}`}
                  className={`text-left rounded-lg border p-3 transition-colors ${continuity === preset.key ? "border-emerald-500 bg-emerald-500/10" : "border-hairline hover:bg-white/5"}`}>
                  <div className="font-display font-bold text-sm">{preset.label}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">{preset.hint}</div>
                </button>
              ))}
            </div>
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
                  { k: "same", label: "Locked", hint: "Same seed for every shot; identity can still drift without a photo reference." },
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

          <fieldset disabled={!!aiFrames} className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-expression-panel" hidden={shootStep !== "shots"}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-label">Expression rotation</div>
                <p className="text-xs text-zinc-500">Optional. Selected expressions cycle across the shoot; reference mode asks the model to preserve identity.</p>
              </div>
              {expressions.length > 0 && <button type="button" onClick={() => setExpressions([])} className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">clear</button>}
            </div>
            <GroupedChips groups={EXPRESSION_GROUPS} value={expressions} onChange={setExpressions} multi testIdPrefix="shoot-expression" />
          </fieldset>
          <div hidden={shootStep !== "character" || identityMode === "reference"}><LoraPanel workflowId={workflowId} workflow={shootWorkflow} dna={character?.subjects?.[0]?.dna || character?.dna || {}} values={loraOverrides} onChange={setLoraOverrides} /></div>
          <section hidden={shootStep !== "set"} className="pane p-4 space-y-4" data-testid="shoot-set-panel">
            <h2 className="section-label">Set, lighting & camera · shared across the shoot</h2>
            <p className="text-xs text-zinc-400">Start from the character's saved scene. These changes apply to every frame; the AI plan can add per-shot lighting.</p>
            {['scene','lighting','camera'].map(section => <div key={section} className="space-y-3"><h3 className="text-sm font-semibold">{section === 'scene' ? 'Set' : section === 'lighting' ? 'Lighting' : 'Camera'}</h3>{SECTIONS.find(s => s.key === section).fields.filter(field => field.key !== 'aspect_ratio').map(field => {
              const value = setControls[section][field.key] ?? (character.subjects?.[0]?.dna || character.dna)?.[section]?.[field.key] ?? '';
              const change = next => setSetControls(current => ({...current, [section]: {...current[section], [field.key]:next}}));
              return <div key={field.key}><label className="text-xs text-zinc-300">{field.label}</label>{field.type === 'text' ? <input aria-label={`Shoot ${field.label}`} value={value} onChange={e => change(e.target.value)} className="mt-1 w-full rounded-lg border hairline bg-elevated p-2 text-sm" /> : <GroupedChips groups={field.groups || [{name:field.label,options:field.options || []}]} value={value} onChange={change} />}</div>;
            })}</div>)}
          </section>
          <div className="flex justify-between gap-2" aria-label="Shoot section navigation">
            <button type="button" className="chip" disabled={shootStep === 'character'} onClick={() => { const steps=['character','shots','wardrobe','set','review'];goShootStep(steps[Math.max(0,steps.indexOf(shootStep)-1)]); }}>Back</button>
            {shootStep !== 'review' && <button type="button" className="chip active" onClick={() => { const steps=['character','shots','wardrobe','set','review'];goShootStep(steps[steps.indexOf(shootStep)+1]); }}>Next section</button>}
          </div>
        </div>

        {/* Right column - preview + LoRA + dispatch */}
        <aside className={`${shootStep === "review" ? "block" : "hidden lg:block"} space-y-4 lg:sticky lg:top-20 lg:h-fit`}>
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
                    {f.outfit_overrides?.exposure_mode && <div className="text-amber-300 text-xs">{f.outfit_overrides.exposure_mode}</div>}
                    {f.face_overrides?.expression && <div className="text-cyan-300/80 truncate">{f.face_overrides.expression}</div>}
                    {[...Object.values(f.pose_overrides || {}), ...Object.values(f.lighting_overrides || {}), ...Object.values(f.scene_overrides || {})].filter(Boolean).map((value, index) => <div key={index} className="text-zinc-400 break-words">{value}</div>)}
                    {f.control_notes?.map(note => <p key={note} className="text-amber-200 mt-1">{note}</p>)}
                    {f.prompt_positive && <details className="mt-1 text-zinc-400">
                      <summary className="cursor-pointer text-cyan-200">View frame prompt</summary>
                      <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words">{f.prompt_positive}</p>
                    </details>}
                  </div>
                </div>
              ))}
            </div>
          </section>



          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={count < 1 || create.isPending || !workflowId || contextLoading || contextError || !continuityLoaded.current}
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
