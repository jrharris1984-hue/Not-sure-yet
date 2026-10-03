import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Shuffle, Download, Upload, Loader2, Play, ChevronLeft, ChevronRight, Camera, Sparkles, ChevronDown, ImagePlus, X, RotateCcw, SlidersHorizontal, ShieldCheck, AlertTriangle, Pencil, Film, Trash2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import {
  SECTIONS, DEFAULT_DNA,
  randomizeDna, randomizeSection, resetSection,
  phaseOfSection,
  MAX_SUBJECTS, makeSubject, subjectsFromCharacter, subjectLabel,
  expectedSubjectCount, seedSubjectFromPairing,
  HERITAGE_CASTS,
} from "@/lib/dna";
import { compileModelPrompts, resolvePromptCompiler } from "@/lib/modelPromptCompilers";
import { batchSeed } from "@/lib/batchSeeds";
import { translatePlainLanguage } from "@/lib/plainLanguagePrompt";
import { analyzePromptQuality } from "@/lib/promptQuality";
import DnaSection from "@/components/DnaSection";
import PromptPreview from "@/components/PromptPreview";
import AiAssistBar from "@/components/AiAssistBar";
import PresetsMenu from "@/components/PresetsMenu";
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
import PoseAssistPanel from "@/components/PoseAssistPanel";
import MobileRenderResult from "@/components/MobileRenderResult";
import SubjectSwitcher from "@/components/SubjectSwitcher";
import ChromaControls from "@/components/ChromaControls";
import UniversalLoraPicker from "@/components/UniversalLoraPicker";
import RenderRecipeSelector from "@/components/RenderRecipeSelector";
import SmartSetupPanel from "@/components/SmartSetupPanel";
import { getRenderRecipe, recipeFamily } from "@/lib/renderRecipes";
import { readBuilderDraft, writeBuilderDraft, clearBuilderDraft } from "@/lib/builderDraft";
import { STUDIO_PROFILES, applyStudioPreset } from "@/lib/studioProfiles";
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

const RENDER_TERMINAL = new Set(["done", "failed", "offline", "cancelled"]);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForQueuedRender(queueId, onUpdate) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const render = await endpoints.pollRender(queueId);
    if (onUpdate) onUpdate(render);
    if (RENDER_TERMINAL.has(render.status)) return render;
    await wait(2500);
  }
  throw new Error("Render timed out while waiting for ComfyUI.");
}

export default function Builder({ studio = "standard" }) {
  const { id, section: sectionParam } = useParams();
  const isNew = !id;
  const studioProfile = STUDIO_PROFILES[studio];
  const studioSteps = studioProfile?.steps || MOBILE_STUDIO_STEPS;
  const draftId = isNew && studioProfile ? `studio:${studio}` : (id || null);
  const nav = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const galleryImportApplied = useRef(false);
  const mediaLibraryImportApplied = useRef(false);
  const draftHydrated = useRef(false);
  const skipNextPromptReset = useRef(false);
  const [editorHydrated, setEditorHydrated] = useState(false);
  const [mediaImportSummary, setMediaImportSummary] = useState(null);

  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.key === sectionParam));
  const activeSection = SECTIONS[activeIdx].key;
  const basePath = studioProfile ? (isNew ? `/studio/${studio}` : `/studio/${studio}/${id}`) : (isNew ? "/character/new" : `/character/${id}`);
  const sectionUrl = (key) => `${basePath}/s/${key}`;
  const goSection = (key) => nav(sectionUrl(key));

  const [mobileStudioStep, setMobileStudioStep] = useState(() => mobileStudioStepForSection(activeSection, studioSteps));
  const [mobileStudioMode, setMobileStudioMode] = useState(() => {
    try {
      return window.localStorage.getItem("ultra-studio-mobile-mode") === "advanced" ? "advanced" : "simple";
    } catch {
      return "simple";
    }
  });
  const [desktopQuickMode, setDesktopQuickMode] = useState(true);
  const [specialtyTab, setSpecialtyTab] = useState(0);
  const [quickReview, setQuickReview] = useState(false);
  const activeMobileStudioIndex = Math.max(0, studioSteps.findIndex((step) => step.id === mobileStudioStep));

  useEffect(() => {
    try {
      window.localStorage.setItem("ultra-studio-mobile-mode", mobileStudioMode);
    } catch {
      // Local storage can be unavailable in private/restricted browser modes.
    }
  }, [mobileStudioMode]);

  const openMobileStudioStep = (stepId) => {
    const step = studioSteps.find((item) => item.id === stepId);
    if (!step) return;
    setMobileStudioStep(stepId);
    const visibleSections = mobileStudioSectionsForStep(stepId, mobileStudioMode, studioSteps);
    if (visibleSections.length && !visibleSections.includes(activeSection)) {
      nav(sectionUrl(visibleSections[0]));
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const moveMobileStudioStep = (direction) => {
    const nextIndex = Math.max(0, Math.min(studioSteps.length - 1, activeMobileStudioIndex + direction));
    openMobileStudioStep(studioSteps[nextIndex].id);
  };

  const changeMobileStudioMode = (nextMode) => {
    setMobileStudioMode(nextMode);
    if (nextMode !== "simple") return;
    const visibleSections = mobileStudioSectionsForStep(mobileStudioStep, "simple", studioSteps);
    if (visibleSections.length && !visibleSections.includes(activeSection)) {
      nav(sectionUrl(visibleSections[0]));
    }
  };

  const [name, setName] = useState("Untitled");
  // Multi-subject store: [{id, label, dna, field_locks}]. subjects[0] is Subject A (primary).
  const [subjects, setSubjects] = useState(() => [makeSubject({
    label: "A",
    dna: studio === "feet" ? { ...DEFAULT_DNA, pose: { ...DEFAULT_DNA.pose, focus: "feet", distance: "full body" } } : DEFAULT_DNA,
  })]);
  const [activeSubjectId, setActiveSubjectId] = useState(() => "");
  const [locks, setLocks] = useState({}); // section-level locks (shared across subjects — shot-level)
  const [collapsed, setCollapsed] = useState(() => ({
    _glance: typeof window !== "undefined" ? window.innerWidth < 768 : false,
  }));     // {sectionKey|'_glance': bool}
  const [tags, setTags] = useState([]);
  const [raunch, setRaunch] = useState(false);
  const [promptLanguage, setPromptLanguage] = useState("editorial");
  const [promptOverride, setPromptOverride] = useState("");
  const [plainLanguage, setPlainLanguage] = useState("");
  const [negativePromptOverride, setNegativePromptOverride] = useState("");
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);
  const [renderCount, setRenderCount] = useState(1);
  const [batchSeedMode, setBatchSeedMode] = useState("explore");
  const [batchRenders, setBatchRenders] = useState([]);
  const [selectedBatchRenderId, setSelectedBatchRenderId] = useState(null);
  const [postRenderBusy, setPostRenderBusy] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [selectedLora, setSelectedLora] = useState({ name: "", strength: 0.8, triggerWords: [] });
  const [secondaryLora, setSecondaryLora] = useState({ name: "", strength: 0.8, triggerWords: [] });
  const [showSecondLora, setShowSecondLora] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  const [sourceRenderId, setSourceRenderId] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState("Same adult subject and same photograph. Preserve facial identity, body proportions, pose, outfit, background, camera angle, and lighting. Make only a slight natural variation in expression and small details.");
  const [variationDenoise, setVariationDenoise] = useState(0.22);
  const [faceStrength, setFaceStrength] = useState(1.1);
  const [faceIdV2Strength, setFaceIdV2Strength] = useState(1.4);
  const [editInstruction, setEditInstruction] = useState("");
  const [editMode, setEditMode] = useState("standard");
  const [bodyAdjustRegion, setBodyAdjustRegion] = useState("glutes");
  const [bodyAdjustAmount, setBodyAdjustAmount] = useState(50);
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
  const [poseAssistEnabled, setPoseAssistEnabled] = useState(false);
  const [poseAssistStrength, setPoseAssistStrength] = useState(0.90);
  const [poseAssistPolish, setPoseAssistPolish] = useState(0.30);
  const [poseAssistStage, setPoseAssistStage] = useState("");
  const [installingPoseAssist, setInstallingPoseAssist] = useState(false);
  const [galleryRecipeMode, setGalleryRecipeMode] = useState("");
  const [enhancingVideo, setEnhancingVideo] = useState(false);
  const [analyzingVideoImage, setAnalyzingVideoImage] = useState(false);
  const [videoImageAnalysis, setVideoImageAnalysis] = useState("");
  useEffect(() => {
    if (mobileStudioStep === "create") return;
    setMobileStudioStep(mobileStudioStepForSection(activeSection, studioSteps));
  }, [activeSection, mobileStudioStep, studioSteps]);

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
    setPlainLanguage(draft.plainLanguage || "");
    setMediaImportSummary(draft.mediaImportSummary || null);
    setNegativePromptOverride(draft.negativePromptOverride || "");
    setWorkflowId(draft.workflowId || "");
    setLoraOverrides(draft.loraOverrides || {});
    setSelectedLora({
      name: draft.selectedLora?.name || "",
      strength: typeof draft.selectedLora?.strength === "number" ? draft.selectedLora.strength : 0.8,
      triggerWords: Array.isArray(draft.selectedLora?.triggerWords) ? draft.selectedLora.triggerWords : [],
    });
    setSecondaryLora(draft.secondaryLora || { name: "", strength: 0.8, triggerWords: [] });
    setShowSecondLora(Boolean(draft.showSecondLora || draft.secondaryLora?.name));
    setEditInstruction(draft.editInstruction || "");
    if (draft.variationPrompt) setVariationPrompt(draft.variationPrompt);
    if (typeof draft.variationDenoise === "number") setVariationDenoise(draft.variationDenoise);
    setEditMode(draft.editMode || "standard");
    setBodyAdjustRegion(draft.bodyAdjustRegion || "glutes");
    setBodyAdjustAmount(typeof draft.bodyAdjustAmount === "number" ? draft.bodyAdjustAmount : 50);
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
    setPoseAssistEnabled(!!draft.poseAssistEnabled);
    if (typeof draft.poseAssistStrength === "number") setPoseAssistStrength(draft.poseAssistStrength);
    if (typeof draft.poseAssistPolish === "number") setPoseAssistPolish(draft.poseAssistPolish);
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
    restoreDraft(readBuilderDraft(draftId));
    // References are transient edit-session state. A fresh Builder route must
    // never resurrect a Gallery/source image just because Qwen was used before.
    setReferenceImage(null);
    setReferencePreview("");
    setSourceRenderId(null);
    draftHydrated.current = true;
    setEditorHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    const incoming = location.state?.mediaLibraryTraits;
    if (!incoming || mediaLibraryImportApplied.current || !editorHydrated) return;
    mediaLibraryImportApplied.current = true;

    const next = JSON.parse(JSON.stringify(DEFAULT_DNA));
    const notes = [];
    const addNote = (label, value) => { if (value) notes.push(`${label}: ${value}`); };
    const lower = (value) => String(value || "").toLowerCase();

    // Only map values that match existing Studio choices exactly or safely.
    const hairColorOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="color")?.groups?.flatMap(g=>g.options) || [];
    const hairLengthOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="length")?.options || [];
    const hairStyleOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="style")?.groups?.flatMap(g=>g.options) || [];
    const bodyOptions = SECTIONS.find(s=>s.key==="physique")?.fields.find(f=>f.key==="body_type")?.options || [];
    const poseOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="action")?.groups?.flatMap(g=>g.options) || [];
    const framingOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="distance")?.options || [];
    const angleOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="angle")?.options || [];
    const envOptions = SECTIONS.find(s=>s.key==="scene")?.fields.find(f=>f.key==="environment")?.options || [];
    const styleOptions = SECTIONS.find(s=>s.key==="style")?.fields.find(f=>f.key==="render")?.options || [];

    const exact = (value, options) => options.find(o => lower(o) === lower(value)) || "";
    const containsOption = (value, options) => {
      const text = lower(value);
      if (!text) return "";
      return options
        .filter(Boolean)
        .sort((a,b)=>b.length-a.length)
        .find(o => text.includes(lower(o))) || "";
    };
    const alias = (value, pairs, options=[]) => {
      const text = lower(value);
      const hit = pairs.find(([needle]) => text.includes(needle));
      return hit ? hit[1] : containsOption(value, options);
    };
    const mapped = [];
    const map = (label, section, key, value) => {
      if (!value) return;
      next[section][key] = value;
      mapped.push({ label, value });
    };
    const hasMapped = (...labels) => labels.some((label) => mapped.some((item) => item.label === label));
    const addReferenceNote = (label, value, ownedBy = []) => {
      if (!value || (ownedBy.length && hasMapped(...ownedBy))) return;
      notes.push(`${label}: ${value}`);
    };

    map("Hair color", "hair", "color", exact(incoming.hairColor, hairColorOptions) ||
      alias(incoming.hairColor, [["dark","dark chocolate"],["brown","chestnut"],["black","jet black"],["blonde","golden blonde"],["red","auburn"],["gray","steel gray"],["grey","steel gray"]], hairColorOptions));
    map("Hair length", "hair", "length", exact(incoming.hairLength, hairLengthOptions) ||
      alias(incoming.hairLength, [["very long","waist-length"],["long","long"],["shoulder","shoulder"],["short","short bob"]], hairLengthOptions));
    map("Hair style", "hair", "style", exact(incoming.hairStyle, hairStyleOptions) || containsOption(incoming.hairStyle, hairStyleOptions));
    map("Body type", "physique", "body_type", exact(incoming.bodyBuild, bodyOptions) ||
      alias(incoming.bodyBuild, [["hourglass","hourglass"],["curvy","curvy"],["voluptuous","voluptuous"],["athletic","athletic"],["slim","slim"],["plus","plus size"]], bodyOptions));
    map("Pose", "pose", "action", exact(incoming.pose, poseOptions) ||
      alias(incoming.pose, [["kneeling","kneeling upright"],["bending over","bending over"],["lying","lying back"],["sitting","sitting on edge"],["standing","standing"],["walking","walking"]], poseOptions));
    map("Framing", "pose", "distance", exact(incoming.framing || incoming.cameraDistance, framingOptions) ||
      alias(incoming.framing || incoming.cameraDistance, [["close","close-up"],["medium","waist-up"],["full","full body"],["wide","wide shot"],["portrait","portrait"]], framingOptions));
    map("Camera angle", "pose", "angle", exact(incoming.cameraAngle || incoming.orientation, angleOptions) ||
      alias(incoming.cameraAngle || incoming.orientation, [["back","back"],["rear","back"],["profile","profile"],["side","profile"],["over-shoulder","over-shoulder"],["above","from above"],["below","from below"],["front","front"]], angleOptions));
    map("Environment", "scene", "environment", exact(incoming.environment, envOptions) ||
      alias(incoming.environment, [["bedroom","bedroom"],["studio","studio"],["beach","beach"],["forest","forest"],["rooftop","rooftop"],["warehouse","warehouse"],["desert","desert"],["alley","neon alley"],["castle","castle"],["street","urban street"]], envOptions));
    map("Photo style", "style", "render", exact(incoming.photographicStyle, styleOptions) ||
      alias(incoming.photographicStyle, [["cinematic","cinematic"],["editorial","editorial"],["documentary","documentary"],["analog","analog film"],["35mm","35mm film"],["photo","photorealistic"],["selfie","photorealistic"]], styleOptions));

    const expressionOptions = SECTIONS.find(s=>s.key==="face")?.fields.find(f=>f.key==="expression")?.options || [];
    const wardrobeSection = SECTIONS.find(s=>s.key==="wardrobe");
    const outfitOptions = wardrobeSection?.fields.find(f=>f.key==="outfit_preset")?.groups?.flatMap(g=>g.options) || wardrobeSection?.fields.find(f=>f.key==="outfit_preset")?.options || [];
    const garmentColors = wardrobeSection?.fields.find(f=>f.key==="garment_color")?.groups?.flatMap(g=>g.options) || [];
    const materialOptions = wardrobeSection?.fields.find(f=>f.key==="material")?.options || [];
    const fitOptions = wardrobeSection?.fields.find(f=>f.key==="fit")?.options || [];
    const lightSourceOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="source")?.options || [];
    const lightStyleOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="style")?.options || [];
    const lightMoodOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="mood")?.options || [];
    const cameraAngleOptions = SECTIONS.find(s=>s.key==="camera")?.fields.find(f=>f.key==="angle")?.options || [];
    const focusOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="focus")?.options || [];

    map("Expression", "face", "expression", exact(incoming.expression, expressionOptions) || containsOption(incoming.expression, expressionOptions));
    map("Outfit", "wardrobe", "outfit_preset", containsOption(incoming.wardrobe, outfitOptions));
    map("Outfit color", "wardrobe", "garment_color", containsOption(incoming.wardrobe, garmentColors));
    map("Material", "wardrobe", "material", containsOption(incoming.wardrobe, materialOptions));
    map("Fit", "wardrobe", "fit", containsOption(incoming.wardrobe, fitOptions));
    map("Lighting source", "lighting", "source", containsOption(incoming.lighting, lightSourceOptions));
    map("Lighting style", "lighting", "style", containsOption(incoming.lighting, lightStyleOptions));
    map("Lighting mood", "lighting", "mood", containsOption(incoming.lighting, lightMoodOptions));
    map("Camera", "camera", "angle", alias(incoming.cameraAngle, [["eye-level","eye-level"],["low angle","low"],["high angle","high"],["dutch","dutch"],["bird","birds-eye"]], cameraAngleOptions));
    map("Composition focus", "pose", "focus", alias(incoming.composition, [["face","face"],["full body","full frame"],["body","body"],["hip","hips"],["leg","legs"],["feet","feet"],["hand","hands"]], focusOptions));

    const proportionsText = lower([incoming.bodyBuild, incoming.bodyProportions, incoming.physicalAppearance].filter(Boolean).join(" "));
    const sizeMap = (words) => words.find(([word])=>proportionsText.includes(word))?.[1] || "";
    map("Bust", "physique", "bust", sizeMap([["very large bust","very large"],["large bust","large"],["medium bust","medium"],["small bust","small"]]));
    map("Glutes", "physique", "butt", sizeMap([["very large butt","very large"],["large butt","large"],["prominent butt","large"],["large glute","large"],["round butt","round"]]));
    map("Hips", "physique", "hips", sizeMap([["very wide hip","very wide"],["wide hip","wide"],["narrow hip","narrow"]]));
    map("Thighs", "physique", "thighs", sizeMap([["very thick thigh","very thick"],["thick thigh","thick"],["athletic thigh","athletic"],["slim thigh","slim"]]));
    map("Waist", "physique", "waist", sizeMap([["tiny waist","tiny"],["cinched waist","cinched"],["slim waist","slim"],["thick waist","thick"]]));
    // Preserve only observations that were not already mapped into authoritative
    // Studio controls. This prevents imported reference metadata from being
    // appended later as a second, contradictory instruction block.
    addReferenceNote("Appearance", incoming.physicalAppearance);
    addReferenceNote("Build", incoming.bodyBuild, ["Body type"]);
    addReferenceNote("Proportions", incoming.bodyProportions, ["Bust", "Glutes", "Hips", "Thighs", "Waist"]);
    addReferenceNote("Hair", [incoming.hairColor, incoming.hairLength, incoming.hairStyle].filter(Boolean).join(", "),
      ["Hair color", "Hair length", "Hair style"]);
    addReferenceNote("Expression", incoming.expression, ["Expression"]);
    addReferenceNote("Wardrobe", incoming.wardrobe, ["Outfit", "Outfit color", "Material", "Fit"]);
    addReferenceNote("Pose", incoming.pose, ["Pose"]);
    addReferenceNote("Body orientation", incoming.orientation, ["Camera angle", "Camera"]);
    addReferenceNote("Framing", incoming.framing, ["Framing"]);
    addReferenceNote("Camera angle", incoming.cameraAngle, ["Camera angle", "Camera"]);
    addReferenceNote("Composition", incoming.composition, ["Composition focus"]);
    addReferenceNote("Lighting", incoming.lighting, ["Lighting source", "Lighting style", "Lighting mood"]);
    addReferenceNote("Environment", incoming.environment, ["Environment"]);
    addReferenceNote("Background", incoming.background);
    addReferenceNote("Photo style", incoming.photographicStyle, ["Photo style"]);

    next.physique.proportions = incoming.bodyProportions || "";
    next.scene.background = [incoming.environment, incoming.background].filter(Boolean).join(". ");
    next.style.extra = [incoming.photographicStyle, incoming.composition].filter(Boolean).join(", ");

    const restored = makeSubject({ label: "A", dna: next });
    setSubjects([restored]);
    setActiveSubjectId(restored.id);
    setName(`Media Study - ${incoming.sourceName || "Untitled"}`);
    setTags(Array.isArray(incoming.generalTags) ? incoming.generalTags : []);
    setPlainLanguage(notes.join("\n"));
    const importSummary = { sourceName: incoming.sourceName || "Media Library image", mapped, notes };
    setMediaImportSummary(importSummary);
    const existingDraft = readBuilderDraft(draftId) || {};
    writeBuilderDraft(draftId, {
      ...existingDraft,
      name: `Media Study - ${incoming.sourceName || "Untitled"}`,
      subjects: [restored],
      activeSubjectId: restored.id,
      tags: Array.isArray(incoming.generalTags) ? incoming.generalTags : [],
      plainLanguage: notes.join("\n"),
      mediaImportSummary: importSummary,
    });
    setPromptOverride("");
    setNegativePromptOverride("");
    setMobileStudioStep("start");
    toast.success("Media Library traits loaded into Studio");
    nav("/character/new/s/identity", { replace: true, state: null });
  }, [draftId, editorHydrated, location.state, nav]);

  // Persist the latest render session so a refresh/reopen can reconnect to the
  // same queued/running batch instead of making it disappear from Builder.
  useEffect(() => {
    if (!draftHydrated.current) return;
    const existing = readBuilderDraft(draftId) || {};
    writeBuilderDraft(draftId, {
      ...existing,
      activeRender,
      batchRenders,
      selectedBatchRenderId,
      renderCount,
    });
  }, [activeRender, batchRenders, selectedBatchRenderId, renderCount, draftId]);

  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: endpoints.listWorkflows });
  const { data: poseAssistStatus } = useQuery({
    queryKey: ["pose-assist-status"],
    queryFn: endpoints.poseAssistStatus,
    enabled: poseAssistEnabled,
    refetchInterval: poseAssistEnabled ? 15000 : false,
  });
  const selectedWorkflowForStatus = workflows.find((workflow) => workflow.id === workflowId);
  const kreaStatusEnabled = selectedWorkflowForStatus?.prompt_style === "krea2";
  const { data: krea2Status } = useQuery({
    queryKey: ["krea2-status"],
    queryFn: endpoints.krea2Status,
    enabled: kreaStatusEnabled,
    refetchInterval: kreaStatusEnabled ? 15000 : false,
  });
  const selectableWorkflows = useMemo(
    () => workflows.filter((workflow) => !["pose", "refine", "krea_style"].includes(workflow.kind)),
    [workflows]
  );
  const internalWorkflows = useMemo(
    () => workflows.filter((workflow) => ["pose", "refine", "krea_style"].includes(workflow.kind)),
    [workflows]
  );
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: endpoints.settings });
  const aiProvider = settings?.ai_provider === "ollama" ? "Ollama" : "Venice";
  useEffect(() => {
    if (!workflowId && workflows.length) {
      setWorkflowId(settings?.default_workflow_id || workflows[0].id);
    }
  }, [workflows, settings, workflowId]);

  useEffect(() => {
    const incoming = location.state?.galleryReference;
    if (!incoming || !workflows.length || galleryImportApplied.current || !editorHydrated) return;

    const requestedKind = location.state?.targetKind;
    const requestedMode = location.state?.referenceMode;
    // Body Adjust is a Chroma img2img operation. Keep Qwen reserved for normal
    // image edits and route Gallery Body Adjust through the proven variation graph.
    const target = requestedMode === "body_adjust"
      ? workflows.find((workflow) => workflow.kind === "variation" && workflow.prompt_style === "chroma")
      : workflows.find((workflow) => workflow.kind === requestedKind);
    if (!target) {
      const label = requestedKind === "video" ? "image-to-video" : requestedKind === "face" ? "face-preserve" : "image-edit";
      toast.error(`No ${label} workflow is configured. Add one in Settings first.`);
      galleryImportApplied.current = true;
      nav(location.pathname, { replace: true, state: null });
      return;
    }

    galleryImportApplied.current = true;
    setMobileStudioStep("create");
    // Gallery navigation owns the edit source. Replace any stale manual/previous
    // reference rather than allowing draft or responsive UI state to leak in.
    if (referencePreview?.startsWith?.("blob:")) URL.revokeObjectURL(referencePreview);
    setReferenceImage(null);
    setReferencePreview("");
    setSourceRenderId(null);
    setWorkflowId(target.id);
    setReferenceImage(incoming);
    setSourceRenderId(incoming.source_render_id || null);
    setReferencePreview(location.state?.previewUrl || "");

    if (location.state?.referenceMode === "keep_character") {
      const saved = location.state.characterRecipe || {};
      const restored = Array.isArray(saved.subjects) && saved.subjects.length
        ? saved.subjects.map((subject, index) => makeSubject({
          label: subject.label || subjectLabel(index),
          dna: subject.dna || DEFAULT_DNA,
          fieldLocks: subject.field_locks || {},
          likeness: subject.likeness,
        }))
        : [makeSubject({ label: "A", dna: saved.dna || DEFAULT_DNA })];
      setSubjects(restored);
      setActiveSubjectId(restored[0].id);
      setLocks(saved.locks || {});
      setPromptLanguage(saved.prompt_language || "editorial");
      setPromptOverride("");
      setNegativePromptOverride("");
      setPlainLanguage("");
      setSelectedLora({ name: "", strength: 0.8, triggerWords: [] });
      setSecondaryLora({ name: "", strength: 0.8, triggerWords: [] });
      setShowSecondLora(false);
      setLoraOverrides({});
    }

    if (requestedMode === "body_adjust") {
      setEditMode("body_adjust");
      setBodyAdjustRegion("glutes");
      setBodyAdjustAmount(50);
      setVariationDenoise(0.22);
      setPreserveUnmentioned(true);
      setEditInstruction("");
      setVideoInstruction("");
    } else if (requestedKind === "edit") {
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
        ? location.state?.referenceMode === "keep_character"
          ? "Character and face reference loaded. Change pose, expression, or outfit before rendering."
          : "Gallery image loaded as a face reference"
        : location.state?.referenceMode === "new_pose"
          ? "Gallery image loaded for a new pose"
          : location.state?.referenceMode === "body_adjust"
            ? "Gallery image loaded for body adjustment"
            : "Gallery image loaded for editing";
    toast.success(message);
    if (requestedMode === "body_adjust") {
      const existingDraft = readBuilderDraft(draftId) || {};
      writeBuilderDraft(draftId, {
        ...existingDraft,
        workflowId: target.id,
        editMode: "body_adjust",
        variationDenoise: 0.22,
        bodyAdjustRegion: "glutes",
        bodyAdjustAmount: 50,
      });
      nav("/character/new", { replace: true, state: null });
    } else {
      nav(location.pathname, { replace: true, state: null });
    }
  }, [draftId, editorHydrated, location.pathname, location.state, nav, workflows]);

  useEffect(() => {
    if (editMode === "body_adjust" && referenceImage?.name) setMobileStudioStep("create");
  }, [editMode, referenceImage?.name]);

  useEffect(() => {
    const saved = location.state?.renderRecipe?.recipe;
    if (!saved || !workflows.length || galleryImportApplied.current || !editorHydrated) return;
    const rebuildCurrent = location.state?.renderRecipeMode === "current";
    galleryImportApplied.current = true;
    setMobileStudioStep("create");
    skipNextPromptReset.current = !rebuildCurrent;
    if (Array.isArray(saved.subjects) && saved.subjects.length) {
      const restored = saved.subjects.map((subject, index) => makeSubject({
        label: subject.label || subjectLabel(index),
        dna: subject.dna || DEFAULT_DNA,
        fieldLocks: subject.field_locks || {},
        likeness: subject.likeness,
      }));
      setSubjects(restored);
      setActiveSubjectId(restored[0].id);
    } else if (saved.dna) {
      const restored = makeSubject({ label: "A", dna: saved.dna });
      setSubjects([restored]);
      setActiveSubjectId(restored.id);
    }
    if (saved.locks) setLocks(saved.locks);
    if (saved.prompt_language) {
      setPromptLanguage(saved.prompt_language);
      setRaunch(saved.prompt_language === "explicit");
    }
    if (saved.workflow_id) {
      const savedWorkflow = workflows.find((workflow) => workflow.id === saved.workflow_id);
      if (savedWorkflow?.kind === "krea_style") {
        const baseKrea = workflows.find((workflow) => workflow.prompt_style === "krea2" && workflow.kind === "image");
        if (baseKrea) setWorkflowId(baseKrea.id);
      } else if (savedWorkflow) {
        setWorkflowId(savedWorkflow.id);
      }
    }
    setSelectedLora({
      name: saved.selected_loras?.[0]?.name || saved.selected_lora_name || (saved.krea_style === "private_magazine" ? "Private_Magazine_2000s_v1.safetensors" : ""),
      strength: typeof (saved.selected_loras?.[0]?.strength ?? saved.selected_lora_strength) === "number"
        ? (saved.selected_loras?.[0]?.strength ?? saved.selected_lora_strength)
        : (typeof saved.krea_lora_strength === "number" ? saved.krea_lora_strength : 0.8),
      triggerWords: Array.isArray(saved.selected_loras?.[0]?.triggers || saved.selected_lora_triggers)
        ? (saved.selected_loras?.[0]?.triggers || saved.selected_lora_triggers)
        : (saved.krea_style === "private_magazine" ? ["privatemag"] : []),
    });
    setSecondaryLora(saved.selected_loras?.[1] ? {
      name: saved.selected_loras[1].name, strength: saved.selected_loras[1].strength,
      triggerWords: saved.selected_loras[1].triggers || [],
    } : { name: "", strength: 0.8, triggerWords: [] });
    setShowSecondLora(Boolean(saved.selected_loras?.[1]?.name));
    setLoraOverrides(saved.lora_overrides || {});
    setPromptOverride(rebuildCurrent ? "" : (saved.prompt_positive || ""));
    if (rebuildCurrent) {
      // Current Compiler must rebuild from the saved render recipe only. A
      // previously hydrated Builder draft can contain Media Library/Qwen notes
      // in plainLanguage; leaving them here silently appends stale Hair, Pose,
      // Wardrobe, Photo style, etc. after the newly compiled prompt.
      setPlainLanguage("");
      setMediaImportSummary(null);
    }
    if (saved.prompt_positive && !rebuildCurrent) setVariationPrompt(saved.prompt_positive);
    if (typeof saved.refine_denoise === "number") setVariationDenoise(saved.refine_denoise);
    setNegativePromptOverride(rebuildCurrent ? "" : (saved.prompt_negative || ""));
    if (saved.reference_image) setReferenceImage({ name: saved.reference_image, type: "input", subfolder: "" });
    if (saved.edit_instruction) setEditInstruction(saved.edit_instruction);
    if (saved.video_instruction) setVideoInstruction(saved.video_instruction);
    setPreserveUnmentioned(saved.preserve_unmentioned !== false);
    if (saved.quality_tier) setQualityTier(saved.quality_tier);
    setVideoFrames(saved.video_frames || 41);
    setVideoFps(saved.video_fps || 24);
    setVideoWidth(saved.video_width || 640);
    setVideoHeight(saved.video_height || 640);
    setChromaSettings((current) => ({ ...current,
      width: saved.width || current.width, height: saved.height || current.height,
      steps: saved.steps || current.steps, cfg: saved.cfg ?? current.cfg,
      batchSize: saved.batch_size || current.batchSize, sampler: saved.sampler_name || current.sampler,
      seed: rebuildCurrent ? "" : (saved.seed ?? current.seed),
    }));
    setGalleryRecipeMode(rebuildCurrent ? "current" : "exact");
    toast.success(rebuildCurrent
      ? "Saved setup loaded with the current compiler · prompt overrides cleared"
      : "Exact Gallery recipe restored in the editor");
    nav(location.pathname, { replace: true, state: null });
  }, [editorHydrated, location.pathname, location.state, nav, workflows]);

  const activeWorkflow = workflows.find((w) => w.id === workflowId);
  const poseAssistFoundationWorkflow = workflows.find((w) => w.kind === "pose");
  const poseAssistPolishWorkflow = workflows.find((w) => w.kind === "refine");
  const poseAssistAvailable = !!poseAssistFoundationWorkflow && !!poseAssistPolishWorkflow;
  const promptStyle = activeWorkflow?.prompt_style || "venice";
  const isFaceWorkflow = activeWorkflow?.kind === "face";
  const isEditWorkflow = activeWorkflow?.kind === "edit";
  const isEnhanceWorkflow = activeWorkflow?.kind === "enhance";
  const isVariationWorkflow = activeWorkflow?.kind === "variation";
  const isVideoWorkflow = activeWorkflow?.kind === "video";
  const isTextVideoWorkflow = activeWorkflow?.kind === "text_video";
  const activeCompiler = resolvePromptCompiler({
    promptStyle,
    workflowKind: activeWorkflow?.kind,
    workflowName: activeWorkflow?.name,
  });
  const isGoldenChroma = activeCompiler === "chroma";
  const isKrea2 = activeCompiler === "krea2";
  const activeRecipeFamily = recipeFamily(activeCompiler);
  const renderSettings = isKrea2
    ? { ...chromaSettings, steps: 8, cfg: 1, sampler: "euler" }
    : chromaSettings;
  const kreaBaseBlocked = isKrea2 && krea2Status && !krea2Status.ready;
  const kreaRenderBlocked = !!kreaBaseBlocked;

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

  const installPoseAssist = async () => {
    setInstallingPoseAssist(true);
    try {
      const result = await endpoints.seedWorkflows();
      await qc.invalidateQueries({ queryKey: ["workflows"] });
      await qc.invalidateQueries({ queryKey: ["pose-assist-status"] });
      toast.success("Pose Assist installed", {
        description: result?.added || result?.updated
          ? "Internal FLUX foundation and Chroma polish workflows are ready."
          : "Pose Assist workflows are already current.",
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not install Pose Assist workflows.");
    } finally {
      setInstallingPoseAssist(false);
    }
  };

  const changePoseAssistEnabled = (enabled) => {
    setPoseAssistEnabled(enabled);
    setPoseAssistStage("");
    if (!enabled) return;
    setRenderCount(1);
    const chroma = selectableWorkflows.find((workflow) =>
      resolvePromptCompiler({
        promptStyle: workflow.prompt_style,
        workflowKind: workflow.kind,
        workflowName: workflow.name,
      }) === "chroma"
    );
    if (chroma && workflowId !== chroma.id) {
      setWorkflowId(chroma.id);
      setLoraOverrides({});
      toast.message("Pose Assist uses Chroma for the final polish.");
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

  const setKreaFraming = (distance) => {
    setSubjects((current) => current.map((subject) => ({
      ...subject,
      dna: { ...subject.dna, pose: { ...(subject.dna?.pose || {}), distance } },
    })));
    setPromptOverride("");
    toast.success(`${distance} framing applied to all subjects`);
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
      toast.success(`${aiProvider} extracted the pose without copying the reference identity`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${aiProvider} could not analyze the pose reference`);
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
      toast.success(`${aiProvider} inspected the image and drafted a repair instruction`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${aiProvider} could not inspect the image`);
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
      toast.success(`${aiProvider} enhanced the edit instruction`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${aiProvider} could not enhance the edit instruction`);
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
      toast.success(isTextVideoWorkflow ? `${aiProvider} expanded the video prompt` : `${aiProvider} enhanced the motion prompt`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${aiProvider} could not enhance the motion prompt`);
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
      toast.success(`${aiProvider} analyzed the starting image and drafted the motion prompt`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || `${aiProvider} could not analyze the starting image`);
    } finally {
      setAnalyzingVideoImage(false);
    }
  };

  const clearReference = () => {
    if (referencePreview?.startsWith?.("blob:")) URL.revokeObjectURL(referencePreview);
    setReferencePreview("");
    setReferenceImage(null);
    setSourceRenderId(null);
  };

  const resetEditSession = () => {
    clearReference();
    setEditMode("standard");
    setBodyAdjustRegion("glutes");
    setBodyAdjustAmount(50);
    setEditInstruction("");
    setPreserveUnmentioned(true);
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
    const timer = window.setTimeout(() => writeBuilderDraft(draftId, {
      name, subjects, activeSubjectId, locks, collapsed, tags, raunch, promptLanguage,
      promptOverride, plainLanguage, negativePromptOverride, workflowId, loraOverrides,
      editInstruction, preserveUnmentioned, repairTargets, repairInstruction,
      variationPrompt, variationDenoise,
      editMode, bodyAdjustRegion, bodyAdjustAmount, poseTarget, poseNotes, poseLocks,
      referenceStudioView, referenceRecipe, referenceStrengths, poseReferenceAnalysis,
      videoInstruction, videoFrames, videoFps, videoWidth, videoHeight,
      qualityTier, poseAssistEnabled, poseAssistStrength, poseAssistPolish,
      selectedLora, secondaryLora, showSecondLora, chromaSettings, activeRender,
    }), 350);
    return () => window.clearTimeout(timer);
  }, [
    draftId, name, subjects, activeSubjectId, locks, collapsed, tags, raunch, promptLanguage,
    promptOverride, plainLanguage, negativePromptOverride, workflowId, loraOverrides,
    editInstruction, preserveUnmentioned, repairTargets, repairInstruction,
    variationPrompt, variationDenoise,
    editMode, bodyAdjustRegion, bodyAdjustAmount, poseTarget, poseNotes, poseLocks,
    referenceStudioView, referenceRecipe, referenceStrengths, poseReferenceAnalysis,
    videoInstruction, videoFrames, videoFps, videoWidth, videoHeight,
    qualityTier, poseAssistEnabled, poseAssistStrength, poseAssistPolish,
    selectedLora, secondaryLora, showSecondLora, chromaSettings, activeRender,
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
      setSubjects((cur) => [...cur, ...Array.from({ length: Math.max(0, expected - cur.length) }, (_, offset) => {
        const index = cur.length + offset;
        return makeSubject({ label: subjectLabel(index), dna: seedSubjectFromPairing(primaryDna, index) });
      })]);
      toast.success(`Scenario set for ${expected} subjects`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDna?.scenario?.cast_size, primaryDna?.scenario?.cast_type]);

  const updateActiveSubject = (updater) => {
    setSubjects((cur) => cur.map((s) => (s.id === activeSubjectId ? { ...s, ...updater(s) } : s)));
  };
  const setActiveDna = (newDna) => updateActiveSubject(() => ({ dna: newDna }));
  const setActiveFieldLocks = (newLocks) => updateActiveSubject(() => ({ field_locks: newLocks }));

  const setSection = (key, val) => {
    if (key === "identity" && ["mother and daughter", "stepmom and stepdaughter"].includes(primaryDna.scenario?.cast_type)) {
      const age = Number(val.age) || 21;
      val = { ...val, age: activeSubjectIdx === 0 ? Math.max(44, age) : Math.min(Math.max(21, age), Math.max(21, Number(primaryDna.identity?.age || 44) - 18)) };
    }
    setActiveDna({ ...activeDna, [key]: val });
  };

  const isMulti = subjects.length > 1;
  const poseInstruction = useMemo(() => buildSameCharacterPoseInstruction({
    poseId: poseTarget,
    notes: poseNotes,
    poseAnalysis: poseReferenceAnalysis,
    locks: poseLocks,
    preservationInstruction: preservationStrengthInstruction(referenceStrengths),
  }), [poseTarget, poseNotes, poseReferenceAnalysis, poseLocks, referenceStrengths]);
  const bodyAdjustInstruction = useMemo(() => {
    const amount = Math.max(0, Math.min(100, Number(bodyAdjustAmount) || 0));
    const regionLabels = {
      glutes: "glute size and projection",
      bust: "bust size and projection",
      hips: "hip width",
      thighs: "thigh thickness",
      waist: "waist width",
    };
    const region = regionLabels[bodyAdjustRegion] || bodyAdjustRegion;
    const delta = amount - 50;
    const magnitude = Math.abs(delta);
    const direction = delta < 0 ? "decrease" : delta > 0 ? "increase" : "preserve";

    if (magnitude < 5) {
      return `Preserve the subject's ${region} at its current size. Do not change the source image's body proportions. Preserve the same adult subject, face, hair, expression, pose, hands, feet, clothing, camera framing, background, lighting, and photographic style.`;
    }

    const level = magnitude >= 45
      ? "MAXIMUM"
      : magnitude >= 35
        ? "very strong"
        : magnitude >= 25
          ? "strong"
          : magnitude >= 15
            ? "clearly visible"
            : "subtle";

    const scaleLanguage = direction === "increase"
      ? (magnitude >= 45
          ? "Make a dramatic, unmistakable localized enlargement with substantially greater size and projection. The selected region must be visibly much larger than in the source image."
          : magnitude >= 35
            ? "Make a very large and immediately obvious localized enlargement compared with the source image."
            : magnitude >= 25
              ? "Make a strong, clearly visible localized enlargement compared with the source image."
              : magnitude >= 15
                ? "Make a clearly visible localized enlargement compared with the source image."
                : "Make a small but visible localized enlargement compared with the source image.")
      : (magnitude >= 45
          ? "Make a dramatic, unmistakable localized reduction. The selected region must be visibly much smaller than in the source image."
          : magnitude >= 35
            ? "Make a very large and immediately obvious localized reduction compared with the source image."
            : magnitude >= 25
              ? "Make a strong, clearly visible localized reduction compared with the source image."
              : magnitude >= 15
                ? "Make a clearly visible localized reduction compared with the source image."
                : "Make a small but visible localized reduction compared with the source image.");

    return `${level} LOCALIZED BODY EDIT: ${direction} only the subject's ${region}. ${scaleLanguage} This requested change is intentional and must be visibly apparent in the result; do not simply reproduce the source image unchanged. Preserve the same adult subject and identity, face, hair, expression, exact pose, hands, feet, clothing, camera position and framing, background, lighting, photographic style, and every unselected body region. Modify only the selected region and the immediately connected anatomy required for a coherent transition. Keep one coherent human body with realistic skin texture and photographic appearance.`;
  }, [bodyAdjustAmount, bodyAdjustRegion]);

  const effectiveEditInstruction = editMode === "new_pose"
    ? poseInstruction
    : editMode === "body_adjust"
      ? bodyAdjustInstruction
      : editInstruction;
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
  const translatedPlainLanguage = useMemo(
    () => translatePlainLanguage(plainLanguage, activeCompiler),
    [plainLanguage, activeCompiler]
  );
  const likenessPrompt = useMemo(() => likenessTriggerText(subjects), [subjects]);
  const acceptsLikenessPrompt = !["qwen_edit", "wan_i2v"].includes(activeCompiler);
  const languageLead = acceptsLikenessPrompt
    ? activeCompiler === "krea2"
      ? ""
      : promptLanguage === "direct"
        ? "clear literal adult scene description, direct unambiguous vocabulary"
        : promptLanguage === "explicit"
          ? "explicit adult scene, graphic unambiguous vocabulary"
          : "editorial adult photography, tasteful descriptive vocabulary"
    : "";
  const hasAuthoritativeChromaBodyScale = activeCompiler === "chroma" && [
    activeDna?.physique?.bust_scale,
    activeDna?.physique?.butt_scale,
    activeDna?.physique?.hip_scale,
    activeDna?.physique?.thigh_scale,
    activeDna?.physique?.waist_scale,
    activeDna?.physique?.implant_volume,
  ].some((value) => Number(value) > 0);
  const translatedUserText = hasAuthoritativeChromaBodyScale
    ? String(translatedPlainLanguage.text || "")
        .split(/\n+/)
        .filter((line) => !/^\s*(appearance|build|proportions|framing|composition)\s*:/i.test(line))
        .join("\n")
        .trim()
    : translatedPlainLanguage.text;
  const generatedPositive = [languageLead, acceptsLikenessPrompt && likenessPrompt, positive, translatedUserText].filter(Boolean).join(", ");
  const positiveBeforeLoraTriggers = isVariationWorkflow ? variationPrompt : (promptOverride || generatedPositive);
  const activeLoraTriggers = [...new Set([
    ...(selectedLora.name ? selectedLora.triggerWords || [] : []),
    ...(showSecondLora && secondaryLora.name ? secondaryLora.triggerWords || [] : []),
  ])];
  const finalPositive = activeLoraTriggers.reduce(
    (text, trigger) => text.toLowerCase().includes(trigger.toLowerCase()) ? text : `${trigger}, ${text}`,
    positiveBeforeLoraTriggers
  );
  const finalNegative = isVariationWorkflow ? (negativePromptOverride || "") : (negativePromptOverride || negative);
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
      toast.success(`${aiProvider} improved the compiled prompt — review it before rendering`);
    } catch (error) {
      toast.error(error?.response?.data?.detail || `${aiProvider} could not improve the prompt`);
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
      if (isNew && c?.id) nav(`${studioProfile ? `/studio/${studio}` : "/character"}/${c.id}/s/${activeSection}`, { replace: true });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const doDispatch = async () => {
    if (!workflowId) {
      toast.error("Pick a workflow first (Settings → Workflow library)");
      return;
    }
    if (!isVariationWorkflow && promptAnalysis.blockers.length) {
      toast.error(promptAnalysis.blockers[0].message);
      return;
    }
    const incompleteLikeness = subjects.find((subject) => subject?.likeness?.enabled && (!subject.likeness.node_id || !subject.likeness.lora_name));
    if (!isVariationWorkflow && incompleteLikeness) {
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
    if (isVariationWorkflow && !referenceImage?.name) {
      toast.error("Upload a source image before creating variations");
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

    if (isKrea2) {
      const readiness = krea2Status || await endpoints.krea2Status();
      qc.setQueryData(["krea2-status"], readiness);
      if (!readiness?.ready) {
        toast.error(`Krea 2 setup needs: ${(readiness?.missing || []).join(", ") || "local ComfyUI check"}`);
        return;
      }
    }

    if (poseAssistEnabled && !isVariationWorkflow) {
      if (!poseAssistAvailable) {
        toast.error("Pose Assist workflows are not installed. Use Install Pose Assist in the Create step.");
        return;
      }
      const readiness = poseAssistStatus || await endpoints.poseAssistStatus();
      if (!readiness?.ready) {
        qc.setQueryData(["pose-assist-status"], readiness);
        toast.error(`Pose Assist setup needs: ${(readiness?.missing || []).join(", ") || "local ComfyUI check"}`);
        return;
      }
      if (!poseReferenceImage?.name) {
        toast.error("Choose a pose-reference image for Pose Assist.");
        return;
      }
      if (activeRecipeFamily !== "image") {
        toast.error("Pose Assist is currently available for still-image creation.");
        return;
      }

      setDispatching(true);
      setPoseAssistStage("foundation");
      try {
        const baseSeed = chromaSettings.seed !== ""
          ? Number(chromaSettings.seed)
          : Math.floor(Math.random() * 2147483647);
        const sharedSubjects = subjects.map((s) => ({
          label: s.label,
          dna: s.dna,
          field_locks: s.field_locks || {},
          likeness: s.likeness,
        }));
        const foundationPrompt = [
          "Follow the supplied pose reference closely. Preserve coherent human anatomy, subject count, joint placement, and limb connections.",
          positiveBeforeLoraTriggers,
        ].filter(Boolean).join(" ");

        const foundationQueued = await endpoints.dispatchRender({
          character_id: isNew ? undefined : id,
          dna: subjects[0]?.dna || {},
          subjects: sharedSubjects,
          locks,
          prompt_language: promptLanguage,
          quality_tier: qualityTier,
          prompt_positive: foundationPrompt,
          prompt_negative: finalNegative,
          workflow_id: poseAssistFoundationWorkflow.id,
          operation: "pose_foundation",
          reference_image: poseReferenceImage.name,
          control_strength: poseAssistStrength,
          control_start: 0,
          control_end: 0.65,
          hidden_from_gallery: true,
          width: chromaSettings.width,
          height: chromaSettings.height,
          batch_size: 1,
          steps: qualityTier === "quality" ? 32 : qualityTier === "draft" ? 22 : 28,
          sampler_name: "euler",
          seed: baseSeed,
        });
        setBatchRenders([foundationQueued]);
        setSelectedBatchRenderId(foundationQueued.id);
        setActiveRender(foundationQueued);

        const foundation = await waitForQueuedRender(foundationQueued.id, setActiveRender);
        if (foundation.status !== "done") {
          throw new Error(foundation.error || "FLUX pose foundation did not complete.");
        }

        const foundationId = foundation.render_id || foundation.id;
        setPoseAssistStage("handoff");
        const prepared = await endpoints.prepareRenderReference(foundationId);

        setPoseAssistStage("polish");
        const polishPrompt = [
          "Preserve the supplied image's exact pose, limb placement, subject count, framing, and overall silhouette.",
          finalPositive,
          "Refine photographic realism, face detail, skin texture, lighting, and material detail without changing the established body geometry.",
        ].filter(Boolean).join(" ");

        const finalQueued = await endpoints.dispatchRender({
          character_id: isNew ? undefined : id,
          dna: subjects[0]?.dna || {},
          subjects: sharedSubjects,
          locks,
          prompt_language: promptLanguage,
          quality_tier: qualityTier,
          prompt_positive: polishPrompt,
          prompt_negative: finalNegative,
          workflow_id: poseAssistPolishWorkflow.id,
          parent_render_id: foundationId,
          operation: "pose_polish",
          reference_image: prepared.name,
          refine_denoise: poseAssistPolish,
          hidden_from_gallery: false,
          steps: chromaSettings.steps,
          cfg: chromaSettings.cfg,
          sampler_name: chromaSettings.sampler,
          selected_lora_name: selectedLora.name || "",
          selected_lora_strength: selectedLora.strength,
          selected_lora_triggers: selectedLora.triggerWords || [],
          selected_loras: [selectedLora, ...(showSecondLora ? [secondaryLora] : [])]
            .filter((lora) => lora.name)
            .map((lora) => ({ name: lora.name, strength: lora.strength, triggers: lora.triggerWords || [] })),
          seed: (baseSeed + 1) % 2147483647,
        });
        setBatchRenders([finalQueued]);
        setSelectedBatchRenderId(finalQueued.id);
        setActiveRender(finalQueued);

        const finalRender = await waitForQueuedRender(finalQueued.id, setActiveRender);
        setBatchRenders([finalRender]);
        setSelectedBatchRenderId(finalRender.id);
        setActiveRender(finalRender);

        if (finalRender.status !== "done") {
          throw new Error(finalRender.error || "Chroma polish did not complete.");
        }

        setPoseAssistStage("done");
        qc.invalidateQueries({ queryKey: ["renders"] });
        toast.success("Pose Assist complete · FLUX pose + Chroma polish");
      } catch (error) {
        setPoseAssistStage("");
        toast.error(error?.response?.data?.detail || error?.message || "Pose Assist failed");
      } finally {
        setDispatching(false);
      }
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
        const uniqueSeed = batchSeed(baseSeed, imageIndex, batchSeedMode);
        let r;
        try {
          r = await endpoints.dispatchRender({
        character_id: isNew ? undefined : id,
        // Send primary subject DNA (backward compat) + all subjects for future backend use.
        dna: subjects[0]?.dna || {},
        subjects: subjects.map((s) => ({
          label: s.label,
          dna: s.dna,
          field_locks: s.field_locks || {},
          likeness: s.likeness,
        })),
        locks,
        prompt_language: promptLanguage,
        quality_tier: qualityTier,
        prompt_positive: editMode === "body_adjust" && isVariationWorkflow ? bodyAdjustInstruction : finalPositive,
        prompt_negative: finalNegative,
        workflow_id: workflowId,
        lora_overrides: effectiveLoraOverrides,
        krea_style: "none",
        krea_lora_strength: 0.8,
        selected_lora_name: selectedLora.name || "",
        selected_lora_strength: selectedLora.strength,
        selected_lora_triggers: selectedLora.triggerWords || [],
        selected_loras: [selectedLora, ...(showSecondLora ? [secondaryLora] : [])]
          .filter((lora) => lora.name)
          .map((lora) => ({ name: lora.name, strength: lora.strength, triggers: lora.triggerWords || [] })),
        parent_render_id: sourceRenderId || undefined,
        operation: isVariationWorkflow ? (editMode === "body_adjust" ? "body_adjust_chroma" : "variation") : sourceRenderId
          ? (isVideoWorkflow ? "animate" : isFaceWorkflow ? "face_reference" : editMode === "new_pose" ? "new_pose" : "edit")
          : "render",
        width: activeRecipeFamily === "image" ? renderSettings.width : undefined,
        height: activeRecipeFamily === "image" ? renderSettings.height : undefined,
        batch_size: activeRecipeFamily === "image" ? 1 : undefined,
        steps: activeRecipeFamily === "image" ? renderSettings.steps : undefined,
        cfg: activeRecipeFamily === "image" ? renderSettings.cfg : undefined,
        sampler_name: activeRecipeFamily === "image" ? renderSettings.sampler : undefined,
        seed: activeRecipeFamily === "image" ? uniqueSeed : undefined,
        reference_image: (isFaceWorkflow || isEditWorkflow || isEnhanceWorkflow || isVideoWorkflow || isVariationWorkflow) ? referenceImage?.name : undefined,
        reference_source_render_id: referenceImage?.source_render_id || undefined,
        refine_denoise: isVariationWorkflow
          ? (editMode === "body_adjust"
              ? Math.min(0.36, 0.16 + (Math.abs(bodyAdjustAmount - 50) / 50) * 0.20)
              : variationDenoise)
          : undefined,
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
        } catch (error) {
          if (!queuedRenders.length) throw error;
          toast.error(`${queuedRenders.length} of ${requestedCount} images queued. The next request failed: ${error?.response?.data?.detail || error.message}`);
          break;
        }
        queuedRenders.push(r);
        setBatchRenders([...queuedRenders]);
      }
      const latestRender = queuedRenders[queuedRenders.length - 1];
      setBatchRenders(queuedRenders);
      setSelectedBatchRenderId(queuedRenders[0]?.id || null);
      setActiveRender(queuedRenders[0] || latestRender);
      if (queuedRenders.length === requestedCount) toast.success(requestedCount > 1
        ? `Added ${queuedRenders.length} images to the queue · unique seeds`
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
    setPoseAssistStage("");
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
      if (selected && updated.every((render) => RENDER_TERMINAL.has(render.status)) && selected.status !== "done") {
        const firstSuccess = updated.find((render) => render.status === "done");
        if (firstSuccess) {
          setSelectedBatchRenderId(firstSuccess.id);
          setActiveRender(firstSuccess);
          return;
        }
      }
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
  const randomizeCast = () => {
    setSubjects((current) => {
      const primary = current[0];
      if (!primary) return current;
      const identity = locks.identity ? primary.dna.identity : randomizeSection("identity", primary.dna.identity, primary.field_locks?.identity);
      const pairing = primary.dna.scenario?.cast_type;
      const nextIdentity = { ...identity, name: primary.dna.identity?.name || "", age: Math.max(["mother and daughter", "stepmom and stepdaughter", "aunt and niece", "grandma and granddaughter"].includes(pairing) ? 44 : 21, Number(identity.age) || 21), gender: "female" };
      const primaryVariation = { ...primary.dna, identity: nextIdentity };
      ["physique", "face", "hair", "skin"].forEach((section) => {
        if (!locks[section]) primaryVariation[section] = randomizeSection(section, primary.dna[section], primary.field_locks?.[section]);
      });
      const nextPrimary = { ...primary, dna: primaryVariation };
      return [nextPrimary, ...current.slice(1).map((subject, index) => ({
        ...subject,
        dna: { ...subject.dna, ...Object.fromEntries(["identity", "physique", "face", "hair", "skin"].map((section) => [section,
          locks[section] ? subject.dna[section] : seedSubjectFromPairing(primaryVariation, index + 1)[section]])),
          identity: { ...(locks.identity ? subject.dna.identity : seedSubjectFromPairing(primaryVariation, index + 1).identity), name: subject.dna.identity?.name || "", gender: "female" },
        },
      }))];
    });
    toast.success("People randomized · scene and outfits kept");
  };
  const randomizePerson = () => {
    setSubjects((current) => {
      const subject = current.find((item) => item.id === activeSubjectId);
      if (!subject) return current;
      const dna = { ...subject.dna };
      for (const section of ["identity", "physique", "face", "hair", "skin"]) {
        if (!locks[section]) dna[section] = randomizeSection(section, subject.dna[section], subject.field_locks?.[section]);
      }
      const pairing = primaryDna.scenario?.cast_type;
      const isMotherPair = ["mother and daughter", "stepmom and stepdaughter"].includes(pairing);
      const minAge = activeSubjectIdx === 0 && isMotherPair ? 44 : 21;
      const age = Math.max(minAge, Number(dna.identity?.age) || 21);
      dna.identity = { ...dna.identity, name: subject.dna.identity?.name || "", age: activeSubjectIdx > 0 && isMotherPair ? Math.min(age, Math.max(21, Number(primaryDna.identity?.age || 44) - 18)) : age };
      if (activeSubjectIdx > 0 && ["twins", "identical twins"].includes(pairing)) {
        dna.identity = { ...primaryDna.identity, name: subject.dna.identity?.name || "" };
        dna.face = { ...primaryDna.face };
      }
      return current.map((item) => {
        if (item.id === activeSubjectId) return { ...item, dna };
        if (activeSubjectIdx === 0 && isMotherPair && item.id !== activeSubjectId) {
          return { ...item, dna: { ...item.dna, identity: { ...item.dna.identity,
            age: Math.min(Number(item.dna.identity?.age) || 21, Math.max(21, dna.identity.age - 18)),
          } } };
        }
        return item;
      });
    });
    toast.success(`Subject ${activeSubject.label} randomized · outfit and scene kept`);
  };
  const randomizeScene = () => {
    setSubjects((current) => current.map((subject, index) => {
      const next = { ...subject.dna };
      for (const section of index === 0 ? ["pose", "scene", "lighting", "camera", "style"] : ["pose"]) {
        if (!locks[section]) next[section] = randomizeSection(section, subject.dna[section], subject.field_locks?.[section]);
      }
      return { ...subject, dna: next };
    }));
    toast.success("Scene randomized · people kept");
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
  const resetCharacter = () => {
    const confirmed = window.confirm(
      "Reset this character? This clears all current selections, prompts, tags, locks, and the uploaded reference image. Saved characters and Gallery images will not be deleted."
    );
    if (!confirmed) return;
    clearBuilderDraft(draftId);
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    const fresh = makeSubject({ label: "A", dna: JSON.parse(JSON.stringify(DEFAULT_DNA)) });
    setName("Untitled");
    setSubjects([fresh]);
    setActiveSubjectId(fresh.id);
    setLocks({});
    setCollapsed({});
    setTags([]);
    setMediaImportSummary(null);
    const existingDraft = readBuilderDraft(draftId) || {};
    if (existingDraft.mediaImportSummary) {
      const { mediaImportSummary: _removedSummary, ...rest } = existingDraft;
      writeBuilderDraft(draftId, rest);
    }
    setRaunch(false);
    setPromptLanguage("editorial");
    setLoraOverrides({});
    setReferenceImage(null);
    setReferencePreview("");
    setSourceRenderId(null);
    setActiveRender(null);
    setBatchRenders([]);
    setSelectedBatchRenderId(null);
    setRenderCount(1);
    setEditInstruction("");
    setEditMode("standard");
    setBodyAdjustRegion("glutes");
    setBodyAdjustAmount(50);
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
    } else if (mobileStudioStep === "focus") {
      values.push(studio === "feet" ? activeDna.feet?.framing : activeDna.watersports?.container);
      values.push(studio === "feet" ? activeDna.feet?.pedicure : activeDna.watersports?.stream);
    } else if (mobileStudioStep === "create") {
      values.push(activeWorkflow?.name, qualityTier);
      if (activeRecipeFamily === "image") values.push(`${renderCount} image${renderCount === 1 ? "" : "s"}`);
    }
    return values.filter((value) => value && value !== "none").slice(0, 4).join(" · ");
  }, [activeDna, activeRecipeFamily, activeWorkflow?.name, mobileStudioStep, qualityTier, renderCount, studio]);

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
    if (poseAssistEnabled && !isVariationWorkflow && !poseAssistAvailable) issues.push("Install Pose Assist workflows.");
    if (poseAssistEnabled && !isVariationWorkflow && poseAssistStatus && !poseAssistStatus.ready && poseAssistAvailable) {
      issues.push(`Pose Assist setup needs: ${(poseAssistStatus.missing || []).join(", ") || "local ComfyUI check"}.`);
    }
    if (poseAssistEnabled && !isVariationWorkflow && !poseReferenceImage?.name) issues.push("Add a pose reference for Pose Assist.");
    if (isKrea2 && krea2Status && !krea2Status.ready) {
      issues.push(`Krea 2 setup needs: ${(krea2Status.missing || []).join(", ") || "local ComfyUI check"}.`);
    }
    (!isVariationWorkflow ? promptAnalysis.blockers : []).slice(0, 2).forEach((blocker) => {
      if (blocker?.message && !issues.includes(blocker.message)) issues.push(blocker.message);
    });
    const incompleteLikeness = subjects.find((subject) => subject?.likeness?.enabled && (!subject.likeness.node_id || !subject.likeness.lora_name));
    if (incompleteLikeness && !isVariationWorkflow) issues.push(`Finish Likeness LoRA setup for Subject ${incompleteLikeness.label || "A"}.`);
    if (isVariationWorkflow && !referenceImage?.name) issues.push("Add the source image you want to vary.");
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
    isEditWorkflow, isEnhanceWorkflow, isFaceWorkflow, isTextVideoWorkflow, isVideoWorkflow, isVariationWorkflow,
    poseAssistAvailable, poseAssistEnabled, poseAssistStatus, poseReferenceImage?.name,
    isKrea2, krea2Status,
    promptAnalysis, referenceImage?.name, repairInstruction, repairTargets, subjects, videoInstruction,
  ]);

  const batchIsFinished = batchRenders.length <= 1 || batchRenders.every((render) =>
    ["done", "failed", "offline", "cancelled"].includes(render.status)
  );
  const finishedBatchSelection = batchIsFinished && batchRenders.length > 1
    ? batchRenders.find((render) => render.id === selectedBatchRenderId && render.status === "done")
      || batchRenders.find((render) => render.status === "done")
    : null;
  const mobileResultRender = finishedBatchSelection || activeRender;
  const showMobileResult = mobileStudioStep === "create"
    && mobileStudioMode === "simple"
    && mobileResultRender?.status === "done"
    && !!mobileResultRender.output_files?.[0]
    && batchIsFinished
    && (!poseAssistEnabled || poseAssistStage === "done");

  const quickStages = [
    { key: "identity", title: "People", detail: "Cast & age", sections: ["identity", "scenario"] },
    { key: "physique", title: "Body", detail: "Shape & features", sections: ["physique", "face", "hair", "skin", "intimate"] },
    { key: "wardrobe", title: "Wardrobe", detail: "Outfit & color", sections: ["wardrobe"] },
    { key: "pose", title: "Pose", detail: "Action & camera", sections: ["pose", "camera"] },
    { key: "scene", title: "Setting", detail: "Place & mood", sections: ["scene", "lighting", "style"] },
    { key: "feet", title: "Details", detail: "Additional controls", sections: ["feet", "kink", "watersports"] },
    { key: "review", title: "Review", detail: "Prompt & render", sections: [] },
  ];
  const [quickOpenCategory, setQuickOpenCategory] = useState("identity");
  const quickStageIndex = quickReview ? 6 : Math.max(0, quickStages.findIndex((stage) => stage.sections.includes(activeSection)));
  const selectQuickStage = (index) => {
    if (index < 0 || index >= quickStages.length) return;
    setQuickOpenCategory(quickStages[index].key);
    if (index === 6) {
      setQuickReview(true);
    } else {
      setQuickReview(false);
      goSection(quickStages[index].key);
    }
    window.requestAnimationFrame(() => document.querySelector('[data-testid="desktop-quick-create"]')?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    }));
  };

  const sectionNavigation = (position) => (
    <div className="hidden md:flex items-center justify-between gap-2" aria-label={`${position} section navigation`}>
      <button type="button" onClick={() => desktopQuickMode ? selectQuickStage(quickStageIndex - 1) : activeIdx > 0 && goSection(SECTIONS[activeIdx - 1].key)}
        disabled={desktopQuickMode ? quickStageIndex === 0 : activeIdx === 0} data-testid={`btn-section-prev${position === "top" ? "-top" : ""}`}
        className="inline-flex items-center gap-1.5 rounded-lg border hairline px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-30">
        <ChevronLeft className="h-4 w-4" /> {desktopQuickMode ? quickStageIndex > 0 ? quickStages[quickStageIndex - 1].title : "Previous" : activeIdx > 0 ? SECTIONS[activeIdx - 1].title : "Prev"}
      </button>
      {(desktopQuickMode ? quickStageIndex < 6 : activeIdx < SECTIONS.length - 1) ? (
        <button type="button" onClick={() => desktopQuickMode ? selectQuickStage(quickStageIndex + 1) : goSection(SECTIONS[activeIdx + 1].key)}
          data-testid={`btn-section-next${position === "top" ? "-top" : ""}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5">
          {desktopQuickMode ? quickStages[quickStageIndex + 1].title : SECTIONS[activeIdx + 1].title} <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={() => save.mutate()}
          data-testid={`btn-section-finish${position === "top" ? "-top" : ""}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2.5">
          Finish & Save <Save className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className={`mx-auto max-w-[1600px] px-2.5 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4 ${desktopQuickMode ? "quick-create-mode" : ""}`}>
      {galleryRecipeMode === "current" && (
        <div className="pane border border-cyan-500/30 bg-cyan-500/[0.06] px-3 py-2.5 text-xs text-cyan-100" data-testid="current-compiler-rebuild-banner">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <div>
              <div className="font-semibold">Rebuild with Current Compiler</div>
              <div className="mt-0.5 text-[10px] text-zinc-400">
                Saved DNA and generation settings were restored, saved prompt overrides were cleared, and the next render will use the current compiler with a new seed.
              </div>
            </div>
          </div>
        </div>
      )}
      {mediaImportSummary && (
        <div className="pane border border-amber-400/30 bg-amber-500/[0.06] p-3 sm:p-4" data-testid="media-import-summary">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="font-display font-bold text-amber-200">Imported from Media</div>
              <div className="mt-0.5 text-xs text-zinc-400">{mediaImportSummary.sourceName}</div>
            </div>
            <button type="button" onClick={()=>setMediaImportSummary(null)} className="self-start rounded-lg border hairline px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5">Hide summary</button>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">Mapped to Studio controls</div>
              <div className="flex flex-wrap gap-1.5">
                {mediaImportSummary.mapped.length ? mediaImportSummary.mapped.map((item,index)=>(
                  <button type="button" key={`${item.label}-${index}`} onClick={()=>{ const targets={Hair:"hair","Hair color":"hair","Hair length":"hair","Hair style":"hair","Body type":"physique",Bust:"physique",Glutes:"physique",Hips:"physique",Thighs:"physique",Waist:"physique",Expression:"face",Outfit:"wardrobe","Outfit color":"wardrobe",Material:"wardrobe",Fit:"wardrobe",Pose:"pose",Framing:"pose","Camera angle":"pose",Camera:"camera","Composition focus":"pose",Environment:"scene","Lighting source":"lighting","Lighting style":"lighting","Lighting mood":"lighting","Photo style":"style"}; const target=targets[item.label]; if(target){ goSection(target); window.requestAnimationFrame(()=>document.getElementById(`section-${target}`)?.scrollIntoView({behavior:"smooth",block:"start"})); } }} className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 hover:border-amber-400/50 hover:bg-amber-500/10">{item.label}: {item.value}</button>
                )) : <span className="text-xs text-zinc-500">No direct control matches yet.</span>}
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">Kept as editable reference notes</div>
              <div className="max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-300">{mediaImportSummary.notes.join("\n")}</div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-black/40 p-2 text-xs" aria-label="Builder shortcuts">
        <span className="px-2 font-mono uppercase tracking-wider text-cyan-300">Studio</span>
        {!desktopQuickMode && [["studio-model", "01 · Model"], ["studio-sections", "02 · Character"], ["studio-render", "03 · Render"]].map(([target, label]) => (
          <button key={target} type="button" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-lg border hairline px-3 py-2 text-zinc-300 transition-colors hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-200">
            {label}
          </button>
        ))}
        <span className="ml-auto hidden xl:inline pr-2 text-zinc-500">{desktopQuickMode ? "Start with the essentials. Full Studio keeps every option." : "All controls are available below."}</span>
        <button type="button" onClick={() => { setDesktopQuickMode((value) => !value); setQuickReview(false); }}
          data-testid="btn-desktop-studio-mode" className="ml-auto rounded-lg border border-cyan-400/40 px-3 py-2 font-semibold text-cyan-200 hover:bg-cyan-400/10">
          {desktopQuickMode ? "Full Studio · all options" : "Quick Create"}
        </button>
      </div>
      <div id="studio-model" className="pane scroll-mt-24 p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
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
            onChange={(e) => {
              const nextWorkflowId = e.target.value;
              if (nextWorkflowId !== workflowId) {
                clearReference();
                setEditMode("standard");
                setBodyAdjustRegion("glutes");
                setBodyAdjustAmount(50);
                setEditInstruction("");
              }
              setWorkflowId(nextWorkflowId);
              setLoraOverrides({});
            }}
            className={`${mobileStudioStep === "start" || mobileStudioStep === "create" ? "block" : "hidden md:block"} bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100 w-full sm:w-auto sm:min-w-[200px]`}
          >
            {workflows.length === 0 && <option value="">No workflows — open Settings</option>}
            {selectableWorkflows.filter((w) => !["sdxl", "sdxl_dmd2"].includes(w.prompt_style) && !w.name.startsWith("Pony · Ultra Realistic")).map((w) => (
              <option key={w.id} value={w.id}>{w.kind.toUpperCase()} · {w.name}</option>
            ))}
            {selectableWorkflows.some((w) => ["sdxl", "sdxl_dmd2"].includes(w.prompt_style) || w.name.startsWith("Pony · Ultra Realistic")) && (
              <optgroup label="SDXL and Pony checkpoints">
                {selectableWorkflows.filter((w) => ["sdxl", "sdxl_dmd2"].includes(w.prompt_style) || w.name.startsWith("Pony · Ultra Realistic")).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </optgroup>
            )}
            {internalWorkflows.length > 0 && (
              <optgroup label="Used automatically (not standalone)">
                {internalWorkflows.map((w) => (
                  <option key={w.id} value={w.id} disabled>{w.name}</option>
                ))}
              </optgroup>
            )}
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
              value={poseAssistEnabled && !isVariationWorkflow ? 1 : renderCount}
              onChange={(e) => setRenderCount(Number(e.target.value))}
              disabled={dispatching || (poseAssistEnabled && !isVariationWorkflow)}
              className="hidden md:block bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100 flex-1 sm:flex-none"
              title="Number of images to queue with unique seeds"
            >
              {[1, 2, 4, 6, 8, 10].map((count) => (
                <option key={count} value={count}>{count} image{count > 1 ? "s" : ""}</option>
              ))}
            </select>
          )}
          {activeRecipeFamily === "image" && renderCount > 1 && <select value={batchSeedMode}
            onChange={(event) => setBatchSeedMode(event.target.value)} title="Explore uses widely spaced seeds; Nearby uses consecutive seeds. Both keep your selected prompt."
            className="hidden md:block bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100">
            <option value="explore">Explore different seeds</option>
            <option value="nearby">Nearby seeds</option>
          </select>}
          <button
            onClick={doDispatch}
            disabled={dispatching || !workflowId || kreaRenderBlocked || (activeRecipeFamily === "edit" && !referenceImage?.name) || (poseAssistEnabled && !isVariationWorkflow && (!poseAssistAvailable || !poseReferenceImage?.name || (poseAssistStatus && !poseAssistStatus.ready)))}
            data-testid="btn-dispatch-comfyui-render"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-3 py-2 disabled:opacity-40"
          >
            {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {poseAssistEnabled && !isVariationWorkflow ? "Pose Assist" : "Render"}
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
            <div
              className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-elevated p-1 text-sm text-zinc-300"
              title="Changes prompt vocabulary only; it never adds activities or changes DNA selections."
              data-testid="prompt-language-control"
            >
              <Flame className="ml-1 h-4 w-4 shrink-0 text-fuchsia-300" />
              <span className="hidden sm:inline px-1 text-xs">Language</span>
              {[
                ["editorial", "Editorial"],
                ["direct", "Direct"],
                ["explicit", "Explicit"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPromptLanguage(value);
                    setRaunch(value === "explicit");
                  }}
                  className={
                    "rounded-md px-2 py-1 text-[10px] font-semibold transition "
                    + (promptLanguage === value
                      ? "bg-fuchsia-500/20 text-fuchsia-100 ring-1 ring-fuchsia-500/30"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200")
                  }
                  aria-pressed={promptLanguage === value}
                  data-testid={`btn-prompt-language-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
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
        steps={studioSteps}
        title={studioProfile?.title || "Studio flow"}
        currentStep={mobileStudioStep}
        activeSection={activeSection}
        locks={locks}
        sections={SECTIONS}
        mode={mobileStudioMode}
        summary={mobileStudioSummary}
        onModeChange={changeMobileStudioMode}
        onStep={openMobileStudioStep}
        onSection={(key) => {
          setMobileStudioStep(mobileStudioStepForSection(key, studioSteps));
          goSection(key);
        }}
      />

      <nav className="hidden md:grid grid-cols-5 gap-2" aria-label="Creation steps" data-testid="desktop-creation-steps">
        {studioSteps.map((step, index) => {
          const selected = step.id === mobileStudioStep;
          return <button key={step.id} type="button" onClick={() => openMobileStudioStep(step.id)}
            aria-current={selected ? "step" : undefined}
            className={`studio-stage rounded-xl border px-3 py-3 text-left ${selected ? "studio-stage-active border-amber-400/60 bg-amber-500/10" : "hairline bg-elevated hover:border-cyan-400/50"}`}>
            <span className={`text-[10px] font-mono ${selected ? "text-amber-300" : "text-zinc-500"}`}>{String(index + 1).padStart(2, "0")}</span>
            <span className="mt-1 block font-display text-sm font-bold text-zinc-100">{step.label}</span>
            <span className="mt-0.5 block text-[11px] text-zinc-400">{step.hint}</span>
          </button>;
        })}
      </nav>

      <div className={mobileStudioStep === "start" ? "block" : "hidden md:block"}>
        <AiAssistBar dna={activeDna} aiProvider={aiProvider}
          onApplyDna={(draft) => { setActiveDna(draft); setPlainLanguage(""); }}
          onApplySubjects={(draftSubjects) => {
            setSubjects(draftSubjects);
            setActiveSubjectId(draftSubjects[0].id);
            setPlainLanguage("");
            setPromptOverride("");
            setNegativePromptOverride("");
          }} />
      </div>

      {mobileStudioStep === "create" && !showMobileResult && (
        <>
          <MobileCreateReview
            workflow={activeWorkflow}
            compiler={activeCompiler}
            family={activeRecipeFamily}
            qualityTier={qualityTier}
            onQualityTier={applyQualityTier}
            renderCount={poseAssistEnabled && !isVariationWorkflow ? 1 : renderCount}
            onRenderCount={setRenderCount}
            summaries={mobileCreateSummaries}
            issues={mobileCreateIssues}
            mode={mobileStudioMode}
            onRequestAdvanced={() => setMobileStudioMode("advanced")}
          />
          {activeRecipeFamily === "image" && renderCount > 1 && <label className="md:hidden pane p-3 flex items-center justify-between gap-3 text-xs text-zinc-200">
            Batch variety
            <select value={batchSeedMode} onChange={(event) => setBatchSeedMode(event.target.value)}
              className="bg-elevated border border-hairline rounded-lg px-2 py-2 text-xs text-zinc-100">
              <option value="explore">Explore different seeds</option>
              <option value="nearby">Nearby seeds</option>
            </select>
          </label>}
          {activeRecipeFamily === "image" && !isKrea2 && !isVariationWorkflow && (
            <div className="md:hidden">
              <PoseAssistPanel
                enabled={poseAssistEnabled}
                onEnabled={changePoseAssistEnabled}
                preview={poseReferencePreview}
                uploading={poseReferenceUploading}
                onUpload={uploadPoseReference}
                onClear={clearPoseReference}
                strength={poseAssistStrength}
                onStrength={setPoseAssistStrength}
                polish={poseAssistPolish}
                onPolish={setPoseAssistPolish}
                stage={poseAssistStage}
                available={poseAssistAvailable}
                installing={installingPoseAssist}
                onInstall={installPoseAssist}
                systemStatus={poseAssistStatus}
              />
            </div>
          )}
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
          render={mobileResultRender}
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
              {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {poseAssistEnabled && !isVariationWorkflow ? "Generate" : "Render"}
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

      <div className={`quick-hide ${mobileStudioStep === "create" ? "block" : "hidden md:block"}`}>
        {activeWorkflow && (activeCompiler !== "qwen_edit" || isEnhanceWorkflow) && (
          <div className="hidden md:block">
            <RenderRecipeSelector
              compiler={activeCompiler}
              value={qualityTier}
              onChange={applyQualityTier}
            />
          </div>
        )}

        {activeRecipeFamily === "image" && !isKrea2 && !isVariationWorkflow && (
          <div className="hidden md:block mt-3 sm:mt-4">
            <PoseAssistPanel
              enabled={poseAssistEnabled}
              onEnabled={changePoseAssistEnabled}
              preview={poseReferencePreview}
              uploading={poseReferenceUploading}
              onUpload={uploadPoseReference}
              onClear={clearPoseReference}
              strength={poseAssistStrength}
              onStrength={setPoseAssistStrength}
              polish={poseAssistPolish}
              onPolish={setPoseAssistPolish}
              stage={poseAssistStage}
              available={poseAssistAvailable}
              installing={installingPoseAssist}
              onInstall={installPoseAssist}
              systemStatus={poseAssistStatus}
            />
          </div>
        )}

        {activeWorkflow && !["pose", "refine", "krea_style"].includes(activeWorkflow.kind) && (
          <div className="mt-3 sm:mt-4">
            <UniversalLoraPicker
              workflow={activeWorkflow}
              value={selectedLora}
              onChange={setSelectedLora}
              slotLabel="LoRA 1"
              excludedNames={showSecondLora && secondaryLora.name ? [secondaryLora.name] : []}
            />
            {showSecondLora ? (
              <div className="mt-3">
                <button type="button" className="mb-2 text-xs text-zinc-400 underline" onClick={() => {
                  setSecondaryLora({ name: "", strength: 0.8, triggerWords: [] });
                  setShowSecondLora(false);
                }}>Remove second LoRA</button>
                <UniversalLoraPicker workflow={activeWorkflow} value={secondaryLora}
                  onChange={setSecondaryLora} slotLabel="LoRA 2"
                  excludedNames={selectedLora.name ? [selectedLora.name] : []} />
                <p className="mt-2 text-xs text-zinc-500">Stacking LoRAs can change the result substantially. Adjust each strength if needed.{poseAssistEnabled ? " Pose Assist applies these to the Chroma polish stage." : ""}</p>
              </div>
            ) : (
              <button type="button" className="mt-2 rounded-lg border hairline px-3 py-2 text-xs text-cyan-200 hover:bg-white/5"
                onClick={() => setShowSecondLora(true)}>+ Add second LoRA</button>
            )}
          </div>
        )}

        {isGoldenChroma && (
          <div className={(mobileStudioMode === "advanced" ? "block " : "hidden md:block ") + "mt-3 sm:mt-4"}>
            <ChromaControls value={chromaSettings} onChange={setChromaSettings} />
          </div>
        )}
      </div>

      {/* Subject controls stay available, but stay out of Simple Create review. */}
      {activeSection !== "identity" && <div className={`quick-hide ${mobileStudioStep === "create" && mobileStudioMode === "simple" ? "hidden md:block" : "block"}`}>
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
      </div>}

      <div className={`quick-hide ${mobileStudioStep === "create" && mobileStudioMode === "advanced" ? "space-y-2" : "hidden md:block md:space-y-2"}`}>
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

      <div className={editMode === "body_adjust" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-4"}>
        {/* Left rail - grouped-by-phase section nav (uses active subject's dna for filled dots) */}
        <aside className={`quick-hide hidden lg:block h-fit sticky top-20 ${editMode === "body_adjust" ? "!hidden" : ""}`}>
          <GroupedSectionRail
            dna={activeDna}
            locks={locks}
            activeSection={activeSection}
            onSelect={(key) => nav(sectionUrl(key))}
            testIdPrefix="nav-section"
          />
        </aside>

        {/* Mobile section chips — grouped by phase */}
        <div className={`hidden md:flex lg:hidden overflow-x-auto scroll-fade -mx-3 px-3 gap-2 pb-1 ${editMode === "body_adjust" ? "!hidden" : ""}`}>
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
        {editMode === "body_adjust" && (
          <section className="pane border-amber-500/30 bg-amber-500/[0.04] p-4 sm:p-5 space-y-4" data-testid="focused-body-adjust-banner">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="section-label text-amber-200">Edit existing image</div>
                <h2 className="font-display mt-1 text-lg font-bold text-white">Body Adjust</h2>
                <p className="mt-1 max-w-2xl text-xs text-zinc-400">The source image is the baseline. Body Adjust uses Chroma1-HD img2img; 50 is the original, lower values reduce the selected region, and higher values enlarge it.</p>
              </div>
              <button type="button" onClick={() => { setEditMode("standard"); setBodyAdjustAmount(50); }}
                className="rounded-lg border hairline px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white">
                Exit Body Adjust
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500">Region</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {[["glutes","Glutes"],["bust","Bust"],["hips","Hips"],["thighs","Thighs"],["waist","Waist"]].map(([value,label]) => (
                      <button key={value} type="button" onClick={() => setBodyAdjustRegion(value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${bodyAdjustRegion === value ? "border-amber-400 bg-amber-500/15 text-amber-100" : "border-hairline text-zinc-400 hover:text-zinc-200"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Adjustment</span>
                    <span className="font-mono text-sm font-bold text-amber-200">{bodyAdjustAmount}</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={bodyAdjustAmount}
                    onChange={(event) => setBodyAdjustAmount(Number(event.target.value))}
                    className="w-full accent-amber-400" data-testid="range-focused-body-adjust" />
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <span>0 · smaller</span><span>50 · original</span><span>100 · larger</span>
                  </div>
                </label>
                <div className="rounded-lg border hairline bg-black/20 p-3 text-xs text-zinc-300">
                  <span className="font-semibold text-zinc-100">Chroma instruction: </span>{bodyAdjustInstruction}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-mono uppercase tracking-widest text-zinc-500">Source image</div>
                {referencePreview ? (
                  <img src={referencePreview} alt="Body Adjust source" className="max-h-56 w-full rounded-lg border hairline bg-black/30 object-contain" />
                ) : (
                  <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-amber-500/30 p-3 text-center text-xs text-zinc-500">
                    Source image is loading. If it does not appear, return to Gallery and select Body Adjust again.
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Face, pose, wardrobe, framing, scene, lighting, and unselected body regions are preserved.</p>
          </section>
        )}
        <div id="studio-sections" className={`${mobileStudioStep === "create" ? "hidden md:block" : "block"} ${editMode === "body_adjust" ? "hidden" : ""} scroll-mt-24 space-y-4`}>
      {studioProfile && <section className="pane border-cyan-400/25 p-3 sm:p-4" data-testid={`studio-${studio}-presets`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="section-label">{studioProfile.title} · Scene presets</div>
            <p className="mt-1 text-xs text-zinc-400">Choose a starting composition, then edit every detail in the steps below.</p>
          </div>
          <Link to="/studios" className="text-xs text-cyan-300 hover:underline">Other studios</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {studioProfile.presets.map((preset) => <button key={preset.name} type="button"
            onClick={() => { setActiveDna(applyStudioPreset(activeDna, preset)); setQuickReview(false); goSection(studio === "feet" ? "feet" : "watersports"); }}
            className="rounded-xl border hairline bg-black/25 px-3 py-3 text-left transition-colors hover:border-cyan-400/60 focus-visible:border-cyan-400">
            <span className="block text-xs font-semibold text-cyan-100">{preset.name}</span>
            <span className="mt-1 block text-[11px] text-zinc-400">{preset.description}</span>
          </button>)}
        </div>
      </section>}
      {desktopQuickMode && editMode !== "body_adjust" && (
        <section className="hidden md:block studio-journey rounded-2xl p-5" data-testid="desktop-quick-create">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-label">Create / Main Studio</div>
              <h2 className="font-display mt-1 text-xl font-bold text-white">Build your image</h2>
              <p className="mt-1 text-sm text-zinc-400">Seven stages from character to render. Jump to any detailed control below.</p>
            </div>
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">{activeWorkflow?.name || "Choose a model"}</span>
          </div>
          <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-cyan-300">Choose a category, then a control</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7" aria-label="Creation stages">
            {quickStages.map((stage, index) => (
              <button key={stage.key} type="button" onClick={() => selectQuickStage(index)}
                aria-current={quickStageIndex === index ? "step" : undefined}
                aria-expanded={stage.sections.length ? quickOpenCategory === stage.key : undefined}
                className={`studio-stage relative min-h-[90px] rounded-xl px-3 py-3 text-left ${quickStageIndex === index ? "studio-stage-active" : index < quickStageIndex ? "studio-stage-past" : ""}`}>
                <span className="block font-mono text-[10px] tracking-widest text-cyan-300">{String(index + 1).padStart(2, "0")} / 07</span>
                <span className="mt-2 block font-display text-sm font-bold text-white">{stage.title}</span>
                <span className="mt-0.5 block text-[11px] text-zinc-400">{stage.detail}</span>
              </button>
            ))}
          </div>
          {quickOpenCategory !== "review" && (
            <div className="studio-subcategories mt-3 flex flex-wrap items-center gap-2 rounded-xl p-3" aria-label={`${quickStages.find((stage) => stage.key === quickOpenCategory)?.title || "Category"} controls`}>
              <span className="mr-2 text-xs font-semibold text-cyan-200">{quickStages.find((stage) => stage.key === quickOpenCategory)?.title}</span>
              {quickStages.find((stage) => stage.key === quickOpenCategory)?.sections.map((key) => {
                const section = SECTIONS.find((item) => item.key === key);
                return section && <button key={key} type="button" onClick={() => { setQuickReview(false); goSection(key); }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${activeSection === key && !quickReview ? "border-lime-400 bg-lime-400/15 text-lime-200" : "border-white/15 bg-white/[0.04] text-zinc-300 hover:border-cyan-400/60 hover:text-white"}`}>
                  {section.title}
                </button>;
              })}
            </div>
          )}
        </section>
      )}

          {desktopQuickMode && quickReview ? (
            <div className="hidden md:block pane border-cyan-400/30 p-5 space-y-4" data-testid="desktop-quick-review">
              <div className="section-label">Ready to render</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-zinc-500">Model</span><div className="font-semibold">{activeWorkflow?.name || "Select a model"}</div></div>
                <div><span className="text-zinc-500">Output</span><div className="font-semibold">{qualityTier} · {activeRecipeFamily === "image" ? `${renderCount} image${renderCount === 1 ? "" : "s"}` : activeRecipeFamily}</div></div>
              </div>
              <div className="rounded-xl border hairline bg-black/40 p-3 text-xs leading-relaxed text-zinc-300 max-h-44 overflow-y-auto">{finalPositive || "Choose the subject and scene to build a prompt."}</div>
              {mobileCreateIssues.length > 0 && <div className="text-xs text-rose-300">{mobileCreateIssues.join(" ")}</div>}
              <button type="button" onClick={doDispatch} disabled={dispatching || !workflowId || mobileCreateIssues.length > 0}
                className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-40">
                {dispatching ? "Rendering…" : "Render images"}
              </button>
              {activeRender && (
                <div className="border-t hairline pt-4" data-testid="quick-create-result">
                  <div className="section-label">Latest render · {activeRender.status}</div>
                  {activeRender.error && <p className="mt-2 text-xs text-rose-300">{activeRender.error}</p>}
                  {activeRender.output_files?.[0] ? (
                    <Link to={`/gallery?render=${encodeURIComponent(activeRender.render_id || activeRender.id)}&returnTo=${encodeURIComponent(location.pathname)}`}
                      className="mt-3 inline-block max-w-sm overflow-hidden rounded-xl border border-cyan-400/30">
                      <img src={mediaUrl(activeRender.output_files[0])} alt="Latest image · open in Gallery" className="max-h-80 w-full object-contain" />
                      <span className="block p-2 text-center text-xs font-semibold text-cyan-200">Open full size in Gallery</span>
                    </Link>
                  ) : <p className="mt-2 text-xs text-zinc-400">Your image will appear here when it finishes.</p>}
                </div>
              )}
            </div>
          ) : null}
          <div key={activeSection} className={`studio-section-enter ${desktopQuickMode && quickReview ? "md:hidden" : "block"}`}>
          <div className="hidden md:flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Detail {activeIdx + 1} of {SECTIONS.length}{isMulti && ` · Subject ${activeSubject.label}`}</span>
            <span className={`uppercase tracking-widest section-label phase-${phaseOfSection(activeSection)}`}>{SECTIONS[activeIdx].title}</span>
          </div>
          <div className="hidden md:block h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${((activeIdx + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>
          {desktopQuickMode && <div className="hidden md:block">
            <SubjectSwitcher subjects={subjects} activeId={activeSubjectId} expectedCount={expectedCount}
              primaryLabel={subjects[0]?.label || "A"} onSelect={setActiveSubjectId}
              onAdd={addSubject} onRemove={removeSubject} onCopyFromPrimary={copyPrimaryToActive}
              onRandomizeActive={randomizeActive} showAddForSingle />
          </div>}
          {sectionNavigation("top")}
          {activeSection === "identity" && (
            <>
            <div className="pane p-3 sm:p-4 space-y-3" data-testid="person-scenario-setup">
              <div className="section-label">People &amp; scenario</div>
              <p className="text-xs text-zinc-400">Choose the cast and scenario, then set each person's age and appearance. The editor adds the required subjects automatically.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SECTIONS.find((section) => section.key === "scenario").fields.filter((field) => ["cast_size", "cast_type"].includes(field.key)).map((field) => (
                  <label key={field.key} className="space-y-1 text-xs text-zinc-300">
                    <span>{field.label}</span>
                    <select
                      data-testid={`person-${field.key}`}
                      value={primaryDna.scenario?.[field.key] || (field.key === "cast_size" ? "solo" : "none")}
                      onChange={(event) => setSubjects((cur) => cur.map((subject, index) => index === 0 ? {
                        ...subject,
                        dna: { ...subject.dna,
                          ...(field.key === "cast_type" && ["mother and daughter", "stepmom and stepdaughter", "grandmother, mother and daughter"].includes(event.target.value) ? { identity: { ...subject.dna.identity, age: Math.max(event.target.value === "grandmother, mother and daughter" ? 68 : 44, Number(subject.dna.identity?.age) || 44), gender: "female" } } : {}),
                          scenario: {
                          ...subject.dna.scenario,
                          [field.key]: event.target.value,
                          ...(field.key === "cast_type" && event.target.value !== "none" ? { cast_size: ["triplets", "grandmother, mother and daughter"].includes(event.target.value) ? "trio" : "duo" } : {}),
                        } },
                      } : subject))}
                      className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100"
                    >
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <button type="button" onClick={randomizePerson} data-testid="btn-randomize-person"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20">
                <Shuffle className="h-4 w-4" /> Randomize person
              </button>
              {subjects.length > 1 && <button type="button" onClick={randomizeCast} data-testid="btn-randomize-group"
                className="ml-2 inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-400/20">
                <Shuffle className="h-4 w-4" /> Randomize group · female
              </button>}
              <button type="button" onClick={randomizeScene} data-testid="btn-randomize-scene"
                className="ml-2 inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
                <Shuffle className="h-4 w-4" /> Randomize scene
              </button>
            </div>
            <div className="quick-hide"><SubjectSwitcher
              subjects={subjects}
              activeId={activeSubjectId}
              expectedCount={expectedCount}
              primaryLabel={subjects[0]?.label || "A"}
              onSelect={setActiveSubjectId}
              onAdd={addSubject}
              onRemove={removeSubject}
              onCopyFromPrimary={copyPrimaryToActive}
              onRandomizeActive={randomizeActive}
              showAddForSingle
            /></div>
            </>
          )}
          {activeSection === "pose" && expectedCount > 1 && <div className="pane p-3" data-testid="cast-aware-poses">
            <div className="section-label">Poses for {expectedCount} people</div>
            <p className="mt-1 text-xs text-zinc-400">Choose a shared composition; each person keeps separate character settings.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(expectedCount === 2
                ? ["side by side", "back to back", "facing each other", "walking together", "seated together", "embracing", "dancing together"]
                : ["group portrait", "staggered lineup", "semicircle", "walking together", "seated group", "standing at different depths", "hands joined"]
              ).map((pose) => <button key={pose} type="button" onClick={() => setSection("pose", { ...activeDna.pose, action: pose, distance: "wide shot" })}
                className={`rounded-lg border px-3 py-2 text-xs capitalize ${activeDna.pose?.action === pose ? "border-amber-400 text-amber-200" : "hairline text-zinc-300"}`}>{pose}</button>)}
            </div>
          </div>}
          {studioProfile && activeSection === studio && <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={`${studioProfile.title} controls`} data-testid="specialty-field-groups">
            {studioProfile.fieldGroups.map((group, index) => <button key={group.label} type="button" role="tab"
              aria-selected={specialtyTab === index} onClick={() => setSpecialtyTab(index)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${specialtyTab === index ? "border-amber-400 bg-amber-500/10 text-amber-100" : "hairline text-zinc-400"}`}>
              {group.label}
            </button>)}
          </div>}
          <DnaSection
            key={`${activeSubjectId}-${activeSection}`}
            section={studioProfile && activeSection === studio
              ? { ...SECTIONS[activeIdx], fields: SECTIONS[activeIdx].fields.filter((field) => studioProfile.fieldGroups[specialtyTab]?.keys.includes(field.key)) }
              : SECTIONS[activeIdx]}
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
          {sectionNavigation("bottom")}
          </div>
        </div>

        {/* Right - preview + AI + render */}
        <aside id="studio-render" className={`quick-hide ${mobileStudioStep === "create" ? "block" : "hidden md:block"} scroll-mt-24 space-y-4 lg:sticky lg:top-20 lg:h-fit`}>
          <div className={mobileStudioMode === "advanced" ? "block" : "hidden md:block"}>
            <SmartSetupPanel workflows={selectableWorkflows} activeWorkflow={activeWorkflow} dna={activeDna}
              subjectCount={subjects.length} hasReference={!!referenceImage?.name} onApply={applySmartSetup} />
          </div>
          <div className={mobileStudioMode === "advanced" || mobileStudioStep === "create" ? "block" : "hidden md:block"}>
          {activeCompiler === "krea2" && (
            <div className="pane p-4 mb-4 space-y-2" data-testid="krea-framing-control">
              <div className="section-label">Krea 2 · magazine framing</div>
              <p className="text-xs text-zinc-400">Choose the crop for every subject. Face priority keeps the face clear within this shot.</p>
              <div className="flex gap-2">
                {[["full body", "Full body"], ["knees-up", "Knees-up"], ["thigh-up", "Thigh-up"], ["waist-up", "Waist-up"]].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setKreaFraming(value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${subjects.every((subject) => subject.dna?.pose?.distance === value) ? "border-cyan-400 bg-cyan-500/15 text-cyan-100" : "hairline text-zinc-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">Selected scene details: {(activeDna.scenario?.acts || []).length + String(activeDna.scenario?.extra_acts || "").split(/[,;]+/).filter((part) => part.trim()).length}. Keep this to one main action and up to two supporting details. The preview below shows the exact prompt sent to ComfyUI.</p>
            </div>
          )}
          <div className="pane p-4 mb-4 space-y-2" data-testid="plain-language-prompt">
            <label htmlFor="plain-language-input" className="section-label">Describe it in your own words</label>
            <Textarea id="plain-language-input" rows={2} value={plainLanguage}
              onChange={(event) => setPlainLanguage(event.target.value)}
              placeholder="Example: adult subject, 3000 cc breast implants, BBL, fitted dress" />
            {translatedPlainLanguage.attributes.map((attribute) => (
              <p key={attribute.key} className="text-xs text-zinc-400">
                <span className="text-zinc-200">{attribute.source}</span> → {attribute.meaning}
              </p>
            ))}
            {plainLanguage.trim() && <p className="text-xs text-zinc-400">Workflow translation: {translatedPlainLanguage.text || "Describe motion for image-to-video; the source image supplies appearance."}</p>}
          </div>
          <PromptPreview
            aiProvider={aiProvider}
            positive={finalPositive}
            negative={finalNegative}
            dna={activeDna}
            workflow={activeWorkflow}
            context={preflightContext}
            compilerMeta={compiledPrompt}
            recipe={activeRecipeFamily === "image" ? renderSettings : null}
            selectedLora={selectedLora}
            secondaryLora={showSecondLora ? secondaryLora : null}
            imageCount={activeRecipeFamily === "image" && (!poseAssistEnabled || isVariationWorkflow) ? renderCount : 1}
            optimized={!!promptOverride}
            improving={improvingPrompt}
            onImprove={improveCompiledPrompt}
            onApplyPrompts={(nextPositive, nextNegative) => {
              setPromptOverride(nextPositive);
              setNegativePromptOverride(nextNegative);
            }}
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
                Analyze image + draft motion with {aiProvider}
              </button>
              {videoImageAnalysis && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-mono uppercase tracking-widest text-cyan-300">{aiProvider} image analysis</div>
                  {videoImageAnalysis}
                </div>
              )}
              <button type="button" onClick={enhanceVideoInstruction}
                disabled={enhancingVideo || !videoInstruction.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-40"
                data-testid="btn-venice-enhance-video">
                {enhancingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Enhance movement with {aiProvider}
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
                Expand scene with {aiProvider}
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
          {isVariationWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="image-variation-panel">
              <div className="section-label">Image Variations · Chroma</div>
              <p className="text-xs text-zinc-400">Upload the original image upright. The source sets the composition and aspect ratio. Choose multiple images above to try different seeds.</p>
              {referencePreview ? (
                <div className="relative max-w-sm rounded-lg overflow-hidden border border-hairline bg-elevated">
                  <img src={referencePreview} alt="Source for variations" className="w-full max-h-80 object-contain" />
                  <button type="button" onClick={clearReference} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white" aria-label="Remove source image"><X className="h-4 w-4" /></button>
                </div>
              ) : referenceImage?.name ? (
                <div className="text-xs text-zinc-300">Source: {referenceImage.name} <button type="button" onClick={clearReference} className="ml-2 underline">Remove</button></div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-4 text-center">
                  {referenceUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span className="text-sm">{referenceUploading ? "Uploading…" : "Choose source image"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={referenceUploading} onChange={(event) => uploadReference(event.target.files?.[0])} className="hidden" data-testid="input-variation-source" />
                </label>
              )}
              <label className="block space-y-1"><span className="text-xs text-zinc-400">What should vary?</span>
                <Textarea rows={4} value={variationPrompt} onChange={(event) => setVariationPrompt(event.target.value)} className="bg-elevated border-hairline text-sm" data-testid="textarea-variation-prompt" />
              </label>
              <label className="block space-y-2"><span className="text-xs text-zinc-400">Change strength: {variationDenoise.toFixed(2)}</span>
                <input type="range" min="0.10" max="0.45" step="0.01" value={variationDenoise} onChange={(event) => setVariationDenoise(Number(event.target.value))} className="w-full" data-testid="slider-variation-denoise" />
                <span className="block text-[11px] text-zinc-500">Start at 0.22. Lower values stay closer to the original; higher values change more details.</span>
              </label>
            </div>
          )}
          {isEnhanceWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="image-repair-panel">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <div className="section-label">Image Repair & Enhance</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload an image, select only the areas that need correction, and optionally let {aiProvider} inspect it before Qwen performs the repair.
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
                  placeholder={`Optional: describe a specific defect or leave this blank and ask ${aiProvider} to inspect the selected areas.`}
                  className="bg-elevated border-hairline text-sm"
                  data-testid="textarea-repair-instruction" />
              </label>
              <button type="button" onClick={analyzeRepairImage}
                disabled={analyzingRepair || !referenceImage?.name}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40"
                data-testid="btn-venice-analyze-repair">
                {analyzingRepair ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Inspect image and draft repair with {aiProvider}
              </button>
              {repairAnalysis && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-zinc-300">
                  <div className="mb-1 font-mono uppercase tracking-widest text-cyan-300">{aiProvider} inspection</div>
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
              <div className="grid grid-cols-3 gap-1 rounded-lg border hairline bg-elevated p-1" role="tablist" aria-label="Qwen edit mode">
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
                <button type="button" onClick={() => { setEditMode("body_adjust"); setPreserveUnmentioned(true); }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${editMode === "body_adjust" ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:text-zinc-200"}`}
                  data-testid="btn-edit-mode-body-adjust">
                  Body Adjust
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
              ) : editMode === "body_adjust" ? (
                <div className="space-y-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3" data-testid="body-adjust-panel">
                  {!referenceImage?.name && (
                    <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-2 text-[11px] text-amber-100">
                      Body Adjust needs a source image. Choose one from Gallery or upload a reference before rendering.
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-amber-100">Controlled Body Adjustment</div>
                    <div className="mt-1 text-[11px] text-zinc-400">Edits the source image instead of regenerating it from the original seed.</div>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      ["glutes", "Glutes"], ["bust", "Bust"], ["hips", "Hips"], ["thighs", "Thighs"], ["waist", "Waist"],
                    ].map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setBodyAdjustRegion(value)}
                        className={`rounded-md border px-2 py-2 text-[11px] font-semibold ${bodyAdjustRegion === value ? "border-amber-400 bg-amber-500/15 text-amber-100" : "border-hairline text-zinc-400"}`}
                        data-testid={`btn-body-adjust-${value}`}>{label}</button>
                    ))}
                  </div>
                  <label className="block space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-widest text-zinc-500 font-mono">Selected-region change · 50 = original</span>
                      <span className="font-mono text-amber-200">{bodyAdjustAmount}/100</span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={bodyAdjustAmount}
                      onChange={(event) => setBodyAdjustAmount(Number(event.target.value))}
                      className="w-full accent-amber-400" data-testid="range-body-adjust" />
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <span>0 · smaller</span><span>50 · original</span><span>100 · larger</span>
                    </div>
                  </label>
                  <div className="rounded-md border hairline bg-black/20 p-2 text-[11px] text-zinc-300">
                    <span className="font-semibold text-zinc-100">Edit instruction: </span>{bodyAdjustInstruction}
                  </div>
                  <p className="text-[10px] text-zinc-500">Face, pose, wardrobe, framing, scene, lighting, and unselected body regions are explicitly preserved.</p>
                </div>
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
                          {poseReferenceAnalysis ? "Analyze pose again" : `Extract pose with ${aiProvider}`}
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
                {editMode === "new_pose" ? "Protected pose instruction active" : `Enhance instruction with ${aiProvider}`}
              </button>}
              {editMode === "standard" && <p className="text-[11px] text-zinc-500">
                {aiProvider} only rewrites the instruction. Review and edit it before rendering.
              </p>}
            </div>
          )}
          {isFaceWorkflow && (
            <div className="pane p-4 space-y-4" data-testid="face-reference-panel">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-amber-400" />
                <div className="section-label">Keep this character · Face Preserve</div>
              </div>
              <p className="text-xs text-zinc-400">
                Upload a clear photograph of one adult face. The photo is sent directly to your local ComfyUI input folder.
              </p>
              <p className="text-xs text-amber-200/80">Adjust the character’s pose, expression, or wardrobe in the editor. Face Preserve uses this image to guide facial identity; results may still vary with the model and reference quality.</p>
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
          </div>
          {batchRenders.length > 1 && (
            <div className="pane p-4 space-y-3" data-testid="batch-render-progress">
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
                      <div className="text-xs text-zinc-500">{Math.round(((completed + failed) / batchRenders.length) * 100)}% processed</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${((completed + failed) / batchRenders.length) * 100}%` }}
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
                            <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-white">{render.status}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeRender && (!poseAssistEnabled || poseAssistStage === "done") && (
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
                      <img key={i} src={mediaUrl(u)} alt="render" className="rounded-md border hairline w-full h-auto" />
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
