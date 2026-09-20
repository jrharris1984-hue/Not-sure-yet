import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
  settings: () => api.get("/settings").then((r) => r.data),
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
  listRenders: () => api.get("/renders").then((r) => r.data),
  listQueue: () => api.get("/queue").then((r) => r.data),
  retryQueueJob: (id) => api.post(`/queue/${id}/retry`).then((r) => r.data),
  clearCompletedQueue: () => api.delete("/queue/completed").then((r) => r.data),
  deleteRender: (id) => api.delete(`/renders/${id}`).then((r) => r.data),
  deleteRenders: (ids) => api.post("/renders/delete-bulk", { ids }).then((r) => r.data),
  dispatchRender: (body) => api.post("/renders/dispatch", body).then((r) => r.data),
  uploadReferenceImage: (file) => {
    const form = new FormData();
    form.append("image", file);
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
  reorderWorkflows: (order) => api.post("/workflows/reorder", { order }).then((r) => r.data),
  workflowLoras: (id) => api.get(`/workflows/${id}/loras`).then((r) => r.data),
  comfyLoras: () => api.get("/comfyui/loras").then((r) => r.data),
  aiFreeform: (text) => api.post("/ai/freeform", { text }).then((r) => r.data),
  aiRefine: (dna, instruction) => api.post("/ai/refine", { dna, instruction }).then((r) => r.data),
  aiEditPrompt: (instruction, preserveUnmentioned = true) =>
    api.post("/ai/edit-prompt", {
      instruction,
      preserve_unmentioned: preserveUnmentioned,
    }).then((r) => r.data),
  aiVideoPrompt: (instruction, mode = "image") =>
    api.post("/ai/video-prompt", { instruction, mode }).then((r) => r.data),
  aiAnalyzeVideoImage: (referenceImage, instruction = "") =>
    api.post("/ai/analyze-video-image", {
      reference_image: referenceImage,
      instruction,
    }).then((r) => r.data),
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
  deleteShoot: (id) => api.delete(`/shoots/${id}`).then((r) => r.data),
  retryShootFrame: (id, index, body = {}) => api.post(`/shoots/${id}/retry/${index}`, body).then((r) => r.data),
  // Kink presets
  listKinkPresets: () => api.get("/kink_presets").then((r) => r.data),
  createKinkPreset: (body) => api.post("/kink_presets", body).then((r) => r.data),
  deleteKinkPreset: (id) => api.delete(`/kink_presets/${id}`).then((r) => r.data),
};
