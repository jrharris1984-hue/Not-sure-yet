import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Shuffle, Download, Upload, Loader2, Play, ChevronLeft, ChevronRight, Camera, Sparkles, ChevronDown, ImagePlus, X, RotateCcw, SlidersHorizontal, ShieldCheck, AlertTriangle, Pencil, Film, Trash2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import {
  SECTIONS, DEFAULT_DNA,
  randomizeDna, randomizeSection, randomizeWetDream, resetSection,
  phaseOfSection,
  MAX_SUBJECTS, makeSubject, subjectsFromCharacter, subjectLabel,
  expectedSubjectCount, seedSubjectFromPairing,
  HERITAGE_CASTS,
} from "@/lib/dna";
import { compileModelPrompts, resolvePromptCompiler } from "@/lib/modelPromptCompilers";
import { analyzePromptQuality } from "@/lib/promptQuality";
import DnaSection from "@/components/DnaSection";
import PromptPreview from "@/components/PromptPreview";
import AiAssistBar from "@/components/AiAssistBar";
import PresetsMenu from "@/components/PresetsMenu";
import KinkPresetsMenu from "@/components/KinkPresetsMenu";
import LoraPanel from "@/components/LoraPanel";
import LikenessLoraPanel, { likenessOverrides, likenessTriggerText } from "@/components/LikenessLoraPanel";
import LivePreview from "@/components/LivePreview";
import TagInput from "@/components/TagInput";
import GroupedSectionRail from "@/components/GroupedSectionRail";
import DnaAtAGlance from "@/components/DnaAtAGlance";
import MobileOverflow from "@/components/MobileOverflow";
import MobileStudioFlow, {
  MOBILE_STUDIO_STEPS,
  SIMPLE_FIELD_KEYS,
  mobileStudioStepForSection,
  mobileStudioSectionsForStep,
} from "@/components/MobileStudioFlow";
import MobileCreateReview from "@/components/MobileCreateReview";
import PromptAlignmentCard from "@/components/PromptAlignmentCard";
import MobileRenderResult from "@/components/MobileRenderResult";
import SubjectSwitcher from "@/components/SubjectSwitcher";
import ChromaControls from "@/components/ChromaControls";
import RenderRecipeSelector from "@/components/RenderRecipeSelector";
import SmartSetupPanel from "@/components/SmartSetupPanel";
import { getRenderRecipe, recipeFamily } from "@/lib/renderRecipes";
import { readBuilderDraft, writeBuilderDraft, clearBuilderDraft } from "@/lib/builderDraft";
import { buildSameCharacterPoseInstruction, DEFAULT_POSE_LOCKS, SAME_CHARACTER_POSES } from "@/lib/sameCharacterPose";
import { DEFAULT_REFERENCE_STRENGTHS, REFERENCE_RECIPES, preservationStrengthInstruction, referenceStudioSummary } from "@/lib/referenceStudio";
import { Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function downloadRenderImage(url, filename = "render.png") {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    toast.success("Downloaded");
  } catch {
    window.open(url, "_blank", "noopener");
    toast.message("Opened image in a new tab");
  }
}

const REPAIR_TARGETS = [
  ["face", "Face"],
  ["hands", "Hands & fingers"],
  ["feet", "Feet & toes"],
  ["anatomy", "Body anatomy"],
  ["skin", "Natural skin texture"],
  ["sharpness", "Focus & sharpness"],
  ["lighting", "Lighting & exposure"],
  ["artifacts", "Artifacts & noise"],
];

export default function Builder() {
  const { id, section: sectionParam } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const galleryImportApplied = useRef(false);
  const draftHydrated = useRef(false);
  const skipNextPromptReset = useRef(false);
  const [editorHydrated, setEditorHydrated] = useState(false);

  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.key === sectionParam));
  const activeSection = SECTIONS[activeIdx].key;
  const basePath = isNew ? "/character/new" : `/character/${id}`;
  const sectionUrl = (key) => `${basePath}/s/${key}`;
  const goSection = (key) => nav(sectionUrl(key));

  const [mobileStudioStep, setMobileStudioStep] = useState(() => mobileStudioStepForSection(activeSection));
  const [mobileStudioMode, setMobileStudioMode] = useState(() => {
    try {
      return window.localStorage.getItem("ultra-studio-mobile-mode") === "advanced" ? "advanced" : "simple";
    } catch {
      return "simple";
    }
  });
  const activeMobileStudioIndex = Math.max(0, MOBILE_STUDIO_STEPS.findIndex((step) => step.id === mobileStudioStep));

  useEffect(() => {
    try {
      window.localStorage.setItem("ultra-studio-mobile-mode", mobileStudioMode);
    } catch {
      // Local storage can be unavailable in private/restricted browser modes.
    }
  }, [mobileStudioMode]);

  const openMobileStudioStep = (stepId) => {
    const step = MOBILE_STUDIO_STEPS.find((item) => item.id === stepId);
    if (!step) return;
    setMobileStudioStep(stepId);
    const visibleSections = mobileStudioSectionsForStep(stepId, mobileStudioMode);
    if (visibleSections.length && !visibleSections.includes(activeSection)) {
      nav(sectionUrl(visibleSections[0]));
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const moveMobileStudioStep = (direction) => {
    const nextIndex = Math.max(0, Math.min(MOBILE_STUDIO_STEPS.length - 1, activeMobileStudioIndex + direction));
    openMobileStudioStep(MOBILE_STUDIO_STEPS[nextIndex].id);
  };

  const changeMobileStudioMode = (nextMode) => {
    setMobileStudioMode(nextMode);
    if (nextMode !== "simple") return;
    const visibleSections = mobileStudioSectionsForStep(mobileStudioStep, "simple");
    if (visibleSections.length && !visibleSections.includes(activeSection)) {
      nav(sectionUrl(visibleSections[0]));
    }
  };

  const [name, setName] = useState("Untitled");
  // Multi-subject store: [{id, label, dna, field_locks}]. subjects[0] is Subject A (primary).
  const [subjects, setSubjects] = useState(() => [makeSubject({ label: "A" })]);
  const [activeSubjectId, setActiveSubjectId] = useState(() => "");
  const [locks, setLocks] = useState({}); // section-level locks (shared across subjects — shot-level)
  const [collapsed, setCollapsed] = useState(() => ({
    _glance: typeof window !== "undefined" ? window.innerWidth < 768 : false,
  }));     // {sectionKey|'_glance': bool}
  const [tags, setTags] = useState([]);
  const [raunch, setRaunch] = useState(false);
  const [promptLanguage, setPromptLanguage] = useState("editorial");
  const [promptOverride, setPromptOverride] = useState("");
  const [negativePromptOverride, setNegativePromptOverride] = useState("");
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);
  const [renderCount, setRenderCount] = useState(1);
  const [batchRenders, setBatchRenders] = useState([]);
  const [selectedBatchRenderId, setSelectedBatchRenderId] = useState(null);
  const [postRenderBusy, setPostRenderBusy] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [loraTriggerWords, setLoraTriggerWords] = useState([]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [sourceRenderId, setSourceRenderId] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [faceStrength, setFaceStrength] = useState(1.1);
  const [faceIdV2Strength, setFaceIdV2Strength] = useState(1.4);
  const [editInstruction, setEditInstruction] = useState("");
  const [editMode, setEditMode] = useState("standard");
  const [poseTarget, setPoseTarget] = useState("");
  const [poseNotes, setPoseNotes] = useState("");
  const [poseLocks, setPoseLocks] = useState(DEFAULT_POSE_LOCKS);
  const [referenceStudioView, setReferenceStudioView] = useState("simple");
  const [referenceRecipe, setReferenceRecipe] = useState("balanced");
  const [referenceStrengths, setReferenceStrengths] = useState(DEFAULT_REFERENCE_STRENGTHS);
  const [poseReferenceImage, setPoseReferenceImage] = useState(null);
  const [poseReferencePreview, setPoseReferencePreview] = useState("");
  const [poseReferenceUploading, setPoseReferenceUploading] = useState(false);
  const [poseReferenceAnalysis, setPoseReferenceAnalysis] = useState("");
  const [analyzingPoseReference, setAnalyzingPoseReference] = useState(false);
  const [preserveUnmentioned, setPreserveUnmentioned] = useState(true);
  const [enhancingEdit, setEnhancingEdit] = useState(false);
  const [repairTargets, setRepairTargets] = useState(["face", "hands"]);
  const [repairInstruction, setRepairInstruction] = useState("");
  const [repairStrength, setRepairStrength] = useState(0.45);
  const [repairAnalysis, setRepairAnalysis] = useState("");
  const [analyzingRepair, setAnalyzingRepair] = useState(false);
  const [videoInstruction, setVideoInstruction] = useState("");
  const [videoFrames, setVideoFrames] = useState(41);
  const [videoFps, setVideoFps] = useState(24);
  const [videoWidth, setVideoWidth] = useState(640);
  const [videoHeight, setVideoHeight] = useState(640);
  const [qualityTier, setQualityTier] = useState("balanced");
  const [enhancingVideo, setEnhancingVideo] = useState(false);
  const [analyzingVideoImage, setAnalyzingVideoImage] = useState(false);
  const [videoImageAnalysis, setVideoImageAnalysis] = useState("");
  useEffect(() => {
    if (mobileStudioStep === "create") return;
    setMobileStudioStep(mobileStudioStepForSection(activeSection));
  }, [activeSection, mobileStudioStep]);

  const [chromaSettings, setChromaSettings] = useState({
    width: 768,
    height: 1152,
    steps: 26,
    cfg: 3.8,
    batchSize: 1,
    sampler: "euler",
    seed: "",
  });

  const restoreDraft = (draft) => {
    if (!draft) return false;
    if (draft.name) setName(draft.name);
    if (Array.isArray(draft.subjects) && draft.subjects.length) setSubjects(draft.subjects);
    if (draft.activeSubjectId) setActiveSubjectId(draft.activeSubjectId);
    setLocks(draft.locks || {});
    setCollapsed(draft.collapsed || {});
    setTags(Array.isArray(draft.tags) ? draft.tags : []);
    const restoredLanguage = draft.promptLanguage || (draft.raunch ? "explicit" : "editorial");
    setPromptLanguage(restoredLanguage);
    setRaunch(restoredLanguage === "explicit");
    setPromptOverride(draft.promptOverride || "");
    setNegativePromptOverride(draft.negativePromptOverride || "");
    setWorkflowId(draft.workflowId || "");
    setLoraOverrides(draft.loraOverrides || {});
    setEditInstruction(draft.editInstruction || "");
    setEditMode(draft.editMode || "standard");
    setPoseTarget(draft.poseTarget || "");
    setPoseNotes(draft.poseNotes || "");
    setPoseLocks({ ...DEFAULT_POSE_LOCKS, ...(draft.poseLocks || {}) });
    setReferenceStudioView(draft.referenceStudioView || "simple");
    setReferenceRecipe(draft.referenceRecipe || "balanced");
    setReferenceStrengths({ ...DEFAULT_REFERENCE_STRENGTHS, ...(draft.referenceStrengths || {}) });
    setPoseReferenceAnalysis(draft.poseReferenceAnalysis || "");
    setPreserveUnmentioned(draft.preserveUnmentioned !== false);
    setRepairTargets(draft.repairTargets || ["face", "hands"]);
    setRepairInstruction(draft.repairInstruction || "");
    setVideoInstruction(draft.videoInstruction || "");
    setVideoFrames(draft.videoFrames || 41);
    setVideoFps(draft.videoFps || 24);
    setVideoWidth(draft.videoWidth || 640);
    setVideoHeight(draft.videoHeight || 640);
    setQualityTier(draft.qualityTier || "balanced");
    if (draft.chromaSettings) setChromaSettings(draft.chromaSettings);
    if (draft.activeRender) setActiveRender(draft.activeRender);
    if (Array.isArray(draft.batchRenders) && draft.batchRenders.length) {
      setBatchRenders(draft.batchRenders);
      setSelectedBatchRenderId(draft.selectedBatchRenderId || draft.batchRenders[0]?.id || null);
      if (!draft.activeRender) {
        const selected = draft.batchRenders.find((render) => render.id === draft.selectedBatchRenderId);
        setActiveRender(selected || draft.batchRenders[0]);
      }
    }
    if (draft.renderCount) setRenderCount(draft.renderCount);
    return true;
  };

  useEffect(() => {
    if (!isNew || draftHydrated.current) return;
    restoreDraft(readBuilderDraft(null));
    draftHydrated.current = true;
    setEditorHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  // Persist the latest render session so a refresh/reopen can reconnect to the
  // same queued/running batch instead of making it disappear from Builder.
  useEffect(() => {
    if (!draftHydrated.current) return;
    const existing = readBuilderDraft(isNew ? null : id) || {};
    writeBuilderDraft(isNew ? null : id, {
      ...existing,
      activeRender,
      batchRenders,
      selectedBatchRenderId,
      renderCount,
    });
  }, [activeRender, batchRenders, selectedBatchRenderId, renderCount, id, isNew]);

  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  useEffect(() => {
    if (!workflowId && workflows.length) {
      setWorkflowId(settings?.default_workflow_id || workflows[0].id);
    }
  }, [workflows, settings, workflowId]);

  useEffect(() => {
    const incoming = location.state?.galleryReference;
    if (!incoming || !workflows.length || galleryImportApplied.current || !editorHydrated) return;

    const requestedKind = location.state?.targetKind;
    const target = workflows.find((workflow) => workflow.kind === requestedKind);
    if (!target) {
      const label = requestedKind === "video" ? "image-to-video" : requestedKind === "face" ? "face-preserve" : "image-edit";
      toast.error(`No ${label} workflow is configured. Add one in Settings first.`);
      galleryImportApplied.current = true;
      nav(location.pathname, { replace: true, state: null });
      return;
    }

    galleryImportApplied.current = true;
    setMobileStudioStep("create");
    setWorkflowId(target.id);
    setReferenceImage(incoming);
    setSourceRenderId(incoming.source_render_id || null);
    setReferencePreview(location.state?.previewUrl || "");

    if (requestedKind === "edit") {
      setVideoInstruction("");
      if (location.state?.referenceMode === "new_pose") {
        setEditMode("new_pose");
        setPreserveUnmentioned(true);
        setEditInstruction("");
      } else {
        setEditMode("standard");
        setEditInstruction("Describe the changes you want to make to this Gallery image.");
      }
    } else if (requestedKind === "video") {
      setEditMode("standard");
      setEditInstruction("");
      setVideoInstruction("Describe how you want this Gallery image to move.");
    } else if (requestedKind === "face") {
      setEditMode("standard");
      setEditInstruction("");
      setVideoInstruction("");
    }

    const message = requestedKind === "video"
      ? "Gallery image loaded for animation"
      : requestedKind === "face"
        ? "Gallery image loaded as a face reference"
        : location.state?.referenceMode === "new_pose"
          ? "Gallery image loaded for a new pose"
          : "Gallery image loaded for editing";
    toast.success(message);
    nav(location.pathname, { replace: true, state: null });
  }, [editorHydrated, location.pathname, location.state, nav, workflows]);

  useEffect(() => {
    const saved = location.state?.renderRecipe?.recipe;
    if (!saved || !workflows.length || galleryImportApplied.current || !editorHydrated) return;
    galleryImportApplied.current = true;
    setMobileStudioStep("create");
    skipNextPromptReset.current = true;
    if (Array.isArray(saved.subjects) && saved.subjects.length) {
      const restored = saved.subjects.map((subject, index) => makeSubject({
        label: subject.label || subjectLabel(index), dna: subject.dna || DEFAULT_DNA, likeness: subject.likeness,
      }));
      setSubjects(restored);
      setActiveSubjectId(restored[0].id);
    } else if (saved.dna) {
      const restored = makeSubject({ label: "A", dna: saved.dna });
      setSubjects([restored]);
      setActiveSubjectId(restored.id);
    }
    if (saved.workflow_id && workflows.some((workflow) => workflow.id === saved.workflow_id)) setWorkflowId(saved.workflow_id);
    setLoraOverrides(saved.lora_overrides || {});
    setPromptOverride(saved.prompt_positive || "");
    setNegativePromptOverride(saved.prompt_negative || "");
    if (saved.reference_image) setReferenceImage({ name: saved.reference_image, type: "input", subfolder: "" });
    if (saved.edit_instruction) setEditInstruction(saved.edit_instruction);
    if (saved.video_instruction) setVideoInstruction(saved.video_instruction);
    setPreserveUnmentioned(saved.preserve_unmentioned !== false);
    setVideoFrames(saved.video_frames || 41);
    setVideoFps(saved.video_fps || 24);
    setVideoWidth(saved.video_width || 640);
    setVideoHeight(saved.video_height || 640);
    setChromaSettings((current) => ({ ...current,
      width: saved.width || current.width, height: saved.height || current.height,
      steps: saved.steps || current.steps, cfg: saved.cfg ?? current.cfg,
      batchSize: saved.batch_size || current.batchSize, sampler: saved.sampler_name || current.sampler,
      seed: saved.seed ?? current.seed,
    }));
    toast.success("Exact Gallery recipe restored in the editor");
    nav(location.pathname, { replace: true, state: null });
  }, [editorHydrated, location.pathname, location.state, nav, workflows]);

  const activeWorkflow = workflows.find((w) => w.id === workflowId);
  const promptStyle = activeWorkflow?.prompt_style || "venice";
  const isFaceWorkflow = activeWorkflow?.kind === "face";
  const isEditWorkflow = activeWorkflow?.kind === "edit";
  const isEnhanceWorkflow = activeWorkflow?.kind === "enhance";
  const isVideoWorkflow = activeWorkflow?.kind === "video";
  const isTextVideoWorkflow = activeWorkflow?.kind === "text_video";
  const activeCompiler = resolvePromptCompiler({
    promptStyle,
    workflowKind: activeWorkflow?.kind,
    workflowName: activeWorkflow?.name,
  });
  const isGoldenChroma = activeCompiler === "chroma";
  const activeRecipeFamily = recipeFamily(activeCompiler);

  const applyQualityTier = (tier) => {
    const recipe = getRenderRecipe(activeCompiler, tier);
    setQualityTier(tier);
    if (recipe.family === "image") {
      setChromaSettings((current) => ({
        ...current,
        width: recipe.width,
        height: recipe.height,
        steps: recipe.steps,
        cfg: recipe.cfg,
        batchSize: recipe.batchSize,
        sampler: recipe.sampler,
      }));
    } else if (recipe.family === "video") {
      setVideoFrames(recipe.videoFrames);
      setVideoFps(recipe.videoFps);
      setVideoWidth(recipe.videoWidth);
      setVideoHeight(recipe.videoHeight);
    } else if (recipe.family === "edit") {
      setRepairStrength(recipe.repairStrength);
    }
  };

  const applySmartSetup = (recommendation) => {
    const workflow = workflows.find((item) => item.id === recommendation.workflowId);
    if (!workflow) return;
    const compiler = resolvePromptCompiler({ promptStyle: workflow.prompt_style, workflowKind: workflow.kind, workflowName: workflow.name });
    const recipe = getRenderRecipe(compiler, recommendation.qualityTier);
    setWorkflowId(workflow.id);
    setLoraOverrides({});
    setQualityTier(recommendation.qualityTier);
    if (recipe.family === "image") {
      setChromaSettings((current) => ({ ...current, width: recipe.width, height: recipe.height, steps: recipe.steps, cfg: recipe.cfg, batchSize: recipe.batchSize, sampler: recipe.sampler }));
    } else if (recipe.family === "video") {
      setVideoFrames(recipe.videoFrames); setVideoFps(recipe.videoFps); setVideoWidth(recipe.videoWidth); setVideoHeight(recipe.videoHeight);
    } else if (recipe.family === "edit") setRepairStrength(recipe.repairStrength);
    window.dispatchEvent(new CustomEvent("ultra-studio:set-lora-mode", { detail: recommendation.loraMode }));
    toast.success(`Smart setup applied · ${workflow.name}`);
  };

  useEffect(() => {
    applyQualityTier("balanced");
    // Reset to the recommended recipe only when the selected model family changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompiler]);

  const uploadReference = async (file) => {
    if (!file) return;
    setReferenceUploading(true);
    try {
      const uploaded = await endpoints.uploadReferenceImage(file);
      if (referencePreview) URL.revokeObjectURL(referencePreview);
      setReferencePreview(URL.createObjectURL(file));
      setReferenceImage(uploaded);
      toast.success("Reference photograph uploaded");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reference photograph upload failed");
    } finally {
      setReferenceUploading(false);
    }
  };

  const uploadPoseReference = async (file) => {
    if (!file) return;
    setPoseReferenceUploading(true);
    try {
      const uploaded = await endpoints.uploadReferenceImage(file);
      if (poseReferencePreview) URL.revokeObjectURL(poseReferencePreview);
      setPoseReferencePreview(URL.createObjectURL(file));
      setPoseReferenceImage(uploaded);
      setPoseReferenceAnalysis("");
      toast.success("Pose reference uploaded · analyze it when ready");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Pose reference upload failed");
    } finally {
      setPoseReferenceUploading(false);
    }
  };

  const analyzePoseReference = async () => {
    if (!poseReferenceImage?.name) {
      toast.error("Upload a pose-reference image first");
      return;
    }
    setAnalyzingPoseReference(true);
    try {
      const result = await endpoints.aiAnalyzePoseReference(poseReferenceImage.name);
      setPoseReferenceAnalysis(result.pose_prompt || result.analysis || "");
      toast.success("Venice extracted the pose without copying the reference identity");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not analyze the pose reference");
    } finally {
      setAnalyzingPoseReference(false);
    }
  };

  const clearPoseReference = () => {
    if (poseReferencePreview) URL.revokeObjectURL(poseReferencePreview);
    setPoseReferencePreview("");
    setPoseReferenceImage(null);
    setPoseReferenceAnalysis("");
  };

  const toggleRepairTarget = (target) => {
    setRepairTargets((current) =>
      current.includes(target) ? current.filter((item) => item !== target) : [...current, target]
    );
  };

  const analyzeRepairImage = async () => {
    if (!referenceImage?.name) {
      toast.error("Upload the image you want to repair first");
      return;
    }
    setAnalyzingRepair(true);
    try {
      const result = await endpoints.aiAnalyzeRepairImage(
        referenceImage.name,
        repairTargets,
        repairInstruction.trim()
      );
      setRepairAnalysis(result.analysis || "");
      if (result.prompt) setRepairInstruction(result.prompt);
      toast.success("Venice inspected the image and drafted a repair instruction");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not inspect the image");
    } finally {
      setAnalyzingRepair(false);
    }
  };

  const enhanceEditInstruction = async () => {
    if (!editInstruction.trim()) {
      toast.error("Describe the edit first");
      return;
    }
    setEnhancingEdit(true);
    try {
      const result = await endpoints.aiEditPrompt(editInstruction.trim(), preserveUnmentioned);
      setEditInstruction(result.prompt || editInstruction);
      toast.success("Venice enhanced the edit instruction");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not enhance the edit instruction");
    } finally {
      setEnhancingEdit(false);
    }
  };

  const enhanceVideoInstruction = async () => {
    if (!videoInstruction.trim()) {
      toast.error("Describe the movement first");
      return;
    }
    setEnhancingVideo(true);
    try {
      const result = await endpoints.aiVideoPrompt(
        videoInstruction.trim(),
        isTextVideoWorkflow ? "text" : "image"
      );
      setVideoInstruction(result.prompt || videoInstruction);
      toast.success(isTextVideoWorkflow ? "Venice expanded the video prompt" : "Venice enhanced the motion prompt");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not enhance the motion prompt");
    } finally {
      setEnhancingVideo(false);
    }
  };

  const analyzeVideoImage = async () => {
    if (!referenceImage?.name) {
      toast.error("Upload a starting image first");
      return;
    }
    setAnalyzingVideoImage(true);
    try {
      const result = await endpoints.aiAnalyzeVideoImage(referenceImage.name, videoInstruction.trim());
      setVideoImageAnalysis(result.analysis || "");
      if (result.prompt) setVideoInstruction(result.prompt);
      toast.success("Venice analyzed the starting image and drafted the motion prompt");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Venice could not analyze the starting image");
    } finally {
      setAnalyzingVideoImage(false);
    }
  };

  const clearReference = () => {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferencePreview("");
    setReferenceImage(null);
  };

  useEffect(() => () => {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    if (poseReferencePreview) URL.revokeObjectURL(poseReferencePreview);
  }, [referencePreview, poseReferencePreview]);

  const { data: character } = useQuery({
    queryKey: ["character", id],
    queryFn: () => endpoints.getCharacter(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!character) return;
    setName(character.name || "Untitled");
    const subs = subjectsFromCharacter(character);
    setSubjects(subs);
    setActiveSubjectId(character.active_subject_id && subs.find((s) => s.id === character.active_subject_id)
      ? character.active_subject_id
      : subs[0].id);
    setLocks(character.locks || {});
    // Auto-fold the DNA at-a-glance panel on mobile if the user has never set a preference
    const savedCollapsed = character.collapsed || {};
    if (typeof savedCollapsed._glance === "undefined" && typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed({ ...savedCollapsed, _glance: true });
    } else {
      setCollapsed(savedCollapsed);
    }
    setTags(Array.isArray(character.tags) ? character.tags : []);
    const savedLanguage = character.prompt_language || (character.raunch ? "explicit" : "editorial");
    setPromptLanguage(savedLanguage);
    setRaunch(savedLanguage === "explicit");
    restoreDraft(readBuilderDraft(id));
    draftHydrated.current = true;
    setEditorHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id]);

  useEffect(() => {
    if (!draftHydrated.current) return undefined;
    const timer = window.setTimeout(() => writeBuilderDraft(id, {
      name, subjects, activeSubjectId, locks, collapsed, tags, raunch, promptLanguage,
      promptOverride, negativePromptOverride, workflowId, loraOverrides,
      editInstruction, preserveUnmentioned, repairTargets, repairInstruction,
      editMode, poseTarget, poseNotes, poseLocks,
      referenceStudioView, referenceRecipe, referenceStrengths, poseReferenceAnalysis,
      videoInstruction, videoFrames, videoFps, videoWidth, videoHeight,
      qualityTier, chromaSettings, activeRender,
    }), 350);
    return () => window.clearTimeout(timer);
  }, [
    id, name, subjects, activeSubjectId, locks, collapsed, tags, raunch, promptLanguage,
    promptOverride, negativePromptOverride, workflowId, loraOverrides,
    editInstruction, preserveUnmentioned, repairTargets, repairInstruction,
    editMode, poseTarget, poseNotes, poseLocks,
    referenceStudioView, referenceRecipe, referenceStrengths, poseReferenceAnalysis,
    videoInstruction, videoFrames, videoFps, videoWidth, videoHeight,
    qualityTier, chromaSettings, activeRender,
  ]);

  // Ensure active id is always valid.
  useEffect(() => {
    if (!subjects.length) return;
    if (!activeSubjectId || !subjects.find((s) => s.id === activeSubjectId)) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const activeSubjectIdx = Math.max(0, subjects.findIndex((s) => s.id === activeSubjectId));
  const activeSubject = subjects[activeSubjectIdx] || subjects[0];
  const activeDna = activeSubject?.dna || DEFAULT_DNA;
  const activeFieldLocks = activeSubject?.field_locks || {};
  const primaryDna = subjects[0]?.dna || DEFAULT_DNA;

  // Whenever the user changes cast_size / cast_type in scenario, we may want to auto-add
  // a subject B (only if not already present, and we've truly upgraded to multi-subject).
  const prevPairingRef = useRef("");
  useEffect(() => {
    const key = `${primaryDna?.scenario?.cast_size || "solo"}|${primaryDna?.scenario?.cast_type || "none"}`;
    if (prevPairingRef.current === key) return;
    prevPairingRef.current = key;
    const expected = expectedSubjectCount(primaryDna);
    if (expected > subjects.length && subjects.length < MAX_SUBJECTS) {
      // Auto-add one subject (never more than one at a time — user can add more via UI).
      const seeded = seedSubjectFromPairing(primaryDna, subjects.length);
      const newSub = makeSubject({ label: subjectLabel(subjects.length), dna: seeded });
      setSubjects((cur) => [...cur, newSub]);
      toast.success(`Subject ${newSub.label} added — scenario expects ${expected} subjects`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDna?.scenario?.cast_size, primaryDna?.scenario?.cast_type]);

  const updateActiveSubject = (updater) => {
    setSubjects((cur) => cur.map((s) => (s.id === activeSubjectId ? { ...s, ...updater(s) } : s)));
  };
  const setActiveDna = (newDna) => updateActiveSubject(() => ({ dna: newDna }));
  const setActiveFieldLocks = (newLocks) => updateActiveSubject(() => ({ field_locks: newLocks }));

  const setSection = (key, val) => setActiveDna({ ...activeDna, [key]: val });

  const isMulti = subjects.length > 1;
  const poseInstruction = useMemo(() => buildSameCharacterPoseInstruction({
    poseId: poseTarget,
    notes: poseNotes,
    poseAnalysis: poseReferenceAnalysis,
    locks: poseLocks,
    preservationInstruction: preservationStrengthInstruction(referenceStrengths),
  }), [poseTarget, poseNotes, poseReferenceAnalysis, poseLocks, referenceStrengths]);
  const effectiveEditInstruction = editMode === "new_pose" ? poseInstruction : editInstruction;
  const referenceSummary = useMemo(() => referenceStudioSummary({
    sourceReady: !!referenceImage?.name,
    poseId: poseTarget,
    poseNotes,
    poseAnalysis: poseReferenceAnalysis,
    strengths: referenceStrengths,
  }), [referenceImage?.name, poseTarget, poseNotes, poseReferenceAnalysis, referenceStrengths]);
  const compiledPrompt = useMemo(
    () => {
      // A saved display name is useful in the library, but it is prompt noise
      // when a real likeness LoRA is active. The LoRA trigger owns identity.
      const promptSubjects = subjects.map((subject) => subject?.likeness?.enabled
        ? { ...subject, dna: { ...subject.dna, identity: { ...(subject.dna?.identity || {}), name: "" } } }
        : subject
      );
      const promptActiveDna = activeSubject?.likeness?.enabled
        ? { ...activeDna, identity: { ...(activeDna.identity || {}), name: "" } }
        : activeDna;
      return compileModelPrompts({
        promptStyle,
        workflowKind: activeWorkflow?.kind,
        workflowName: activeWorkflow?.name,
        dna: promptActiveDna,
        subjects: promptSubjects,
        isMulti,
        raunch,
        fieldLocks: activeFieldLocks,
        sectionLocks: locks,
        editInstruction: isEnhanceWorkflow
          ? (repairInstruction || `Repair only these areas: ${repairTargets.join(", ")}`)
          : effectiveEditInstruction,
        videoInstruction,
        preserveUnmentioned,
      });
    },
    [
      subjects, isMulti, activeDna, activeSubject?.likeness?.enabled,
      activeFieldLocks, locks,
      promptStyle, activeWorkflow?.kind, activeWorkflow?.name, raunch,
      effectiveEditInstruction, repairInstruction, repairTargets, videoInstruction, preserveUnmentioned,
      isEnhanceWorkflow,
    ]
  );
  const { positive, negative } = compiledPrompt;
  const likenessPrompt = useMemo(() => likenessTriggerText(subjects), [subjects]);
  const acceptsLikenessPrompt = !["qwen_edit", "wan_i2v"].includes(activeCompiler);
  const languageLead = acceptsLikenessPrompt
    ? promptLanguage === "direct"
      ? "clear literal adult scene description, direct unambiguous vocabulary"
      : promptLanguage === "explicit"
        ? "explicit adult scene, graphic unambiguous vocabulary"
        : "editorial adult photography, tasteful descriptive vocabulary"
    : "";
  const generatedPositive = [languageLead, acceptsLikenessPrompt && likenessPrompt, positive].filter(Boolean).join(", ");
  const positiveBeforeLoraTriggers = promptOverride || generatedPositive;
  const finalPositive = loraTriggerWords.reduce(
    (text, trigger) => text.toLowerCase().includes(trigger.toLowerCase()) ? text : `${trigger}, ${text}`,
    positiveBeforeLoraTriggers
  );
  const finalNegative = negativePromptOverride || negative;
  const preflightContext = useMemo(() => ({
    hasReferenceImage: !!referenceImage?.name,
    hasNegativeOverride: !!negativePromptOverride.trim(),
    editInstruction: isEnhanceWorkflow
      ? (repairInstruction || repairTargets.join(", "))
      : effectiveEditInstruction,
    videoInstruction,
    subjectCount: subjects.length,
  }), [
    referenceImage?.name, negativePromptOverride, isEnhanceWorkflow, repairInstruction,
    repairTargets, effectiveEditInstruction, videoInstruction, subjects.length,
  ]);

  const promptAnalysis = useMemo(() => analyzePromptQuality({
    positive: finalPositive,
    dna: activeDna,
    workflow: activeWorkflow,
    context: preflightContext,
    compilerMeta: compiledPrompt,
  }), [activeDna, activeWorkflow, compiledPrompt, finalPositive, preflightContext]);
  useEffect(() => {
    if (skipNextPromptReset.current) {
      skipNextPromptReset.current = false;
      return;
    }
    setPromptOverride("");
    setNegativePromptOverride("");
  }, [generatedPositive, negative, workflowId]);

  const improveCompiledPrompt = async () => {
    if (!finalPositive.trim()) {
      toast.error("Build a prompt first");
      return;
    }
    setImprovingPrompt(true);
    try {
      const result = await endpoints.aiImproveGeneratedPrompt(
        finalPositive,
        finalNegative,
        activeCompiler,
        activeWorkflow?.name || ""
      );
      setPromptOverride(result.positive || finalPositive);
      setNegativePromptOverride(result.negative || finalNegative);
      toast.success("Venice improved the compiled prompt — review it before rendering");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Venice could not improve the prompt");
    } finally {
      setImprovingPrompt(false);
    }
  };
  const effectiveLoraOverrides = useMemo(
    () => ({ ...loraOverrides, ...likenessOverrides(subjects) }),
    [loraOverrides, subjects]
  );

  const save = useMutation({
    mutationFn: async () => {
      // Persist subjects[]. Also mirror Subject A into dna/field_locks for backward compat.
      const payload = {
        name,
        dna: subjects[0]?.dna || {},
        field_locks: subjects[0]?.field_locks || {},
        subjects: subjects.map((s) => ({ id: s.id, label: s.label, dna: s.dna, field_locks: s.field_locks, likeness: s.likeness })),
        active_subject_id: activeSubjectId,
        locks,
        collapsed,
        tags,
        raunch,
        prompt_language: promptLanguage,
        prompt_positive: finalPositive,
        prompt_negative: finalNegative,
      };
      if (isNew) {
        const created = await endpoints.createCharacter(payload);
        return created;
      }
      return endpoints.updateCharacter(id, payload);
    },
    onSuccess: (c) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["character-tags"] });
      if (isNew && c?.id) nav(`/character/${c.id}/s/${activeSection}`, { replace: true });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const doDispatch = async () => {
    if (!workflowId) {
      toast.error("Pick a workflow first (Settings → Workflow library)");
      return;
    }
    if (promptAnalysis.blockers.length) {
      toast.error(promptAnalysis.blockers[0].message);
      return;
    }
    const incompleteLikeness = subjects.find((subject) => subject?.likeness?.enabled && (!subject.likeness.node_id || !subject.likeness.lora_name));
    if (incompleteLikeness) {
      toast.error(`Finish the Likeness LoRA setup for Subject ${incompleteLikeness.label || "A"}`);
      return;
    }
    if (isFaceWorkflow && !referenceImage?.name) {
      toast.error("Upload a reference photograph before using Face Preserve");
      return;
    }
    if (isEditWorkflow && !referenceImage?.name) {
      toast.error("Upload a source image before using Qwen Image Edit");
      return;
    }
    if (isEnhanceWorkflow && !referenceImage?.name) {
      toast.error("Upload an image before using Image Repair & Enhance");
      return;
    }
    if (isEnhanceWorkflow && repairTargets.length === 0 && !repairInstruction.trim()) {
      toast.error("Choose at least one repair target or write a repair instruction");
      return;
    }
    if (isEditWorkflow && !effectiveEditInstruction.trim()) {
      toast.error(editMode === "new_pose" ? "Choose a pose or describe the new body motion" : "Describe the change you want Qwen to make");
      return;
    }
    if (isVideoWorkflow && !referenceImage?.name) {
      toast.error("Upload a starting image before using WAN Image to Video");
      return;
    }
    if ((isVideoWorkflow || isTextVideoWorkflow) && !videoInstruction.trim()) {
      toast.error(isTextVideoWorkflow
        ? "Describe the video you want WAN to create"
        : "Describe the movement you want WAN to create");
      return;
    }
    setDispatching(true);
    try {
      const requestedCount = activeRecipeFamily === "image" ? renderCount : 1;
      const baseSeed = activeRecipeFamily === "image" && chromaSettings.seed !== ""
        ? Number(chromaSettings.seed)
        : Math.floor(Math.random() * 2147483647);
      const queuedRenders = [];
      for (let imageIndex = 0; imageIndex < requestedCount; imageIndex += 1) {
        const uniqueSeed = (baseSeed + imageIndex) % 2147483647;
        const r = await endpoints.dispatchRender({
        character_id: isNew ? undefined : id,
        // Send primary subject DNA (backward compat) + all subjects for future backend use.
        dna: subjects[0]?.dna || {},
        subjects: subjects.map((s) => ({ label: s.label, dna: s.dna, likeness: s.likeness })),
        prompt_positive: finalPositive,
        prompt_negative: finalNegative,
        workflow_id: workflowId,
        lora_overrides: effectiveLoraOverrides,
        parent_render_id: sourceRenderId || undefined,
        operation: sourceRenderId
          ? (isVideoWorkflow ? "animate" : isFaceWorkflow ? "face_reference" : editMode === "new_pose" ? "new_pose" : "edit")
          : "render",
        width: activeRecipeFamily === "image" ? chromaSettings.width : undefined,
        height: activeRecipeFamily === "image" ? chromaSettings.height : undefined,
        batch_size: activeRecipeFamily === "image" ? 1 : undefined,
        steps: activeRecipeFamily === "image" ? chromaSettings.steps : undefined,
        cfg: activeRecipeFamily === "image" ? chromaSettings.cfg : undefined,
        sampler_name: activeRecipeFamily === "image" ? chromaSettings.sampler : undefined,
        seed: activeRecipeFamily === "image" ? uniqueSeed : undefined,
        reference_image: (isFaceWorkflow || isEditWorkflow || isEnhanceWorkflow || isVideoWorkflow) ? referenceImage?.name : undefined,
        face_strength: faceStrength,
        faceid_v2_strength: faceIdV2Strength,
        edit_instruction: isEnhanceWorkflow
          ? (repairInstruction.trim() || "Correct the selected technical defects naturally.")
          : isEditWorkflow ? finalPositive : undefined,
        preserve_unmentioned: preserveUnmentioned,
        repair_targets: isEnhanceWorkflow ? repairTargets : [],
        repair_strength: repairStrength,
        video_instruction: (isVideoWorkflow || isTextVideoWorkflow) ? finalPositive : undefined,
        video_frames: videoFrames,
        video_fps: videoFps,
        video_width: videoWidth,
        video_height: videoHeight,
      
        });
        queuedRenders.push(r);
        setBatchRenders([...queuedRenders]);
      }
      const latestRender = queuedRenders[queuedRenders.length - 1];
      setBatchRenders(queuedRenders);
      setSelectedBatchRenderId(queuedRenders[0]?.id || null);
      setActiveRender(queuedRenders[0] || latestRender);
      toast.success(requestedCount > 1
        ? `Added ${requestedCount} images to the queue · unique seeds`
        : (latestRender.status === "queued"
          ? `Added to queue${latestRender.queue_position ? ` · position #${latestRender.queue_position}` : ""}`
          : `Render ${latestRender.status}`));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  const clearFinishedRenderSession = () => {
    setActiveRender(null);
    setBatchRenders([]);
    setSelectedBatchRenderId(null);
  };

  const keepFinishedRender = () => {
    clearFinishedRenderSession();
    qc.invalidateQueries({ queryKey: ["renders"] });
    toast.success("Kept in Gallery");
  };

  const queueVariationFromFinishedRender = async () => {
    if (!activeRender) return;
    setPostRenderBusy("variation");
    try {
      const sourceId = activeRender.render_id || activeRender.id;
      const queued = await endpoints.recreateRender(sourceId, true);
      setBatchRenders([queued]);
      setSelectedBatchRenderId(queued.id);
      setActiveRender(queued);
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success("Variation added to the queue", {
        description: queued.queue_position ? `Queue position #${queued.queue_position}` : undefined,
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not queue a variation");
    } finally {
      setPostRenderBusy("");
    }
  };

  const reuseFinishedRender = async (targetKind) => {
    if (!activeRender) return;
    const target = workflows.find((workflow) => workflow.kind === targetKind);
    if (!target) {
      toast.error(`No ${targetKind === "video" ? "image-to-video" : "image-edit"} workflow is configured. Add one in Settings first.`);
      return;
    }
    setPostRenderBusy(targetKind === "video" ? "animate" : "edit");
    try {
      const sourceId = activeRender.render_id || activeRender.id;
      const preview = activeRender.output_files?.[0] || "";
      const reference = await endpoints.prepareRenderReference(sourceId);
      setWorkflowId(target.id);
      setLoraOverrides({});
      setReferenceImage(reference);
      setSourceRenderId(sourceId);
      setReferencePreview(preview);
      setEditMode("standard");
      setEditInstruction("");
      setVideoInstruction("");
      clearFinishedRenderSession();
      setMobileStudioMode("simple");
      setMobileStudioStep("create");
      toast.success(targetKind === "video" ? "Image ready to animate" : "Image ready to edit");
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (error) {
      toast.error(error?.response?.data?.detail || `Could not load image for ${targetKind === "video" ? "animation" : "editing"}`);
    } finally {
      setPostRenderBusy("");
    }
  };

  const returnToCharacterFromResult = () => {
    clearFinishedRenderSession();
    openMobileStudioStep("character");
  };

  // Poll every render from the latest multi-image request so progress and
  // thumbnails update independently as ComfyUI works through the queue.
  useEffect(() => {
    if (batchRenders.length <= 1) return;
    const hasPending = batchRenders.some((render) => !["done", "failed", "offline", "cancelled"].includes(render.status));
    if (!hasPending) return;
    const t = setInterval(async () => {
      const updated = await Promise.all(batchRenders.map(async (render) => {
        if (["done", "failed", "offline", "cancelled"].includes(render.status)) return render;
        try {
          return await endpoints.pollRender(render.id);
        } catch {
          return render;
        }
      }));
      setBatchRenders(updated);
      const selected = updated.find((render) => render.id === selectedBatchRenderId);
      if (selected) setActiveRender(selected);
    }, 2500);
    return () => clearInterval(t);
  }, [batchRenders, selectedBatchRenderId]);

  // Poll active render for output
  useEffect(() => {
    if (!activeRender?.id || ["done", "failed", "offline", "cancelled"].includes(activeRender.status)) return;
    const t = setInterval(async () => {
      try {
        const r = await endpoints.pollRender(activeRender.id);
        setActiveRender(r);
        if (["done", "failed", "offline", "cancelled"].includes(r.status)) clearInterval(t);
      } catch { /* keep polling */ }
    }, 2500);
    return () => clearInterval(t);
  }, [activeRender?.id, activeRender?.status]);

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ name, subjects, locks, tags }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "character").replace(/\s+/g, "_")}.dna.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.name) setName(parsed.name);
        if (Array.isArray(parsed.subjects) && parsed.subjects.length) {
          const subs = subjectsFromCharacter({ subjects: parsed.subjects });
          setSubjects(subs);
          setActiveSubjectId(subs[0].id);
        } else if (parsed.dna) {
          const subs = subjectsFromCharacter({ dna: parsed.dna, field_locks: parsed.field_locks });
          setSubjects(subs);
          setActiveSubjectId(subs[0].id);
        }
        if (parsed.locks) setLocks(parsed.locks);
        if (Array.isArray(parsed.tags)) setTags(parsed.tags);
        toast.success("Imported");
      } catch { toast.error("Invalid JSON"); }
    };
    reader.readAsText(file);
  };

  const runSuggest = async (sectionKey) => {
    try {
      const res = await endpoints.aiSuggest(sectionKey, activeDna);
      const first = res.options?.[0];
      if (first) {
        setSection(sectionKey, { ...(activeDna[sectionKey] || {}), ...first });
        toast.success(`Suggested ${sectionKey}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI suggest failed");
    }
  };

  // -------- Subject switcher actions --------
  const addSubject = () => {
    if (subjects.length >= MAX_SUBJECTS) {
      toast.error(`Max ${MAX_SUBJECTS} subjects`);
      return;
    }
    const seeded = seedSubjectFromPairing(primaryDna, subjects.length);
    const label = subjectLabel(subjects.length);
    const newSub = makeSubject({ label, dna: seeded });
    setSubjects((cur) => [...cur, newSub]);
    setActiveSubjectId(newSub.id);
    toast.success(`Subject ${label} added`);
  };
  const removeSubject = (subjectId) => {
    if (subjects.length <= 1) return;
    setSubjects((cur) => {
      const filtered = cur.filter((s) => s.id !== subjectId);
      // Re-label sequentially so A, B, C stays contiguous
      return filtered.map((s, i) => ({ ...s, label: subjectLabel(i) }));
    });
    // If we removed the active one, snap to Subject A
    if (subjectId === activeSubjectId) setActiveSubjectId(subjects[0].id);
  };
  const copyPrimaryToActive = () => {
    if (activeSubjectIdx === 0) {
      toast.error("Copy target is Subject A itself");
      return;
    }
    const cloneDna = JSON.parse(JSON.stringify(primaryDna));
    // Preserve name — copies shouldn't have the same name field
    cloneDna.identity = { ...cloneDna.identity, name: "" };
    updateActiveSubject(() => ({ dna: cloneDna }));
    toast.success(`Copied Subject A → Subject ${activeSubject.label}`);
  };
  const randomizeActive = () =>
    updateActiveSubject((s) => ({
      dna: randomizeDna(s.dna, { ...locks, kink: true, scenario: true, watersports: true }, s.field_locks),
    }));
  const randomizeAllSubjects = () => {
    const nonPlayLocks = { ...locks, kink: true, scenario: true, watersports: true };
    setSubjects((cur) => cur.map((s) => ({ ...s, dna: randomizeDna(s.dna, nonPlayLocks, s.field_locks) })));
    toast.success(`Randomized ${subjects.length} subject${subjects.length > 1 ? "s" : ""} · Play preserved`);
  };
  const wetDreamActive = () => {
    updateActiveSubject((s) => ({ dna: randomizeWetDream(s.dna, locks) }));
    toast.success(`Wet dream · Subject ${activeSubject.label} 🎲`);
  };

  const resetCharacter = () => {
    const confirmed = window.confirm(
      "Reset this character? This clears all current selections, prompts, tags, locks, and the uploaded reference image. Saved characters and Gallery images will not be deleted."
    );
    if (!confirmed) return;
    clearBuilderDraft(id);
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    const fresh = makeSubject({ label: "A", dna: JSON.parse(JSON.stringify(DEFAULT_DNA)) });
    setName("Untitled");
    setSubjects([fresh]);
    setActiveSubjectId(fresh.id);
    setLocks({});
    setCollapsed({});
    setTags([]);
    setRaunch(false);
    setPromptLanguage("editorial");
    setLoraOverrides({});
    setReferenceImage(null);
    setReferencePreview("");
    setActiveRender(null);
    setBatchRenders([]);
    setSelectedBatchRenderId(null);
    setRenderCount(1);
    setEditInstruction("");
    setEditMode("standard");
    setPoseTarget("");
    setPoseNotes("");
    setPoseLocks(DEFAULT_POSE_LOCKS);
    setReferenceStudioView("simple");
    setReferenceRecipe("balanced");
    setReferenceStrengths(DEFAULT_REFERENCE_STRENGTHS);
    clearPoseReference();
    setRepairTargets(["face", "hands"]);
    setRepairInstruction("");
    setRepairAnalysis("");
    setVideoInstruction("");
    setVideoImageAnalysis("");
    setFaceStrength(1.1);
    setFaceIdV2Strength(1.4);
    setRepairStrength(0.45);
    setPreserveUnmentioned(true);
    setMobileStudioStep("start");
    setChromaSettings({
      width: 768,
      height: 1152,
      steps: 26,
      cfg: 3.8,
      batchSize: 1,
      sampler: "euler",
      seed: "",
    });
    goSection("identity");
    toast.success("Character reset to defaults");
  };

  const expectedCount = expectedSubjectCount(primaryDna);

  const mobileStudioSummary = useMemo(() => {
    const values = [];
    if (mobileStudioStep === "start") {
      values.push(activeDna.identity?.ethnicity, activeDna.identity?.archetype);
      if (activeDna.identity?.age) values.push(`age ${activeDna.identity.age}`);
    } else if (mobileStudioStep === "character") {
      values.push(
        activeDna.physique?.body_type,
        activeDna.hair?.color,
        activeDna.hair?.style,
        activeDna.wardrobe?.outfit_preset
      );
    } else if (mobileStudioStep === "scene") {
      values.push(
        activeDna.pose?.action,
        activeDna.scene?.environment,
        activeDna.lighting?.mood || activeDna.lighting?.style
      );
    } else if (mobileStudioStep === "fine-tune") {
      values.push(activeDna.scenario?.cast_size, activeDna.scenario?.roleplay);
      if ((activeDna.scenario?.explicit_level || 0) > 0) values.push(`explicit ${activeDna.scenario.explicit_level}%`);
      if ((activeDna.scenario?.kink_level || 0) > 0) values.push(`kink ${activeDna.scenario.kink_level}%`);
    } else if (mobileStudioStep === "create") {
      values.push(activeWorkflow?.name, qualityTier);
      if (activeRecipeFamily === "image") values.push(`${renderCount} image${renderCount === 1 ? "" : "s"}`);
    }
    return values.filter((value) => value && value !== "none").slice(0, 4).join(" · ");
  }, [activeDna, activeMobileStudioIndex, activeRecipeFamily, activeWorkflow?.name, mobileStudioStep, qualityTier, renderCount]);

  const mobileCreateSummaries = useMemo(() => {
    const compact = (...values) => values.filter((value) => value && value !== "none").slice(0, 4).join(" · ");
    return {
      character: compact(
        activeDna.identity?.ethnicity,
        activeDna.physique?.body_type,
        activeDna.hair?.color,
        activeDna.wardrobe?.outfit_preset
      ),
      scene: compact(
        activeDna.pose?.action,
        activeDna.scene?.environment,
        activeDna.lighting?.mood || activeDna.lighting?.style,
        activeDna.camera?.aspect_ratio
      ),
      fineTune: compact(
        activeDna.scenario?.cast_size,
        activeDna.scenario?.roleplay,
        (activeDna.scenario?.explicit_level || 0) > 0 ? `explicit ${activeDna.scenario.explicit_level}%` : "",
        (activeDna.scenario?.kink_level || 0) > 0 ? `kink ${activeDna.scenario.kink_level}%` : ""
      ),
    };
  }, [activeDna]);

  const mobileCreateIssues = useMemo(() => {
    const issues = [];
    if (!activeWorkflow) issues.push("Choose a workflow.");
    promptAnalysis.blockers.slice(0, 2).forEach((blocker) => {
      if (blocker?.message && !issues.includes(blocker.message)) issues.push(blocker.message);
    });
    const incompleteLikeness = subjects.find((subject) => subject?.likeness?.enabled && (!subject.likeness.node_id || !subject.likeness.lora_name));
    if (incompleteLikeness) issues.push(`Finish Likeness LoRA setup for Subject ${incompleteLikeness.label || "A"}.`);
    if ((isFaceWorkflow || isEditWorkflow || isEnhanceWorkflow || isVideoWorkflow) && !referenceImage?.name) {
      issues.push(
        isFaceWorkflow ? "Add a face reference image." :
        isVideoWorkflow ? "Add a starting image for the video." :
        isEnhanceWorkflow ? "Add the image you want to repair." :
        "Add the source image you want to edit."
      );
    }
    if (isEnhanceWorkflow && repairTargets.length === 0 && !repairInstruction.trim()) {
      issues.push("Choose a repair target or write a repair instruction.");
    }
    if (isEditWorkflow && !effectiveEditInstruction.trim()) {
      issues.push(editMode === "new_pose" ? "Choose a new pose or describe the motion." : "Describe the image edit you want.");
    }
    if ((isVideoWorkflow || isTextVideoWorkflow) && !videoInstruction.trim()) {
      issues.push(isTextVideoWorkflow ? "Describe the video you want to create." : "Describe how you want the image to move.");
    }
    return [...new Set(issues)];
  }, [
    activeWorkflow, editMode, effectiveEditInstruction,
    isEditWorkflow, isEnhanceWorkflow, isFaceWorkflow, isTextVideoWorkflow, isVideoWorkflow,
    promptAnalysis, referenceImage?.name, repairInstruction, repairTargets, subjects, videoInstruction,
  ]);

  const batchIsFinished = batchRenders.length <= 1 || batchRenders.every((render) =>
    ["done", "failed", "offline", "cancelled"].includes(render.status)
  );
  const showMobileResult = mobileStudioStep === "create"
    && mobileStudioMode === "simple"
    && activeRender?.status === "done"
    && !!activeRender.output_files?.[0]
    && batchIsFinished;

  return (
    <div className="mx-auto max-w-[1600px] px-2.5 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="pane p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            data-testid="input-character-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-elevated border-hairline text-base sm:text-lg font-display font-bold"
          />
          <div className="flex flex-wrap gap-2">
          <select
            data-testid="select-workflow"
            value={workflowId}
            onChange={(e) => { setWorkflowId(e.target.value); setLoraOverrides({}); }}
            className={`${mobileStudioStep === "start" || (mobileStudioStep === "create" && mobileStudioMode === "advanced") ? "block" : "hidden md:block"} bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100 w-full sm:w-auto sm:min-w-[200px]`}
          >
            {workflows.length === 0 && <option value="">No workflows — open Settings</option>}
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>{w.kind.toUpperCase()} · {w.name}</option>
            ))}
          </select>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            data-testid="btn-save-character"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          {activeRecipeFamily === "image" && (
            <select
              data-testid="select-render-count"
              value={renderCount}
              onChange={(e) => setRenderCount(Number(e.target.value))}
              disabled={dispatching}
              className="hidden md:block bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100 flex-1 sm:flex-none"
              title="Number of images to queue with unique seeds"
            >
              {[1, 2, 4, 6, 8, 10].map((count) => (
                <option key={count} value={count}>{count} image{count > 1 ? "s" : ""}</option>
              ))}
            </select>
          )}
          <button
            onClick={doDispatch}
            disabled={dispatching || !workflowId}
            data-testid="btn-dispatch-comfyui-render"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Render
          </button>
          <MobileOverflow testId="builder-overflow" always label="More">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              data-testid="btn-save-character-mobile-menu"
              className="md:hidden inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 disabled:opacity-40"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save character
            </button>
            <button
              type="button"
              onClick={resetCharacter}
              data-testid="btn-reset-character"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
              title="Reset all current character selections"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={randomizeAllSubjects}
              data-testid="btn-randomize-all"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
              title={isMulti ? `Randomize all ${subjects.length} subjects` : "Randomize DNA"}
            >
              <Shuffle className="h-4 w-4" /> {isMulti ? "Randomize all" : "Randomize"}
            </button>
            <button
              onClick={wetDreamActive}
              data-testid="btn-randomize-wet-dream"
              title={isMulti ? `Wet dream on Subject ${activeSubject.label}` : "Spin feet + kink + watersports + fluids + explicit/kink dials"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-500/15 to-amber-500/15 text-fuchsia-100 hover:from-fuchsia-500/25 hover:to-amber-500/25 text-sm font-semibold px-3 py-2"
            >
              <Sparkles className="h-4 w-4" /> Wet dream{isMulti ? ` · ${activeSubject.label}` : ""}
            </button>
            <PresetsMenu
              currentDna={activeDna}
              sectionLocks={locks}
              fieldLocks={activeFieldLocks}
              onApply={(preset, context = {}) => {
                const next = { ...preset };
                Object.keys(locks).forEach((k) => { if (locks[k]) next[k] = activeDna[k]; });
                if (context.type === "heritage") {
                  const cast = HERITAGE_CASTS[context.cast] || HERITAGE_CASTS.solo;
                  const primaryDna = {
                    ...next,
                    scenario: {
                      ...(next.scenario || {}),
                      cast_size: cast.castSize,
                      cast_type: cast.castType,
                    },
                  };
                  const primary = {
                    ...(subjects[0] || activeSubject),
                    label: "A",
                    dna: primaryDna,
                  };
                  if (context.cast === "solo") {
                    setSubjects([primary]);
                    setActiveSubjectId(primary.id);
                  } else {
                    const relativeDna = seedSubjectFromPairing(primaryDna, 1);
                    const relative = makeSubject({ label: "B", dna: relativeDna });
                    setSubjects([primary, relative]);
                    setActiveSubjectId(primary.id);
                  }
                  toast.success(`${cast.label} heritage cast created`);
                } else {
                  setActiveDna(next);
                  toast.success(`Preset applied to Subject ${activeSubject.label}`);
                }
              }}
            />
            <KinkPresetsMenu
              currentDna={activeDna}
              onApply={(next) => {
                const merged = { ...next };
                Object.keys(locks).forEach((k) => { if (locks[k]) merged[k] = activeDna[k]; });
                setActiveDna(merged);
              }}
            />
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-elevated px-2 py-1 text-sm text-zinc-300" title="Changes prompt vocabulary only; it never adds activities or changes DNA selections.">
              <Flame className="h-4 w-4 text-fuchsia-300" />
              <span className="hidden sm:inline text-xs">Language</span>
              <select value={promptLanguage}
                onChange={(event) => {
                  const value = event.target.value;
                  setPromptLanguage(value);
                  setRaunch(value === "explicit");
                }}
                className="bg-transparent text-xs font-semibold outline-none"
                data-testid="select-prompt-language">
                <option value="editorial">Editorial</option>
                <option value="direct">Direct</option>
                <option value="explicit">Explicit</option>
              </select>
            </label>
            {!isNew && (
              <Link
                to={`/shoot/new/${id}`}
                data-testid="btn-open-shoot"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm font-semibold px-3 py-2 hover:bg-emerald-500/20"
                title="Batch photo shoot"
              >
                <Camera className="h-4 w-4" /> Shoot
              </Link>
            )}
            <button
              onClick={exportJson}
              data-testid="btn-export-json"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300"
              title="Export DNA JSON"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <label
              data-testid="btn-import-json"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-sm text-zinc-300 cursor-pointer"
              title="Import DNA JSON"
            >
              <Upload className="h-4 w-4" /> Import
              <input type="file" accept="application/json" onChange={importJson} className="hidden" />
            </label>
          </MobileOverflow>
        </div>
        </div>
        <div className={mobileStudioStep === "start" ? "block" : "hidden md:block"}>
          <TagInput value={tags} onChange={setTags} placeholder="tag this character (mood, ethnicity, persona)…" testId="builder-tags" />
        </div>
      </div>

      <MobileStudioFlow
        currentStep={mobileStudioStep}
        activeSection={activeSection}
        locks={locks}
        sections={SECTIONS}
        mode={mobileStudioMode}
        summary={mobileStudioSummary}
        onModeChange={changeMobileStudioMode}
        onStep={openMobileStudioStep}
        onSection={(key) => {
          setMobileStudioStep(mobileStudioStepForSection(key));
          goSection(key);
        }}
      />

      {mobileStudioStep === "create" && !showMobileResult && (
        <>
          <MobileCreateReview
            workflow={activeWorkflow}
            compiler={activeCompiler}
            family={activeRecipeFamily}
            qualityTier={qualityTier}
            onQualityTier={applyQualityTier}
            renderCount={renderCount}
            onRenderCount={setRenderCount}
            summaries={mobileCreateSummaries}
            issues={mobileCreateIssues}
            mode={mobileStudioMode}
            onRequestAdvanced={() => setMobileStudioMode("advanced")}
          />
          <PromptAlignmentCard
            analysis={promptAnalysis}
            priorityPlan={compiledPrompt.priorityPlan}
            adjustments={compiledPrompt.guardAdjustments || []}
            mode={mobileStudioMode}
          />
        </>
      )}

      {showMobileResult && (
        <MobileRenderResult
          render={activeRender}
          batch={batchRenders}
          selectedId={selectedBatchRenderId}
          onSelect={(render) => {
            setSelectedBatchRenderId(render.id);
            setActiveRender(render);
          }}
          onKeep={keepFinishedRender}
          onVariation={queueVariationFromFinishedRender}
          onEdit={() => reuseFinishedRender("edit")}
          onAnimate={() => reuseFinishedRender("video")}
          onBackCharacter={returnToCharacterFromResult}
          onGallery={() => nav(`/gallery?render=${encodeURIComponent(activeRender.render_id || activeRender.id)}&returnTo=${encodeURIComponent(location.pathname)}`)}
          onDownload={(url) => downloadRenderImage(
            url,
            `render-${activeRender.render_id || activeRender.id}.${/\.(webm|mp4|mov)(?:[?&]|$)/i.test(decodeURIComponent(url)) ? "webm" : "png"}`
          )}
          busy={postRenderBusy}
        />
      )}

      <div className={(showMobileResult ? "hidden " : "md:hidden ") + "fixed inset-x-0 z-30 mobile-builder-actions border-t hairline bg-[#111017]/95 px-2.5 py-2 backdrop-blur-xl shadow-[0_-12px_30px_rgba(0,0,0,0.28)]"} data-testid="mobile-builder-actions">
        <div className="grid grid-cols-[0.9fr_1.4fr] gap-2">
          <button
            type="button"
            onClick={() => moveMobileStudioStep(-1)}
            disabled={activeMobileStudioIndex === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border hairline py-3 text-sm font-semibold text-zinc-200 disabled:opacity-30"
            aria-label="Previous Studio step"
            data-testid="btn-mobile-studio-back"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {mobileStudioStep === "create" ? (
            <button
              type="button"
              onClick={doDispatch}
              disabled={dispatching || !workflowId || mobileCreateIssues.length > 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black disabled:opacity-40"
              data-testid="btn-mobile-studio-render"
            >
              {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Render
            </button>
          ) : (
            <button
              type="button"
              onClick={() => moveMobileStudioStep(1)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black"
              data-testid="btn-mobile-studio-continue"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={mobileStudioStep === "create" ? "block" : "hidden md:block"}>
        {activeWorkflow && (activeCompiler !== "qwen_edit" || isEnhanceWorkflow) && (
          <div className="hidden md:block">
            <RenderRecipeSelector
              compiler={activeCompiler}
              value={qualityTier}
              onChange={applyQualityTier}
            />
          </div>
        )}

        {isGoldenChroma && (
          <div className={(mobileStudioMode === "advanced" ? "block " : "hidden md:block ") + "mt-3 sm:mt-4"}>
            <ChromaControls value={chromaSettings} onChange={setChromaSettings} />
          </div>
        )}
      </div>

      {/* Subject controls stay available, but stay out of Simple Create review. */}
      <div className={mobileStudioStep === "create" && mobileStudioMode === "simple" ? "hidden md:block" : "block"}>
        <SubjectSwitcher
          subjects={subjects}
          activeId={activeSubjectId}
          expectedCount={expectedCount}
          primaryLabel={subjects[0]?.label || "A"}
          onSelect={setActiveSubjectId}
          onAdd={addSubject}
          onRemove={removeSubject}
          onCopyFromPrimary={copyPrimaryToActive}
          onRandomizeActive={randomizeActive}
        />
      </div>

      <div className={mobileStudioStep === "create" && mobileStudioMode === "advanced" ? "space-y-2" : "hidden md:block md:space-y-2"}>
        <div className="pane px-3 py-2 flex items-center gap-2" data-testid="glance-header">
          <button
            type="button"
            onClick={() => setCollapsed((cur) => ({ ...cur, _glance: !cur._glance }))}
            data-testid="btn-collapse-glance"
            className="flex items-center gap-2 text-left flex-1 group"
          >
            <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-transform ${collapsed._glance ? "-rotate-90" : ""}`} />
            <span className="section-label">DNA at a glance{isMulti ? ` · ${subjects.length} subjects` : ""}</span>
          </button>
        </div>
        {!collapsed._glance && <DnaAtAGlance dna={activeDna} name={name} subjects={isMulti ? subjects : undefined} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-4">
        {/* Left rail - grouped-by-phase section nav (uses active subject's dna for filled dots) */}
        <aside className="hidden lg:block h-fit sticky top-20">
          <GroupedSectionRail
            dna={activeDna}
            locks={locks}
            activeSection={activeSection}
            onSelect={(key) => nav(sectionUrl(key))}
            testIdPrefix="nav-section"
          />
        </aside>

        {/* Mobile section chips — grouped by phase */}
        <div className="hidden md:flex lg:hidden overflow-x-auto scroll-fade -mx-3 px-3 gap-2 pb-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              to={sectionUrl(s.key)}
              data-testid={`nav-section-${s.key}-mobile`}
              className={`chip chip-${phaseOfSection(s.key)} whitespace-nowrap ${activeSection === s.key ? "active" : ""}`}
            >
              {s.title}{locks[s.key] && " 🔒"}
            </Link>
          ))}
        </div>

        {/* Center - single active section */}
        <div className={`${mobileStudioStep === "create" ? "hidden md:block" : "block"} space-y-4`}>
          <div className="hidden md:flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Step {activeIdx + 1} of {SECTIONS.length}{isMulti && ` · Subject ${activeSubject.label}`}</span>
            <span className={`uppercase tracking-widest section-label phase-${phaseOfSection(activeSection)}`}>{SECTIONS[activeIdx].title}</span>
          </div>
          <div className="hidden md:block h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${((activeIdx + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>
          <DnaSection
            key={`${activeSubjectId}-${activeSection}`}
            section={SECTIONS[activeIdx]}
            value={activeDna[activeSection] || {}}
            onChange={(v) => setSection(activeSection, v)}
            locked={!!locks[activeSection]}
            onToggleLock={() => setLocks({ ...locks, [activeSection]: !locks[activeSection] })}
            onRandomize={() => setSection(activeSection, randomizeSection(activeSection, activeDna[activeSection] || {}, activeFieldLocks[activeSection] || {}))}
            onReset={() => setSection(activeSection, resetSection(activeSection))}
            onSuggest={() => runSuggest(activeSection)}
            fieldLocks={activeFieldLocks[activeSection] || {}}
            onToggleFieldLock={(fieldKey) => setActiveFieldLocks({
              ...activeFieldLocks,
              [activeSection]: { ...(activeFieldLocks[activeSection] || {}), [fieldKey]: !(activeFieldLocks[activeSection] || {})[fieldKey] },
            })}
            collapsed={!!collapsed[activeSection]}
            onToggleCollapsed={() => setCollapsed((cur) => ({ ...cur, [activeSection]: !cur[activeSection] }))}
            simpleMode={mobileStudioMode === "simple"}
            simpleFieldKeys={SIMPLE_FIELD_KEYS[activeSection] || []}
            onRequestAdvanced={() => setMobileStudioMode("advanced")}
          />
          <div className="hidden md:flex items-center justify-between gap-2">
            <button
              onClick={() => activeIdx > 0 && goSection(SECTIONS[activeIdx - 1].key)}
              disabled={activeIdx === 0}
              data-testid="btn-section-prev"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> {activeIdx > 0 ? SECTIONS[activeIdx - 1].title : "Prev"}
            </button>
            {activeIdx < SECTIONS.length - 1 ? (
              <button
                onClick={() => goSection(SECTIONS[activeIdx + 1].key)}
                data-testid="btn-section-next"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5"
              >
                {SECTIONS[activeIdx + 1].title} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => save.mutate()}
                data-testid="btn-section-finish"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2.5"
              >
                Finish & Save <Save className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right - preview + AI + render */}
        <aside className={`${mobileStudioStep === "create" ? "block" : "hidden md:block"} space-y-4 lg:sticky lg:top-20 lg:h-fit`}>
          <div className={mobileStudioMode === "advanced" ? "block" : "hidden md:block"}>
            <SmartSetupPanel workflows={workflows} activeWorkflow={activeWorkflow} dna={activeDna}
              subjectCount={subjects.length} hasReference={!!referenceImage?.name} onApply={applySmartSetup} />
          </div>
          <div className={mobileStudioMode === "advanced" ? "block" : "hidden md:block"}>
          <PromptPreview
            positive={finalPositive}
            negative={finalNegative}
            dna={activeDna}
            workflow={activeWorkflow}
            context={preflightContext}
            optimized={!!promptOverride}
            improving={improvingPrompt}
            onImprove={improveCompiledPrompt}
            onOptimize={(cleaned) => {
              setPromptOverride(cleaned);
              toast.success("Safe prompt cleanup applied");
            }}
            onRestore={() => {
              setPromptOverride("");
              setNegativePromptOverride("");
              toast.success("Generated prompt restored");
            }}
          />
          </div>
          {activeWorkflow && promptStyle === "pony" && (
            <div className={`${mobileStudioMode === "advanced" ? "flex" : "hidden md:flex"} pane p-3 items-center gap-2`} data-testid="pony-style-badge">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 bg-rose-500/10 border border-rose-500/40 rounded px-1.5 py-0.5">pony style</span>
              <span className="text-[11px] text-zinc-400">score_9 prefix + booru tag weighting enabled</span>
            </div>
          )}
          {isVideoWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="wan-video-panel">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-300" />
                <div className="section-label">WAN Image → Video</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload the starting frame, then describe movement rather than redesigning the image.
              </p>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="WAN starting frame" className="w-full max-h-72 object-contain" />
                  <button type="button" onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove WAN starting image" data-testid="btn-remove-wan-source">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 px-4 py-5 text-center hover:bg-emerald-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-300" /> : <Upload className="h-6 w-6 text-emerald-300" />}
                  <span className="text-sm font-semibold text-emerald-100">
                    {referenceUploading ? "Uploading…" : "Choose starting image"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden" data-testid="input-wan-source" />
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Movement instruction</span>
                <Textarea rows={5} value={videoInstruction}
                  onChange={(event) => setVideoInstruction(event.target.value)}
                  placeholder="Example: She slowly turns toward the camera and smiles. Natural blinking and breathing, gentle hair movement, steady camera."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-wan-motion" />
              </label>
              <button type="button" onClick={analyzeVideoImage}
                disabled={analyzingVideoImage || !referenceImage?.name}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
                data-testid="btn-venice-analyze-video-image">
                {analyzingVideoImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze image + draft motion with Venice
              </button>
              {videoImageAnalysis && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-mono uppercase tracking-widest text-cyan-300">Venice image analysis</div>
                  {videoImageAnalysis}
                </div>
              )}
              <button type="button" onClick={enhanceVideoInstruction}
                disabled={enhancingVideo || !videoInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-video">
                {enhancingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Enhance movement with Venice
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <select value={videoFrames} onChange={(e) => setVideoFrames(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-duration">
                    <option value={41}>1.7 sec · 41 frames</option>
                    <option value={81}>3.4 sec · 81 frames</option>
                    <option value={121}>5 sec · 121 frames</option>
                    <option value={161}>6.7 sec · 161 frames</option>
                    <option value={201}>8.4 sec · 201 frames</option>
                    <option value={241}>10 sec · 241 frames</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Playback FPS</span>
                  <select value={videoFps} onChange={(e) => setVideoFps(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-fps">
                    <option value={16}>16 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                  </select>
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                Longer clips require substantially more VRAM and generation time. Start with 41 frames for testing.
              </p>
            </div>
          )}
          {isTextVideoWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="wan-text-video-panel">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-violet-300" />
                <div className="section-label">WAN Text → Video</div>
              </div>
              <p className="text-xs text-zinc-400">
                Describe the complete shot: adult subject, action, environment, lighting, framing, and camera motion. No starting image is required.
              </p>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Video description</span>
                <Textarea rows={7} value={videoInstruction}
                  onChange={(event) => setVideoInstruction(event.target.value)}
                  placeholder="Example: A cinematic full-body shot of an adult woman walking through a softly lit hotel suite, natural body movement, gentle handheld camera, stable identity, one continuous shot."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-wan-text-video" />
              </label>
              <button type="button" onClick={enhanceVideoInstruction}
                disabled={enhancingVideo || !videoInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-text-video">
                {enhancingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Expand scene with Venice
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <select value={videoFrames} onChange={(e) => setVideoFrames(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-t2v-duration">
                    <option value={41}>2.6 sec · 41 frames</option>
                    <option value={81}>5.1 sec · 81 frames</option>
                    <option value={121}>7.6 sec · 121 frames</option>
                    <option value={161}>10 sec · 161 frames</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">Playback FPS</span>
                  <select value={videoFps} onChange={(e) => setVideoFps(Number(e.target.value))}
                    className="w-full rounded-lg border border-hairline bg-elevated px-3 py-2 text-sm"
                    data-testid="select-wan-t2v-fps">
                    <option value={16}>16 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={24}>24 FPS</option>
                  </select>
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                This 14B workflow is much heavier than the 5B Image → Video workflow. Test with 41 frames first.
              </p>
            </div>
          )}
          {isEnhanceWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="image-repair-panel">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <div className="section-label">Image Repair & Enhance</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload an image, select only the areas that need correction, and optionally let Venice inspect it before Qwen performs the repair.
              </p>
              {referencePreview ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Original</div>
                    <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                      <img src={referencePreview} alt="Original for repair" className="w-full max-h-80 object-contain" />
                      <button type="button" onClick={clearReference}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                        aria-label="Remove repair image" data-testid="btn-remove-repair-source">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {activeRender?.status === "done" && activeRender.output_files?.[0] && (
                    <div>
                      <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">Repaired result</div>
                      <img src={activeRender.output_files[0]} alt="Repaired result"
                        className="w-full max-h-80 rounded-lg border hairline bg-elevated object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 px-4 py-6 text-center hover:bg-cyan-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : <Upload className="h-6 w-6 text-cyan-300" />}
                  <span className="text-sm font-semibold text-cyan-100">
                    {referenceUploading ? "Uploading…" : "Choose image to repair"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden" data-testid="input-repair-source" />
                </label>
              )}
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">Repair targets</div>
                <div className="flex flex-wrap gap-2">
                  {REPAIR_TARGETS.map(([value, label]) => (
                    <button type="button" key={value} onClick={() => toggleRepairTarget(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        repairTargets.includes(value)
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                          : "border-hairline bg-elevated text-zinc-400 hover:text-zinc-200"
                      }`}
                      data-testid={`repair-target-${value}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Repair strength</span>
                  <span className="font-mono text-cyan-300">{Math.round(repairStrength * 100)}%</span>
                </div>
                <input type="range" min="0.2" max="0.85" step="0.05" value={repairStrength}
                  onChange={(event) => setRepairStrength(Number(event.target.value))}
                  className="w-full accent-cyan-400" data-testid="slider-repair-strength" />
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Subtle preservation</span><span>Stronger reconstruction</span>
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Repair instruction</span>
                <Textarea rows={6} value={repairInstruction}
                  onChange={(event) => setRepairInstruction(event.target.value)}
                  placeholder="Optional: describe a specific defect or leave this blank and ask Venice to inspect the selected areas."
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-repair-instruction" />
              </label>
              <button type="button" onClick={analyzeRepairImage}
                disabled={analyzingRepair || !referenceImage?.name}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
                data-testid="btn-venice-analyze-repair">
                {analyzingRepair ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Inspect image and draft repair with Venice
              </button>
              {repairAnalysis && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-mono uppercase tracking-widest text-cyan-300">Venice inspection</div>
                  {repairAnalysis}
                </div>
              )}
              <p className="text-[11px] text-zinc-500">
                The repair prompt always preserves identity, age, body shape, pose, clothing, environment, and camera framing unless you explicitly request a change.
              </p>
            </div>
          )}
          {isEditWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="qwen-edit-panel">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-cyan-300" />
                <div className="section-label">Qwen Image Edit</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload the image you want to change, then describe only the changes you want made.
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-lg border hairline bg-elevated p-1" role="tablist" aria-label="Qwen edit mode">
                <button type="button" onClick={() => setEditMode("standard")}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${editMode === "standard" ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-400 hover:text-zinc-200"}`}
                  data-testid="btn-edit-mode-standard">
                  Standard edit
                </button>
                <button type="button" onClick={() => { setEditMode("new_pose"); setPreserveUnmentioned(true); }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${editMode === "new_pose" ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-400 hover:text-zinc-200"}`}
                  data-testid="btn-edit-mode-new-pose">
                  Same character · New pose
                </button>
              </div>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="Source for editing" className="w-full max-h-72 object-contain" />
                  <button type="button" onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove source image" data-testid="btn-remove-edit-source">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 px-4 py-5 text-center hover:bg-cyan-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : <Upload className="h-6 w-6 text-cyan-300" />}
                  <span className="text-sm font-semibold text-cyan-100">
                    {referenceUploading ? "Uploading…" : "Choose source image"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden" data-testid="input-qwen-edit-source" />
                </label>
              )}
              {editMode === "standard" ? (
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Edit instruction</span>
                  <Textarea rows={5} value={editInstruction}
                    onChange={(event) => setEditInstruction(event.target.value)}
                    placeholder="Example: Change the black dress to a red satin evening gown. Keep her face, pose, body, lighting, and background unchanged."
                    className="bg-elevated border-hairline text-sm"
                    data-testid="textarea-qwen-edit-instruction" />
                </label>
              ) : (
                <div className="space-y-4" data-testid="same-character-pose-panel">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
                    <div>
                      <div className="text-xs font-bold text-cyan-100">Reference Studio</div>
                      <div className="text-[10px] text-zinc-500">Same person, controlled motion</div>
                    </div>
                    <div className="flex rounded-md border hairline bg-black/20 p-0.5">
                      {[["simple", "Simple"], ["advanced", "Advanced"]].map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setReferenceStudioView(value)}
                          className={`rounded px-2.5 py-1.5 text-[11px] font-semibold ${referenceStudioView === value ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-500"}`}
                          data-testid={`btn-reference-view-${value}`}>
                          {value === "advanced" && <SlidersHorizontal className="mr-1 inline h-3 w-3" />}{label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">Preservation recipe</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {REFERENCE_RECIPES.map((recipe) => (
                        <button key={recipe.id} type="button" onClick={() => {
                          setReferenceRecipe(recipe.id);
                          setReferenceStrengths(recipe.strengths);
                        }}
                          className={`rounded-lg border p-3 text-left ${referenceRecipe === recipe.id ? "border-cyan-400 bg-cyan-500/10" : "border-hairline hover:bg-white/5"}`}
                          data-testid={`btn-reference-recipe-${recipe.id}`}>
                          <div className="text-xs font-bold text-zinc-100">{recipe.label}</div>
                          <div className="mt-1 text-[10px] leading-snug text-zinc-500">{recipe.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">Choose a new pose</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SAME_CHARACTER_POSES.map((pose) => (
                        <button key={pose.id} type="button" onClick={() => setPoseTarget(pose.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs ${poseTarget === pose.id ? "border-cyan-400 bg-cyan-500/15 text-cyan-100" : "border-hairline text-zinc-300 hover:bg-white/5"}`}
                          data-testid={`btn-pose-${pose.id}`}>
                          {pose.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed border-violet-500/35 bg-violet-500/5 p-3 space-y-3">
                    <div>
                      <div className="text-xs font-bold text-violet-100">Optional pose-reference image</div>
                      <div className="mt-0.5 text-[10px] text-zinc-500">Use a second image for body positioning only. Its identity, body type, outfit, and setting are ignored.</div>
                    </div>
                    {poseReferencePreview ? (
                      <div className="grid grid-cols-[96px_1fr] gap-3 items-center">
                        <div className="relative overflow-hidden rounded-md border hairline">
                          <img src={poseReferencePreview} alt="Pose reference" className="h-24 w-24 object-cover" />
                          <button type="button" onClick={clearPoseReference}
                            className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white" aria-label="Remove pose reference">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <button type="button" onClick={analyzePoseReference}
                          disabled={analyzingPoseReference}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 disabled:opacity-40"
                          data-testid="btn-analyze-pose-reference">
                          {analyzingPoseReference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {poseReferenceAnalysis ? "Analyze pose again" : "Extract pose with Venice"}
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-violet-500/30 px-3 py-4 text-xs font-semibold text-violet-100 hover:bg-violet-500/10">
                        {poseReferenceUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {poseReferenceUploading ? "Uploading…" : "Choose pose image"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={poseReferenceUploading}
                          onChange={(event) => uploadPoseReference(event.target.files?.[0])}
                          className="hidden" data-testid="input-pose-reference" />
                      </label>
                    )}
                    {poseReferenceAnalysis && (
                      <div className="rounded-md border border-violet-500/20 bg-black/15 p-2 text-[11px] leading-relaxed text-zinc-300" data-testid="pose-reference-analysis">
                        <span className="font-semibold text-violet-200">Extracted pose: </span>{poseReferenceAnalysis}
                      </div>
                    )}
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Pose details (optional)</span>
                    <Textarea rows={3} value={poseNotes}
                      onChange={(event) => setPoseNotes(event.target.value)}
                      placeholder="Example: left hand resting on the chair, right foot slightly forward, looking toward camera"
                      className="bg-elevated border-hairline text-sm"
                      data-testid="textarea-pose-notes" />
                  </label>
                  {referenceStudioView === "advanced" && <div>
                    <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">Preservation strengths</div>
                    <div className="space-y-2 rounded-lg border hairline p-3">
                      {Object.entries({ face: "Face & identity", body: "Body shape", clothing: "Outfit", background: "Scene", lighting: "Lighting" }).map(([key, label]) => (
                        <label key={key} className="grid grid-cols-[90px_1fr_38px] items-center gap-2 text-[11px] text-zinc-300">
                          <span>{label}</span>
                          <input type="range" min="0" max="100" step="5" value={referenceStrengths[key]}
                            onChange={(event) => {
                              setReferenceRecipe("custom");
                              setReferenceStrengths((current) => ({ ...current, [key]: Number(event.target.value) }));
                            }} className="accent-cyan-400" data-testid={`range-reference-${key}`} />
                          <span className="text-right font-mono text-cyan-200">{referenceStrengths[key]}%</span>
                        </label>
                      ))}
                    </div>
                  </div>}
                  {referenceStudioView === "advanced" && <div>
                    <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">Keep unchanged</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries({
                        face: "Face & identity", hair: "Hair", skin: "Skin & markings", body: "Body shape",
                        clothing: "Clothing", expression: "Expression", background: "Background", lighting: "Lighting & style",
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300">
                          <input type="checkbox" checked={poseLocks[key] !== false}
                            onChange={(event) => setPoseLocks((current) => ({ ...current, [key]: event.target.checked }))}
                            className="accent-cyan-400" data-testid={`checkbox-pose-lock-${key}`} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>}
                  {referenceStudioView === "advanced" && poseInstruction && (
                    <details className="rounded-lg border hairline bg-black/10 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-cyan-200">Review protected edit instruction</summary>
                      <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400">{poseInstruction}</p>
                    </details>
                  )}
                  <p className="text-[11px] text-zinc-500">
                    The character image owns identity and appearance. A pose-reference image contributes only body positioning.
                  </p>
                </div>
              )}
              {editMode === "standard" && <label className="flex items-start gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={preserveUnmentioned}
                  onChange={(event) => setPreserveUnmentioned(event.target.checked)}
                  className="mt-0.5 accent-cyan-400"
                  data-testid="checkbox-preserve-unmentioned" />
                <span>Preserve identity, composition, and every detail I did not ask to change</span>
              </label>}
              {editMode === "new_pose" && (
                <div className={`rounded-lg border p-3 ${referenceSummary.ready ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`} data-testid="reference-studio-summary">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {referenceSummary.ready ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                    <span className={referenceSummary.ready ? "text-emerald-100" : "text-amber-100"}>{referenceSummary.headline}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-zinc-400">
                    {referenceSummary.details.map((detail) => <div key={detail}>• {detail}</div>)}
                  </div>
                  {referenceSummary.warnings.map((warning) => <div key={warning} className="mt-2 text-[10px] text-amber-200">⚠ {warning}</div>)}
                </div>
              )}
              {editMode === "standard" && <button type="button" onClick={enhanceEditInstruction}
                disabled={enhancingEdit || editMode === "new_pose" || !editInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-edit">
                {enhancingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {editMode === "new_pose" ? "Protected pose instruction active" : "Enhance instruction with Venice"}
              </button>}
              {editMode === "standard" && <p className="text-[11px] text-zinc-500">
                Venice only rewrites the instruction. Review and edit it before rendering.
              </p>}
            </div>
          )}
          {isFaceWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="face-reference-panel">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-amber-400" />
                <div className="section-label">Face Preserve Reference</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload a clear photograph of one adult face. The photo is sent directly to your local ComfyUI input folder.
              </p>
              {referencePreview ? (
                <div className="relative rounded-lg overflow-hidden border hairline bg-elevated">
                  <img src={referencePreview} alt="Face reference" className="w-full max-h-72 object-contain" />
                  <button
                    type="button"
                    onClick={clearReference}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-zinc-100 hover:bg-red-500"
                    aria-label="Remove reference photograph"
                    data-testid="btn-remove-face-reference"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-5 text-center hover:bg-amber-500/10">
                  {referenceUploading ? <Loader2 className="h-6 w-6 animate-spin text-amber-300" /> : <Upload className="h-6 w-6 text-amber-300" />}
                  <span className="text-sm font-semibold text-amber-100">
                    {referenceUploading ? "Uploading…" : "Choose reference photograph"}
                  </span>
                  <span className="text-[11px] text-zinc-500">JPG, PNG, or WEBP · maximum 20 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={referenceUploading}
                    onChange={(event) => uploadReference(event.target.files?.[0])}
                    className="hidden"
                    data-testid="input-face-reference"
                  />
                </label>
              )}
              <label className="block space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Identity strength</span><span className="font-mono text-amber-300">{faceStrength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="1.8" step="0.05" value={faceStrength}
                  onChange={(e) => setFaceStrength(Number(e.target.value))} className="w-full accent-amber-400"
                  data-testid="slider-face-strength" />
              </label>
              <label className="block space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>FaceID v2 strength</span><span className="font-mono text-amber-300">{faceIdV2Strength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="1.8" step="0.05" value={faceIdV2Strength}
                  onChange={(e) => setFaceIdV2Strength(Number(e.target.value))} className="w-full accent-amber-400"
                  data-testid="slider-faceid-v2-strength" />
              </label>
            </div>
          )}
          <div className={`${mobileStudioMode === "advanced" ? "contents" : "hidden md:contents"}`}>
            <LikenessLoraPanel
              workflowId={workflowId}
              subject={activeSubject}
              onChange={(likeness) => updateActiveSubject(() => ({ likeness }))}
            />
            <LoraPanel
              workflowId={workflowId}
              workflow={activeWorkflow}
              dna={activeDna}
              values={loraOverrides}
              onChange={setLoraOverrides}
              onPlanChange={(plan) => setLoraTriggerWords(plan.triggerWords || [])}
            />
            <AiAssistBar dna={activeDna} onApplyDna={(d) => setActiveDna({ ...DEFAULT_DNA, ...d })} />
          </div>
          {batchRenders.length > 1 && (
            <div className={`${showMobileResult ? "hidden md:block" : "block"} pane p-4 space-y-3`} data-testid="batch-render-progress">
              {(() => {
                const completed = batchRenders.filter((r) => r.status === "done").length;
                const failed = batchRenders.filter((r) => ["failed", "offline", "cancelled"].includes(r.status)).length;
                return (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="section-label">Latest batch</div>
                        <div className="text-sm text-zinc-300">
                          {completed} of {batchRenders.length} completed{failed ? ` · ${failed} failed` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">{Math.round((completed / batchRenders.length) * 100)}%</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${(completed / batchRenders.length) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                      {batchRenders.map((render, index) => {
                        const imageUrl = render.output_files?.[0];
                        const selected = render.id === selectedBatchRenderId;
                        return (
                          <button
                            type="button"
                            key={render.id}
                            onClick={() => {
                              setSelectedBatchRenderId(render.id);
                              setActiveRender(render);
                            }}
                            className={`relative aspect-[2/3] rounded-lg overflow-hidden border transition ${selected ? "border-emerald-400 ring-1 ring-emerald-400" : "border-white/10 hover:border-white/30"}`}
                            title={`Image ${index + 1} · ${render.status}`}
                          >
                            {imageUrl ? (
                              <img src={imageUrl} alt={`Batch result ${index + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black/20 text-zinc-500 text-xs">
                                {["failed", "offline", "cancelled"].includes(render.status)
                                  ? <AlertTriangle className="h-5 w-5" />
                                  : <Loader2 className="h-5 w-5 animate-spin" />}
                                <span>{render.status}</span>
                              </div>
                            )}
                            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                              {index + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeRender && (
            <div className={`${showMobileResult ? "hidden md:block" : "block"} pane p-4 space-y-3`} data-testid="render-status-panel">
              <div className="flex items-center justify-between">
                <div className="section-label">Render</div>
                <span
                  data-testid="render-status"
                  className={`text-xs font-mono ${
                    activeRender.status === "done" ? "text-emerald-300" :
                    activeRender.status === "failed" ? "text-red-400" :
                    activeRender.status === "cancelled" ? "text-zinc-400" :
                    activeRender.status === "offline" ? "text-zinc-400" : "text-amber-300"
                  }`}
                >
                  {activeRender.status}
                </span>
              </div>
              {activeRender.error && (
                <div className="text-xs text-red-300 font-mono bg-red-500/10 border border-red-500/30 rounded-md p-2">
                  {activeRender.error}
                </div>
              )}
              {activeRender.status !== "done" && activeRender.status !== "failed" && activeRender.status !== "offline" && activeRender.status !== "cancelled" && (
                <div
                  data-testid="render-live-preview-container"
                  className="relative w-full aspect-square rounded-md border hairline bg-elevated overflow-hidden"
                >
                  <LivePreview
                    clientId={activeRender.id}
                    enabled
                    variant="card"
                    testId="render-live-preview"
                    onCancel={async () => {
                      try {
                        const updated = await endpoints.cancelRender(activeRender.id);
                        setActiveRender(updated);
                        toast.success("Render cancelled");
                      } catch (e) {
                        toast.error(e?.response?.data?.detail || "Cancel failed");
                      }
                    }}
                  />
                </div>
              )}
              {activeRender.output_files?.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {activeRender.output_files.map((u, i) => (
                      <img key={i} src={u} alt="render" className="rounded-md border hairline w-full h-auto" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button type="button"
                      onClick={() => downloadRenderImage(activeRender.output_files[0], `render-${activeRender.id}.png`)}
                      className="rounded-lg border hairline px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 flex items-center justify-center gap-2"
                      data-testid="btn-download-finished-render">
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button type="button"
                      onClick={async () => {
                        try {
                          const reference = await endpoints.prepareRenderReference(activeRender.render_id || activeRender.id);
                          setReferenceImage(reference);
                          setSourceRenderId(activeRender.render_id || activeRender.id);
                          setReferencePreview(activeRender.output_files[0]);
                          setEditMode("standard");
                          toast.success("Image loaded for editing");
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || "Could not load image for editing");
                        }
                      }}
                      className="rounded-lg border hairline px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 flex items-center justify-center gap-2">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button type="button"
                      onClick={async () => {
                        try {
                          const reference = await endpoints.prepareRenderReference(activeRender.render_id || activeRender.id);
                          setReferenceImage(reference);
                          setSourceRenderId(activeRender.render_id || activeRender.id);
                          setReferencePreview(activeRender.output_files[0]);
                          toast.success("Image loaded for animation");
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || "Could not load image for animation");
                        }
                      }}
                      className="rounded-lg border hairline px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 flex items-center justify-center gap-2">
                      <Film className="h-4 w-4" /> Animate
                    </button>
                    <button type="button"
                      onClick={async () => {
                        try {
                          const reference = await endpoints.prepareRenderReference(activeRender.render_id || activeRender.id);
                          setReferenceImage(reference);
                          setSourceRenderId(activeRender.render_id || activeRender.id);
                          setReferencePreview(activeRender.output_files[0]);
                          toast.success("Using selected image as reference");
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || "Could not use image as reference");
                        }
                      }}
                      className="rounded-lg border hairline px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 flex items-center justify-center gap-2">
                      <ScanFace className="h-4 w-4" /> Reference
                    </button>
                    <button type="button"
                      onClick={async () => {
                        if (!window.confirm("Remove this render from the Gallery? The original ComfyUI output remains on disk.")) return;
                        try {
                          const renderId = activeRender.render_id || activeRender.id;
                          await endpoints.deleteRender(renderId);
                          setBatchRenders((current) => current.filter((render) => (render.render_id || render.id) !== renderId));
                          setActiveRender(null);
                          setSelectedBatchRenderId(null);
                          toast.success("Removed from Gallery");
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || "Could not remove render");
                        }
                      }}
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button type="button"
                      onClick={() => nav(`/gallery?render=${encodeURIComponent(activeRender.render_id || activeRender.id)}&returnTo=${encodeURIComponent(location.pathname)}`)}
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
                      data-testid="btn-view-finished-render">
                      View in Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
