import axios from "axios";

const configuredBackend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
// An HTTPS-installed PWA cannot call an HTTP backend (mixed content). In that
// case use the app's own origin; the frontend proxy forwards /api to FastAPI.
const BACKEND_URL =
  typeof window !== "undefined" && window.location.protocol === "https:" && configuredBackend.startsWith("http:")
    ? browserOrigin
    : configuredBackend || browserOrigin;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // FastAPI expects repeated query params for List types: ?tag=a&tag=b
  paramsSerializer: {
    serialize: (params) => {
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
        else usp.append(k, v);
      });
      return usp.toString();
    },
  },
});

export const endpoints = {
  recoverRenderImage: (id, body) => api.post(`/renders/${id}/recover`, body).then((r) => r.data),
  mediaLibraryHealth: () => api.get("/media-library/health").then((r) => r.data),
  mediaLibraryStats: () => api.get("/media-library/stats").then((r) => r.data),
  mediaLibraryList: (params = {}) => api.get("/media-library/media", { params }).then((r) => r.data),
  mediaLibraryFolders: (params = {}) => api.get("/media-library/folders", { params }).then((r) => r.data),
  mediaLibraryItem: (id) => api.get(`/media-library/media/${id}`).then((r) => r.data),
  mediaLibraryThumbnailUrl: (id) => `${API_BASE}/media-library/media/${id}/thumbnail`,
  mediaLibraryOriginalUrl: (id) => `${API_BASE}/media-library/media/${id}/original`,
  settings: () => api.get("/settings").then((r) => r.data),
  ollamaModels: () => api.get("/ollama/models").then((r) => r.data),
  updateSettings: (body) => api.put("/settings", body).then((r) => r.data),
  comfyHealth: () => api.get("/comfyui/health").then((r) => r.data),
  listCharacters: (params = {}) => api.get("/characters", { params }).then((r) => r.data),
  listCharacterTags: () => api.get("/characters/tags").then((r) => r.data),
  createCharacter: (body) => api.post("/characters", body).then((r) => r.data),
  getCharacter: (id) => api.get(`/characters/${id}`).then((r) => r.data),
  updateCharacter: (id, body) => api.patch(`/characters/${id}`, body).then((r) => r.data),
  deleteCharacter: (id) => api.delete(`/characters/${id}`).then((r) => r.data),
  duplicateCharacter: (id) => api.post(`/characters/${id}/duplicate`).then((r) => r.data),
  characterRenders: (id) => api.get(`/characters/${id}/renders`).then((r) => r.data),
  listRenders: async () => {
    const results = [];
    const pageSize = 200;
    for (let skip = 0; ; skip += pageSize) {
      const batch = (await api.get("/renders", { params: { limit: pageSize, skip } })).data;
      results.push(...batch);
      if (batch.length < pageSize) return results;
    }
  },
  listQueue: () => api.get("/queue").then((r) => r.data),
  retryQueueJob: (id) => api.post(`/queue/${id}/retry`).then((r) => r.data),
  clearCompletedQueue: () => api.delete("/queue/completed").then((r) => r.data),
  deleteRender: (id, deleteFiles = false) => api.delete(`/renders/${id}`, { params: { delete_files: deleteFiles } }).then((r) => r.data),
  clearCancelledRenders: () => api.delete("/renders/cancelled").then((r) => r.data),
  deleteRenders: (ids, deleteFiles = false) => api.post("/renders/delete-bulk", { ids, delete_files: deleteFiles }).then((r) => r.data),
  deleteQcFlaggedRenders: (deleteFiles = false) => api.post("/renders/delete-qc-flagged", null, { params: { delete_files: deleteFiles } }).then((r) => r.data),
  setRenderAlbum: (id, album) => api.patch(`/renders/${id}/album`, { album }).then((r) => r.data),
  setRenderAlbumBulk: (ids, album) => api.post("/renders/albums/bulk", { ids, album }).then((r) => r.data),
  getRenderVersions: (id) => api.get(`/renders/${id}/versions`).then((r) => r.data),
  dispatchRender: (body) => api.post("/renders/dispatch", body).then((r) => r.data),
  recreateRender: (id, variation = false) => api.post(`/renders/${id}/recreate`, null, { params: { variation } }).then((r) => r.data),
  prepareRenderReference: (id, outputUrl) => api.post(`/renders/${id}/prepare-reference`, { output_url: outputUrl }).then((r) => r.data),
  getRender: (id) => api.get(`/renders/${id}`).then((r) => r.data),
  getRenderRecipe: (id) => api.get(`/renders/${id}/recipe`).then((r) => r.data),
  reviewRenderAlignment: (id) => api.post(`/renders/${id}/alignment`).then((r) => r.data),
  previewMissingDetails: (id, indices) => api.post(`/renders/${id}/retry-missing/preview`, { indices }).then((r) => r.data),
  retryMissingDetails: ({ id, indices }) => api.post(`/renders/${id}/retry-missing`, { indices }).then((r) => r.data),
  previewImprovedRender: ({ id, source_prompt, instruction }) => api.post(`/renders/${id}/improve/preview`, { source_prompt, instruction }).then((r) => r.data),
  queueImprovedRender: ({ id, prompt_positive, prompt_negative }) => api.post(`/renders/${id}/improve`, { prompt_positive, prompt_negative }).then((r) => r.data),
  uploadReferenceImage: (file, sourceRenderId = "") => {
    const form = new FormData();
    form.append("image", file);
    if (sourceRenderId) form.append("source_render_id", sourceRenderId);
    return api.post("/reference-images/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  pollRender: (id) => api.post(`/renders/${id}/poll`).then((r) => r.data),
  cancelRender: (id) => api.post(`/renders/${id}/cancel`).then((r) => r.data),
  listWorkflows: () => api.get("/workflows").then((r) => r.data),
  upsertWorkflow: (body) => api.post("/workflows", body).then((r) => r.data),
  deleteWorkflow: (id) => api.delete(`/workflows/${id}`).then((r) => r.data),
  seedWorkflows: () => api.post("/workflows/seed").then((r) => r.data),
  poseAssistStatus: () => api.get("/pose-assist/status").then((r) => r.data),
  krea2Status: () => api.get("/krea2/status").then((r) => r.data),
  reorderWorkflows: (order) => api.post("/workflows/reorder", { order }).then((r) => r.data),
  workflowLoras: (id) => api.get(`/workflows/${id}/loras`).then((r) => r.data),
  comfyLoras: () => api.get("/comfyui/loras").then((r) => r.data),
  aiFreeform: (text) => api.post("/ai/freeform", { text }).then((r) => r.data),
  aiShootPlan: (body) => api.post("/ai/shoot-plan", body, { timeout: 600000 }).then((r) => r.data),
  aiSceneDraft: (text) => api.post("/ai/scene-draft", { text }).then((r) => r.data),
  aiCharacterPreset: (description, catalog) =>
    api.post("/ai/character-preset", { description, catalog }).then((r) => r.data),
  aiRefine: (dna, instruction) => api.post("/ai/refine", { dna, instruction }).then((r) => r.data),
  aiEditPrompt: (instruction, preserveUnmentioned = true, workflowKind = "edit") =>
    api.post("/ai/edit-prompt", {
      instruction,
      preserve_unmentioned: preserveUnmentioned,
      workflow_kind: workflowKind,
    }).then((r) => r.data),
  aiImproveGeneratedPrompt: (positive, negative, promptStyle, workflowName) =>
    api.post("/ai/improve-generated-prompt", {
      positive,
      negative,
      prompt_style: promptStyle,
      workflow_name: workflowName,
    }).then((r) => r.data),
  aiVideoPrompt: (instruction, mode = "image") =>
    api.post("/ai/video-prompt", { instruction, mode }).then((r) => r.data),
  aiAnalyzeVideoImage: (referenceImage, instruction = "") =>
    api.post("/ai/analyze-video-image", {
      reference_image: referenceImage,
      instruction,
    }).then((r) => r.data),
  aiAnalyzePoseReference: (referenceImage) =>
    api.post("/ai/analyze-pose-reference", { reference_image: referenceImage }).then((r) => r.data),
  aiAnalyzeRepairImage: (referenceImage, targets = [], instruction = "") =>
    api.post("/ai/analyze-repair-image", {
      reference_image: referenceImage,
      targets,
      instruction,
    }).then((r) => r.data),
  aiSuggest: (section, dna) => api.post("/ai/suggest", { section, dna }).then((r) => r.data),
  // Photo Shoots
  createShoot: (body) => api.post("/shoots", body).then((r) => r.data),
  listShoots: (params = {}) => api.get("/shoots", { params }).then((r) => r.data),
  getShoot: (id) => api.get(`/shoots/${id}`).then((r) => r.data),
  setShootCover: (id, frameIndex) => api.patch(`/shoots/${id}/cover`, { frame_index: frameIndex }).then((r) => r.data),
  downloadShootFrames: (id, frames) => api.post(`/shoots/${id}/download`, { frames }, { responseType: "blob" }).then((r) => r.data),
  deleteShoot: (id) => api.delete(`/shoots/${id}`).then((r) => r.data),
  retryShootFrame: (id, index, body = {}) => api.post(`/shoots/${id}/retry/${index}`, body).then((r) => r.data),
  // Kink presets
  listKinkPresets: () => api.get("/kink_presets").then((r) => r.data),
  createKinkPreset: (body) => api.post("/kink_presets", body).then((r) => r.data),
  deleteKinkPreset: (id) => api.delete(`/kink_presets/${id}`).then((r) => r.data),
  // Original descriptions shared between devices.
  listSavedDescriptions: () => api.get("/saved_descriptions").then((r) => r.data),
  createSavedDescription: (body) => api.post("/saved_descriptions", body).then((r) => r.data),
  deleteSavedDescription: (id) => api.delete(`/saved_descriptions/${id}`).then((r) => r.data),
  // Reusable full-character presets
  listCharacterPresets: () => api.get("/character_presets").then((r) => r.data),
  createCharacterPreset: (body) => api.post("/character_presets", body).then((r) => r.data),
  deleteCharacterPreset: (id) => api.delete(`/character_presets/${id}`).then((r) => r.data),
};
