// Ultra Studio LoRA registry.
//
// triggerWords are included only when the filename/purpose makes them reliable.
// verified:false entries stay visible in Manual mode but are never auto-selected.

const item = (id, file, family, slot, label, options = {}) => ({
  id, file, family, slot, label,
  categories: options.categories || [],
  triggerWords: options.triggerWords || [],
  defaultStrength: options.defaultStrength ?? 0.6,
  minStrength: options.minStrength ?? 0.2,
  maxStrength: options.maxStrength ?? 1,
  auto: options.auto ?? false,
  verified: options.verified ?? false,
  conflicts: options.conflicts || [],
  keywords: options.keywords || [],
});

export const LORA_REGISTRY = [
  item("flux2-turbo", "Flux_2-Turbo-LoRA_comfyui.safetensors", "flux", "required", "Flux 2 Turbo", { defaultStrength: 0.8, verified: true }),
  item("flux-lustly", "flux_lustly-ai_v1.safetensors", "flux", "action", "Flux Adult Style", { categories:["adult"], defaultStrength:0.6 }),
  item("z-pee", "Z-Image\\girls pee.safetensors", "zimage", "action", "Girls Pee", { categories:["play","watersports"], triggerWords:["urinating","visible urine stream"], keywords:["pee","peeing","piss","pissing","urinat","watersport"], defaultStrength:0.72, auto:true, verified:true }),
  item("golden-chroma", "goldenchromaV1.safetensors", "chroma", "quality", "Golden Chroma", { defaultStrength:0.7, verified:true }),
  item("faceid-sd15", "ip-adapter-faceid-plusv2_sd15_lora.safetensors", "sd15", "identity", "IP-Adapter FaceID Plus v2", { defaultStrength:1, verified:true }),

  // Curated Z-Image utility LoRAs installed by install-curated-zimage-loras.ps1.
  // Basename matching keeps these recognized regardless of their category folder.
  item("zit-hands-feet-skin", "Hands + Feet + skin v1.1.safetensors", "zimage", "quality", "Hands + Feet + Skin", { categories:["quality","anatomy","feet","skin"], triggerWords:["natural hands and feet","realistic skin texture"], keywords:["hands","fingers","feet","foot","toes","soles","skin texture","pores"], defaultStrength:0.38, auto:true, verified:true, conflicts:["z-detail-slider"] }),
  item("z-detail-slider", "Z-Detail-Slider.safetensors", "zimage", "quality", "Z Detail Slider", { categories:["quality","detail"], triggerWords:["high detail"], keywords:["high detail","detailed","intricate","sharp focus","macro"], defaultStrength:0.35, auto:true, verified:true, conflicts:["zit-hands-feet-skin"] }),
  item("z-turbo-realism", "pytorch_lora_weights.safetensors", "zimage", "quality", "Z-Image Turbo Realism", { categories:["quality","realism"], triggerWords:["realistic photography"], keywords:["photorealistic","realistic photography","editorial","portrait","natural skin"], defaultStrength:0.5, auto:true, verified:true, conflicts:["realstagram","playboy-zimage","qq-porn-master"] }),
  item("z-nsfw-master", "NSFW_master_ZIT_000008766.safetensors", "zimage", "action", "NSFW Master", { categories:["adult","play"], triggerWords:["explicit adult scene"], keywords:["explicit","pornographic","nude","naked","sex","intercourse","vulva","pussy","penis"], defaultStrength:0.62, auto:true, verified:true, conflicts:["qq-porn-master"] }),
  item("z-ass-thighs", "ass_2_loraholic.safetensors", "zimage", "body", "Ass and Thighs Slider", { categories:["body","physique"], triggerWords:["full rounded buttocks","thick thighs"], keywords:["large ass","huge ass","big butt","buttocks","pawg","thick thighs","massive thighs","meaty legs"], defaultStrength:0.48, auto:true, verified:true }),
  item("z-breast-slider", "Z-Breast-Slider.safetensors", "zimage", "body", "Breast Slider", { categories:["body","physique"], triggerWords:["natural breast shape"], keywords:["breasts","breast","bust","cleavage","flat chest","small breasts","large breasts","huge breasts"], defaultStrength:0.46, auto:true, verified:true }),
  item("z-feet-v2", "feet v2.1.safetensors", "zimage", "body", "Feet Detail V2", { categories:["feet","detail"], triggerWords:["detailed human feet","five natural toes"], keywords:["feet","foot","toes","soles","sole showcase","footjob","foot worship","pedicure"], defaultStrength:0.48, auto:true, verified:true, conflicts:["qq-foot","qq-footing"] }),

  item("qq-anal", "Z-Image\\Curated\\QQ Collection\\lora-anal.safetensors", "zimage", "action", "Anal", { categories:["play"], triggerWords:["anal sex"], keywords:["anal"], defaultStrength:0.7, auto:true, verified:true }),
  item("qq-bbc", "Z-Image\\Curated\\QQ Collection\\lora-bbc-penis.safetensors", "zimage", "body", "BBC Penis", { categories:["anatomy"], triggerWords:["BBC penis"], keywords:["bbc","large penis"], defaultStrength:0.55, auto:true, verified:true }),
  item("qq-blowjob", "Z-Image\\Curated\\QQ Collection\\lora-blowjob.safetensors", "zimage", "action", "Blowjob", { categories:["play"], triggerWords:["blowjob"], keywords:["blowjob","oral sex","fellatio"], defaultStrength:0.7, auto:true, verified:true, conflicts:["qq-blowjob2","qq-penis-blowjob"] }),
  item("qq-blowjob2", "Z-Image\\Curated\\QQ Collection\\lora-blowjob2.safetensors", "zimage", "action", "Blowjob 2", { categories:["play"], keywords:["blowjob"], defaultStrength:0.65, auto:true, verified:true, conflicts:["qq-blowjob","qq-penis-blowjob"] }),
  item("qq-bukkake", "Z-Image\\Curated\\QQ Collection\\lora-bukkake.safetensors", "zimage", "action", "Bukkake", { categories:["play","fluid"], triggerWords:["bukkake"], keywords:["bukkake"], defaultStrength:0.72, auto:true, verified:true }),
  item("qq-cum", "Z-Image\\Curated\\QQ Collection\\lora-cum.safetensors", "zimage", "action", "Cum Detail", { categories:["fluid"], triggerWords:["visible semen"], keywords:["cum","semen","creampie"], defaultStrength:0.58, auto:true, verified:true, conflicts:["qq-facial","qq-bukkake"] }),
  item("qq-cum-kiss", "Z-Image\\Curated\\QQ Collection\\lora-cum-kiss.safetensors", "zimage", "action", "Cum Kiss", { categories:["play","fluid"], triggerWords:["cum kiss"], keywords:["cum kiss","snowball"], defaultStrength:0.65, auto:true, verified:true }),
  item("qq-doggy", "Z-Image\\Curated\\QQ Collection\\lora-doggy.safetensors", "zimage", "action", "Doggy Style", { categories:["pose","play"], triggerWords:["doggy style"], keywords:["doggy","from behind"], defaultStrength:0.72, auto:true, verified:true, conflicts:["qq-pov-doggy"] }),
  item("qq-facial", "Z-Image\\Curated\\QQ Collection\\lora-facial.safetensors", "zimage", "action", "Facial", { categories:["fluid"], triggerWords:["facial cumshot"], keywords:["facial","cum on face"], defaultStrength:0.65, auto:true, verified:true, conflicts:["qq-cum","qq-bukkake"] }),
  item("qq-fisting", "Z-Image\\Curated\\QQ Collection\\lora-fisting.safetensors", "zimage", "action", "Fisting", { categories:["play"], triggerWords:["fisting"], keywords:["fisting"], defaultStrength:0.68, auto:true, verified:true }),
  item("qq-foot", "Z-Image\\Curated\\QQ Collection\\lora-foot.safetensors", "zimage", "body", "Foot Detail", { categories:["feet","detail"], triggerWords:["detailed feet","detailed toes"], keywords:["feet","foot","toes","soles"], defaultStrength:0.52, auto:true, verified:true, conflicts:["qq-footing"] }),
  item("qq-footing", "Z-Image\\Curated\\QQ Collection\\lora-footing.safetensors", "zimage", "action", "Footing", { categories:["feet","play"], triggerWords:["footjob"], keywords:["footjob","foot worship"], defaultStrength:0.62, auto:true, verified:true, conflicts:["qq-foot","z-feet-v2"] }),
  item("qq-fucking", "Z-Image\\Curated\\QQ Collection\\lora-fucking-penis.safetensors", "zimage", "action", "Penetration", { categories:["play"], triggerWords:["sexual penetration"], keywords:["penetration","intercourse","fucking"], defaultStrength:0.62, auto:true, verified:true }),
  item("qq-lick", "Z-Image\\Curated\\QQ Collection\\lora-lick.safetensors", "zimage", "action", "Licking", { categories:["play"], triggerWords:["licking"], keywords:["licking","lick"], defaultStrength:0.6, auto:true, verified:true }),
  item("qq-lick-ass", "Z-Image\\Curated\\QQ Collection\\lora-lick-ass.safetensors", "zimage", "action", "Ass Licking", { categories:["play"], triggerWords:["anilingus"], keywords:["ass licking","rimming","anilingus"], defaultStrength:0.65, auto:true, verified:true }),
  item("qq-lingerie", "Z-Image\\Curated\\QQ Collection\\lora-lingerie.safetensors", "zimage", "body", "Lingerie", { categories:["wardrobe"], triggerWords:["lingerie"], keywords:["lingerie","bra","panties","corset","babydoll"], defaultStrength:0.5, auto:true, verified:true, conflicts:["qq-panty"] }),
  item("qq-nipple-clamp", "Z-Image\\Curated\\QQ Collection\\lora-nipple-clamp.safetensors", "zimage", "action", "Nipple Clamps", { categories:["play"], triggerWords:["nipple clamps"], keywords:["nipple clamp"], defaultStrength:0.62, auto:true, verified:true }),
  item("qq-oiled-skin", "Z-Image\\Curated\\QQ Collection\\lora-oiled-skin.safetensors", "zimage", "quality", "Oiled Skin", { categories:["skin","finish"], triggerWords:["oiled glossy skin"], keywords:["oil","oiled","shiny skin","body oil"], defaultStrength:0.42, auto:true, verified:true, conflicts:["realstagram"] }),
  item("qq-open-pussy", "Z-Image\\Curated\\QQ Collection\\lora-open-pussy.safetensors", "zimage", "body", "Open Pussy", { categories:["anatomy"], triggerWords:["open pussy"], keywords:["open pussy","spread vulva","spread labia","spread pussy"], defaultStrength:0.58, auto:true, verified:true, conflicts:["qq-pussy"] }),
  item("qq-panty", "Z-Image\\Curated\\QQ Collection\\lora-panty.safetensors", "zimage", "body", "Panty", { categories:["wardrobe"], triggerWords:["panties"], keywords:["panty","panties"], defaultStrength:0.5, auto:true, verified:true, conflicts:["qq-lingerie"] }),
  item("qq-penis", "Z-Image\\Curated\\QQ Collection\\lora-penis.safetensors", "zimage", "body", "Penis Anatomy", { categories:["anatomy"], triggerWords:["detailed penis"], keywords:["penis","cock"], defaultStrength:0.55, auto:true, verified:true }),
  item("qq-penis-blowjob", "Z-Image\\Curated\\QQ Collection\\lora-penis-blowjob.safetensors", "zimage", "action", "Penis Blowjob", { categories:["play"], triggerWords:["blowjob"], keywords:["blowjob","fellatio"], defaultStrength:0.62, auto:true, verified:true, conflicts:["qq-blowjob","qq-blowjob2"] }),
  item("qq-porn-master", "Z-Image\\Curated\\QQ Collection\\lora-porn-master.safetensors", "zimage", "quality", "Porn Master", { categories:["adult","style"], triggerWords:["pornographic photography"], keywords:["explicit","pornographic","hardcore"], defaultStrength:0.4, auto:true, verified:true, conflicts:["realstagram","zit-nsfw","z-nsfw-master"] }),
  item("qq-pov-doggy", "Z-Image\\Curated\\QQ Collection\\lora-pov-doggy.safetensors", "zimage", "action", "POV Doggy", { categories:["pose","play"], triggerWords:["POV doggy style"], keywords:["pov doggy","first person doggy"], defaultStrength:0.72, auto:true, verified:true, conflicts:["qq-doggy"] }),
  item("qq-pussy", "Z-Image\\Curated\\QQ Collection\\lora-pussy.safetensors", "zimage", "body", "Vulva Detail", { categories:["anatomy","detail"], triggerWords:["detailed vulva"], keywords:["vulva","pussy","labia"], defaultStrength:0.5, auto:true, verified:true, conflicts:["qq-open-pussy"] }),
  item("qq-sex", "Z-Image\\Curated\\QQ Collection\\lora-sex.safetensors", "zimage", "action", "Sex", { categories:["play"], triggerWords:["sex"], keywords:["sex","intercourse"], defaultStrength:0.55, auto:true, verified:true }),
  item("qq-sex-machine", "Z-Image\\Curated\\QQ Collection\\lora-sex-machine.safetensors", "zimage", "action", "Sex Machine", { categories:["play"], triggerWords:["sex machine"], keywords:["sex machine","fucking machine"], defaultStrength:0.68, auto:true, verified:true }),
  item("qq-tattoo", "Z-Image\\Curated\\QQ Collection\\lora-tattoo.safetensors", "zimage", "body", "Tattoo", { categories:["appearance"], triggerWords:["detailed tattoo"], keywords:["tattoo","inked"], defaultStrength:0.5, auto:true, verified:true }),
  item("qq-tentacled", "Z-Image\\Curated\\QQ Collection\\lora-tentacled.safetensors", "zimage", "action", "Tentacles", { categories:["fantasy","play"], triggerWords:["tentacles"], keywords:["tentacle","tentacles"], defaultStrength:0.65, auto:true, verified:true }),
  item("qq-women", "Z-Image\\Curated\\QQ Collection\\lora-women.safetensors", "zimage", "body", "Women", { categories:["subject"], defaultStrength:0.4 }),

  item("minimax-turbo", "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors", "minimax", "required", "MiniMax H3 FL2V Turbo", { defaultStrength:1, verified:true }),
  item("unknown-pytorch", "pytorch_lora_weights.safetensors", "unknown", "manual", "Unidentified PyTorch LoRA"),
  item("qwen-lightning", "Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors", "qwen_edit", "required", "Qwen Edit Lightning 4-Step", { defaultStrength:1, verified:true }),
  item("realstagram", "REALSTAGRAM_ZIMG.safetensors", "zimage", "quality", "REALSTAGRAM Z-Image", { categories:["quality","realism"], triggerWords:["realistic photography"], keywords:["photorealistic","realistic","photograph","editorial"], defaultStrength:0.38, auto:true, verified:true, conflicts:["qq-oiled-skin","qq-porn-master"] }),
  item("sexgod-cowgirl", "SEXGOD_Cowgirl_Klein9b_v1.safetensors", "klein", "action", "SEXGOD Cowgirl", { categories:["pose","play"], defaultStrength:0.7 }),
  item("sexgod-flux-nude", "SexGod_Flux2D_FemaleNudeStyle_v1_2.safetensors", "flux", "body", "Flux Female Nude Style", { categories:["adult"], defaultStrength:0.65 }),
  item("sexgod-ltx-hairy", "SEXGOD_HairyGirls_LTX23_v1_2.safetensors", "ltx", "body", "LTX Hairy Girls", { categories:["appearance"], defaultStrength:0.65 }),
  item("sexgod-ideogram-nude", "SexGod_Ideogram4_FemaleNudity_v1.safetensors", "ideogram", "body", "Ideogram Female Nudity", { categories:["adult"], defaultStrength:0.65 }),
  item("sexgod-klein-edit", "SexGod_Klein9b_ImageEdit_NudityHelper_v1.safetensors", "klein_edit", "body", "Klein Image Edit Nudity Helper", { categories:["edit","adult"], defaultStrength:0.65 }),
  item("sexgod-qwen-masturbate", "SEXGOD_masturbate_QwenEdit2511_v1.safetensors", "qwen_edit", "action", "Qwen Edit Masturbation", { categories:["edit","play"], defaultStrength:0.7 }),
  item("playboy-zimage", "SexGod_PLAYBOY1980_zimage_v1.safetensors", "zimage", "quality", "Playboy 1980 Z-Image", { categories:["style","glamour"], triggerWords:["1980s Playboy glamour photography"], keywords:["playboy","1980","retro glamour"], defaultStrength:0.45, auto:true, verified:true, conflicts:["realstagram","qq-porn-master"] }),
  item("wan-high", "wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors", "wan22", "required", "Wan 2.2 LightX2V High Noise", { defaultStrength:1, verified:true }),
  item("wan-low", "wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors", "wan22", "required", "Wan 2.2 LightX2V Low Noise", { defaultStrength:1, verified:true }),
  item("zimage-distill", "z_image_turbo_distill_patch_lora_bf16.safetensors", "zimage", "required", "Z-Image Turbo Distill Patch", { defaultStrength:1, verified:true }),
  item("zit-nsfw", "ZITnsfwLoRA.safetensors", "zimage", "required", "Z-Image NSFW Base", { categories:["adult"], defaultStrength:1, verified:true }),
];

export function workflowFamily(workflow = {}) {
  const text = [workflow.name, workflow.kind, workflow.prompt_style].filter(Boolean).join(" ").toLowerCase();
  if (/z[- ]?image/.test(text)) return "zimage";
  if (/chroma/.test(text)) return "chroma";
  if (/pony/.test(text)) return "pony";
  if (/wan/.test(text) || /video/.test(text)) return "wan22";
  if (/qwen|edit|enhance/.test(text)) return "qwen_edit";
  if (/flux/.test(text)) return "flux";
  if (/face/.test(text)) return "sd15";
  return "unknown";
}

const normalized = (value) => String(value || "").toLowerCase().replaceAll("\\", "/");

// Build the recommendation index from selected VALUES only. Searching a
// serialized DNA object also searches its keys, so an empty `cum_state` field
// used to recommend Cum Detail and an empty `feet` object recommended Foot
// Detail on virtually every character.
const EMPTY_SELECTIONS = new Set([
  "", "none", "off", "default", "not set", "unspecified", "false", "null",
]);

function selectedDnaValues(value, path = [], result = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => selectedDnaValues(item, path, result));
    return result;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => selectedDnaValues(child, [...path, key], result));
    return result;
  }
  if (typeof value !== "string" && typeof value !== "number") return result;
  const text = normalized(value).trim();
  if (!text || EMPTY_SELECTIONS.has(text)) return result;
  // Numeric controls are useful context only when enabled. Zero-valued dials
  // must not make an inactive section look selected.
  if (typeof value === "number" && value <= 0) return result;
  result.push({ path: path.join("."), text });
  return result;
}

function keywordMatches(text, keyword) {
  const needle = normalized(keyword).trim();
  if (!needle) return false;
  // Registry stems such as "urinат" intentionally match longer words. Normal
  // words use boundaries so "sex" cannot accidentally match "sexy".
  if (needle.endsWith("at")) return text.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function scoreEntry(entry, selections) {
  const matches = [];
  entry.keywords.forEach((keyword) => {
    selections.forEach((selection) => {
      if (!keywordMatches(selection.text, keyword)) return;
      const words = normalized(keyword).split(/\s+/).filter(Boolean).length;
      // Longer phrases are more intentional than broad one-word matches.
      const specificity = words > 1 ? 6 + words : 2;
      // Action/play fields should decide action LoRAs; appearance fields
      // should decide body LoRAs. This prevents descriptive prose elsewhere
      // from overpowering the actual UI selection.
      const root = selection.path.split(".")[0];
      const relevantRoots = entry.slot === "action"
        ? ["scenario", "pose", "kink", "watersports", "intimate", "feet"]
        : entry.slot === "body"
          ? ["physique", "face", "hair", "skin", "intimate", "feet", "wardrobe"]
          : ["style", "lighting", "camera", "scene", "skin"];
      const sourceBonus = relevantRoots.includes(root) ? 3 : 0;
      matches.push({ keyword, path: selection.path, points: specificity + sourceBonus });
    });
  });
  const unique = [...new Map(matches.map((match) => [`${match.keyword}|${match.path}`, match])).values()];
  return {
    score: unique.reduce((total, match) => total + match.points, 0),
    matchedKeywords: [...new Set(unique.map((match) => match.keyword))],
    matchedPaths: [...new Set(unique.map((match) => match.path))],
  };
}

export const LORA_STRENGTH_BUDGETS = {
  zimage: 1.7,
  chroma: 1.2,
  pony: 1.5,
  qwen_edit: 1.2,
  wan22: 1.0,
  flux: 1.4,
  sd15: 1.4,
  unknown: 1.0,
};
const installedMatch = (entry, installed) => {
  const expected = normalized(entry.file);
  return installed.find((name) => {
    const actual = normalized(name);
    return actual === expected || actual.endsWith("/" + expected) ||
      actual.endsWith("/" + expected.split("/").pop()) || actual === expected.split("/").pop();
  });
};

const SLOT_PRIORITY = { action: 3, body: 2, quality: 1 };
const MIN_AUTO_SCORE = 5;

function rankCandidates(left, right) {
  return right.score - left.score ||
    (SLOT_PRIORITY[right.slot] || 0) - (SLOT_PRIORITY[left.slot] || 0) ||
    left.defaultStrength - right.defaultStrength;
}

export function planLoras({ workflow, dna, installed = [], stackMode = "single" }) {
  const family = workflowFamily(workflow);
  const selections = selectedDnaValues(dna || {});
  const candidates = LORA_REGISTRY
    .filter((entry) => entry.family === family && entry.auto && entry.verified)
    .map((entry) => ({ ...entry, installedName: installedMatch(entry, installed) }))
    .filter((entry) => entry.installedName)
    .map((entry) => {
      const match = scoreEntry(entry, selections);
      return { ...entry, ...match };
    })
    .filter((entry) => entry.score >= MIN_AUTO_SCORE)
    .sort(rankCandidates);

  const selected = [];
  if (stackMode === "advanced") {
    for (const slot of ["action", "body", "quality"]) {
      const choice = candidates
        .filter((entry) => entry.slot === slot)
        .find((entry) => !selected.some((picked) =>
          picked.conflicts.includes(entry.id) || entry.conflicts.includes(picked.id)
        ));
      if (choice) selected.push(choice);
    }
  } else if (candidates.length) {
    selected.push(candidates[0]);
  }

  const budget = LORA_STRENGTH_BUDGETS[family] || LORA_STRENGTH_BUDGETS.unknown;
  const plannedStrength = selected.reduce((total, entry) => total + Math.max(0, entry.defaultStrength), 0);
  if (plannedStrength > budget && plannedStrength > 0) {
    const scale = budget / plannedStrength;
    selected.forEach((entry) => {
      entry.defaultStrength = Number((entry.defaultStrength * scale).toFixed(2));
    });
  }
  selected.forEach((entry) => {
    entry.reason = entry.matchedKeywords?.length
      ? `Selected ${entry.matchedKeywords.join(", ")} in ${entry.matchedPaths.join(", ")}`
      : "Default realism finish for this workflow";
  });

  return {
    family,
    budget,
    totalStrength: selected.reduce((total, entry) => total + Math.max(0, entry.defaultStrength), 0),
    selected,
    matches: candidates
      .slice()
      .sort(rankCandidates),
    stackMode,
    minimumScore: MIN_AUTO_SCORE,
    warnings: family === "unknown"
      ? ["This workflow has no verified LoRA compatibility profile. Use Manual mode."]
      : [],
  };
}

export function compatibleRegistryForWorkflow(workflow = {}, installed = []) {
  const family = workflowFamily(workflow);
  return LORA_REGISTRY
    .filter((entry) => entry.family === family)
    .map((entry) => ({ ...entry, installedName: installedMatch(entry, installed) }))
    .filter((entry) => entry.installedName);
}

export function loraStackHealth({ workflow = {}, overrides = {}, installed = [] } = {}) {
  const family = workflowFamily(workflow);
  const budget = LORA_STRENGTH_BUDGETS[family] || LORA_STRENGTH_BUDGETS.unknown;
  const active = Object.values(overrides || {}).filter((value) =>
    value?.lora_name && Math.abs(Number(value?.strength_model || 0)) > 0
  ).map((value) => {
    const entry = LORA_REGISTRY.find((candidate) => installedMatch(candidate, [value.lora_name]));
    return { ...value, entry };
  });
  const optional = active.filter(({ entry }) => entry && !["required", "identity"].includes(entry.slot));
  const totalStrength = optional.reduce((total, value) => total + Math.abs(Number(value.strength_model || 0)), 0);
  const warnings = [];

  active.forEach(({ entry, lora_name: name, strength_model: strength }) => {
    if (!entry) {
      warnings.push(`${name} is not in the compatibility registry; verify it manually.`);
      return;
    }
    if (entry.family !== family) warnings.push(`${entry.label} is for ${entry.family}, not ${family}.`);
    if (Math.abs(Number(strength)) > entry.maxStrength) {
      warnings.push(`${entry.label} is above its verified ${entry.maxStrength.toFixed(2)} strength.`);
    }
  });

  for (let index = 0; index < active.length; index += 1) {
    const left = active[index].entry;
    if (!left) continue;
    for (let other = index + 1; other < active.length; other += 1) {
      const right = active[other].entry;
      if (right && (left.conflicts.includes(right.id) || right.conflicts.includes(left.id))) {
        warnings.push(`${left.label} conflicts with ${right.label}; keep only one active.`);
      }
    }
  }
  if (totalStrength > budget) {
    warnings.push(`Optional LoRA strength ${totalStrength.toFixed(2)} exceeds the recommended ${budget.toFixed(2)} budget.`);
  }
  if (optional.length > 1) {
    warnings.push(`${optional.length} optional LoRAs are active. Single-LoRA mode is recommended to reduce distortion.`);
  }

  return {
    family,
    budget,
    totalStrength,
    activeCount: active.length,
    warnings: [...new Set(warnings)],
    status: warnings.length ? "warning" : "healthy",
  };
}

export function registryForInstalled(installed = []) {
  return LORA_REGISTRY.map((entry) => ({
    ...entry,
    installedName: installedMatch(entry, installed),
  })).filter((entry) => entry.installedName);
}
