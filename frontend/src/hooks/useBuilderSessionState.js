import { useState } from "react";
import { DEFAULT_DNA, makeSubject } from "@/lib/dna";
import { QWEN_CAMERA_DEFAULTS } from "@/lib/qwenReferenceEdit";
import { DEFAULT_POSE_LOCKS } from "@/lib/sameCharacterPose";
import { DEFAULT_REFERENCE_STRENGTHS } from "@/lib/referenceStudio";

const DEFAULT_VARIATION_PROMPT = "Same adult subject and same photograph. Preserve facial identity, body proportions, pose, outfit, background, camera angle, and lighting. Make only a slight natural variation in expression and small details.";

export function useBuilderSessionState({ studio = "standard" } = {}) {
  const [editorHydrated, setEditorHydrated] = useState(false);
  const [mediaImportSummary, setMediaImportSummary] = useState(null);
  const [name, setName] = useState("Untitled");
  const [subjects, setSubjects] = useState(() => [makeSubject({
    label: "A",
    dna: studio === "feet"
      ? { ...DEFAULT_DNA, feet: { ...DEFAULT_DNA.feet, composition_mode: "feet focus" }, pose: { ...DEFAULT_DNA.pose, focus: "feet", distance: "full body" } }
      : DEFAULT_DNA,
  })]);
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [locks, setLocks] = useState({});
  const [collapsed, setCollapsed] = useState(() => ({
    _glance: typeof window !== "undefined" ? window.innerWidth < 768 : false,
  }));
  const [tags, setTags] = useState([]);
  const [raunch, setRaunch] = useState(false);
  const [promptLanguage, setPromptLanguage] = useState("editorial");
  const [promptOverride, setPromptOverride] = useState("");
  const [plainLanguage, setPlainLanguage] = useState("");
  const [negativePromptOverride, setNegativePromptOverride] = useState("");
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [aiPromptSuggestion, setAiPromptSuggestion] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [activeRender, setActiveRender] = useState(null);
  const [renderCount, setRenderCount] = useState(1);
  const [batchSeedMode, setBatchSeedMode] = useState("explore");
  const [batchRenders, setBatchRenders] = useState([]);
  const [selectedBatchRenderId, setSelectedBatchRenderId] = useState(null);
  const [postRenderBusy, setPostRenderBusy] = useState("");
  const [randomProfile, setRandomProfile] = useState("adventurous");
  const [workflowId, setWorkflowId] = useState("");
  const [loraOverrides, setLoraOverrides] = useState({});
  const [selectedLora, setSelectedLora] = useState({ name: "", strength: 0.8, triggerWords: [] });
  const [secondaryLora, setSecondaryLora] = useState({ name: "", strength: 0.8, triggerWords: [] });
  const [showSecondLora, setShowSecondLora] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  const [sourceRenderId, setSourceRenderId] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState(DEFAULT_VARIATION_PROMPT);
  const [variationDenoise, setVariationDenoise] = useState(0.22);
  const [faceStrength, setFaceStrength] = useState(1.1);
  const [faceIdV2Strength, setFaceIdV2Strength] = useState(1.4);
  const [editInstruction, setEditInstruction] = useState("");
  const [editMode, setEditMode] = useState("standard");
  const [qwenCamera, setQwenCamera] = useState(QWEN_CAMERA_DEFAULTS);
  const [qwenReferenceNotes, setQwenReferenceNotes] = useState("");
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
  const [chromaSettings, setChromaSettings] = useState({
    width: 768, height: 1152, steps: 26, cfg: 3.8, batchSize: 1, sampler: "euler", seed: "",
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
    setQwenCamera({ ...QWEN_CAMERA_DEFAULTS, ...(draft.qwenCamera || {}) });
    setQwenReferenceNotes(draft.qwenReferenceNotes || "");
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

  return {
    editorHydrated, setEditorHydrated, mediaImportSummary, setMediaImportSummary,
    name, setName, subjects, setSubjects, activeSubjectId, setActiveSubjectId,
    locks, setLocks, collapsed, setCollapsed, tags, setTags, raunch, setRaunch,
    promptLanguage, setPromptLanguage, promptOverride, setPromptOverride,
    plainLanguage, setPlainLanguage, negativePromptOverride, setNegativePromptOverride,
    improvingPrompt, setImprovingPrompt, aiPromptSuggestion, setAiPromptSuggestion,
    dispatching, setDispatching, activeRender, setActiveRender, renderCount, setRenderCount,
    batchSeedMode, setBatchSeedMode, batchRenders, setBatchRenders,
    selectedBatchRenderId, setSelectedBatchRenderId, postRenderBusy, setPostRenderBusy,
    randomProfile, setRandomProfile, workflowId, setWorkflowId, loraOverrides, setLoraOverrides,
    selectedLora, setSelectedLora, secondaryLora, setSecondaryLora, showSecondLora, setShowSecondLora,
    referenceImage, setReferenceImage, sourceRenderId, setSourceRenderId,
    referencePreview, setReferencePreview, referenceUploading, setReferenceUploading,
    variationPrompt, setVariationPrompt, variationDenoise, setVariationDenoise,
    faceStrength, setFaceStrength, faceIdV2Strength, setFaceIdV2Strength,
    editInstruction, setEditInstruction, editMode, setEditMode, qwenCamera, setQwenCamera,
    qwenReferenceNotes, setQwenReferenceNotes, bodyAdjustRegion, setBodyAdjustRegion,
    bodyAdjustAmount, setBodyAdjustAmount, poseTarget, setPoseTarget, poseNotes, setPoseNotes,
    poseLocks, setPoseLocks, referenceStudioView, setReferenceStudioView,
    referenceRecipe, setReferenceRecipe, referenceStrengths, setReferenceStrengths,
    poseReferenceImage, setPoseReferenceImage, poseReferencePreview, setPoseReferencePreview,
    poseReferenceUploading, setPoseReferenceUploading, poseReferenceAnalysis, setPoseReferenceAnalysis,
    analyzingPoseReference, setAnalyzingPoseReference, preserveUnmentioned, setPreserveUnmentioned,
    enhancingEdit, setEnhancingEdit, repairTargets, setRepairTargets,
    repairInstruction, setRepairInstruction, repairStrength, setRepairStrength,
    repairAnalysis, setRepairAnalysis, analyzingRepair, setAnalyzingRepair,
    videoInstruction, setVideoInstruction, videoFrames, setVideoFrames, videoFps, setVideoFps,
    videoWidth, setVideoWidth, videoHeight, setVideoHeight, qualityTier, setQualityTier,
    poseAssistEnabled, setPoseAssistEnabled, poseAssistStrength, setPoseAssistStrength,
    poseAssistPolish, setPoseAssistPolish, poseAssistStage, setPoseAssistStage,
    installingPoseAssist, setInstallingPoseAssist, galleryRecipeMode, setGalleryRecipeMode,
    enhancingVideo, setEnhancingVideo, analyzingVideoImage, setAnalyzingVideoImage,
    videoImageAnalysis, setVideoImageAnalysis, chromaSettings, setChromaSettings, restoreDraft,
  };
}
