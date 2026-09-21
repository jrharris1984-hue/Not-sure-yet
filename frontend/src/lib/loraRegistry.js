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

  item("qq-anal", "Z-Image\\Curated\\QQ Collection\\lora-anal.safetensors", "zimage", "action", "Anal", { categories:["play"], triggerWords:["anal sex"], keywords:["anal"], defaultStrength:0.7, auto:true, verified:true }),
  item("qq-bbc", "Z-Image\\Curated\\QQ Collection\\lora-bbc-penis.safetensors", "zimage", "body", "BBC Penis", { categories:["anatomy"], keywords:["bbc"], defaultStrength:0.55 }),
  item("qq-blowjob", "Z-Image\\Curated\\QQ Collection\\lora-blowjob.safetensors", "zimage", "action", "Blowjob", { categories:["play"], triggerWords:["blowjob"], keywords:["blowjob","oral sex","fellatio"], defaultStrength:0.7, auto:true, verified:true, conflicts:["qq-blowjob2","qq-penis-blowjob"] }),
  item("qq-blowjob2", "Z-Image\\Curated\\QQ Collection\\lora-blowjob2.safetensors", "zimage", "action", "Blowjob 2", { categories:["play"], keywords:["blowjob"], defaultStrength:0.65, conflicts:["qq-blowjob","qq-penis-blowjob"] }),
  item("qq-bukkake", "Z-Image\\Curated\\QQ Collection\\lora-bukkake.safetensors", "zimage", "action", "Bukkake", { categories:["play","fluid"], triggerWords:["bukkake"], keywords:["bukkake"], defaultStrength:0.72, auto:true, verified:true }),
  item("qq-cum", "Z-Image\\Curated\\QQ Collection\\lora-cum.safetensors", "zimage", "action", "Cum Detail", { categories:["fluid"], triggerWords:["visible semen"], keywords:["cum","semen","creampie"], defaultStrength:0.58, auto:true, verified:true, conflicts:["qq-facial","qq-bukkake"] }),
  item("qq-cum-kiss", "Z-Image\\Curated\\QQ Collection\\lora-cum-kiss.safetensors", "zimage", "action", "Cum Kiss", { categories:["play","fluid"], keywords:["cum kiss","snowball"], defaultStrength:0.65 }),
  item("qq-doggy", "Z-Image\\Curated\\QQ Collection\\lora-doggy.safetensors", "zimage", "action", "Doggy Style", { categories:["pose","play"], triggerWords:["doggy style"], keywords:["doggy","from behind"], defaultStrength:0.72, auto:true, verified:true, conflicts:["qq-pov-doggy"] }),
  item("qq-facial", "Z-Image\\Curated\\QQ Collection\\lora-facial.safetensors", "zimage", "action", "Facial", { categories:["fluid"], triggerWords:["facial cumshot"], keywords:["facial","cum on face"], defaultStrength:0.65, auto:true, verified:true, conflicts:["qq-cum","qq-bukkake"] }),
  item("qq-fisting", "Z-Image\\Curated\\QQ Collection\\lora-fisting.safetensors", "zimage", "action", "Fisting", { categories:["play"], triggerWords:["fisting"], keywords:["fisting"], defaultStrength:0.68, auto:true, verified:true }),
  item("qq-foot", "Z-Image\\Curated\\QQ Collection\\lora-foot.safetensors", "zimage", "body", "Foot Detail", { categories:["feet","detail"], triggerWords:["detailed feet","detailed toes"], keywords:["feet","foot","toes","soles"], defaultStrength:0.52, auto:true, verified:true, conflicts:["qq-footing"] }),
  item("qq-footing", "Z-Image\\Curated\\QQ Collection\\lora-footing.safetensors", "zimage", "action", "Footing", { categories:["feet","play"], keywords:["footjob","foot worship"], defaultStrength:0.62, conflicts:["qq-foot"] }),
  item("qq-fucking", "Z-Image\\Curated\\QQ Collection\\lora-fucking-penis.safetensors", "zimage", "action", "Penetration", { categories:["play"], keywords:["penetration","intercourse"], defaultStrength:0.62 }),
  item("qq-lick", "Z-Image\\Curated\\QQ Collection\\lora-lick.safetensors", "zimage", "action", "Licking", { categories:["play"], keywords:["licking"], defaultStrength:0.6 }),
  item("qq-lick-ass", "Z-Image\\Curated\\QQ Collection\\lora-lick-ass.safetensors", "zimage", "action", "Ass Licking", { categories:["play"], triggerWords:["anilingus"], keywords:["ass licking","rimming","anilingus"], defaultStrength:0.65, auto:true, verified:true }),
  item("qq-lingerie", "Z-Image\\Curated\\QQ Collection\\lora-lingerie.safetensors", "zimage", "body", "Lingerie", { categories:["wardrobe"], triggerWords:["lingerie"], keywords:["lingerie","bra","panties","corset","babydoll"], defaultStrength:0.5, auto:true, verified:true, conflicts:["qq-panty"] }),
  item("qq-nipple-clamp", "Z-Image\\Curated\\QQ Collection\\lora-nipple-clamp.safetensors", "zimage", "action", "Nipple Clamps", { categories:["play"], triggerWords:["nipple clamps"], keywords:["nipple clamp"], defaultStrength:0.62, auto:true, verified:true }),
  item("qq-oiled-skin", "Z-Image\\Curated\\QQ Collection\\lora-oiled-skin.safetensors", "zimage", "quality", "Oiled Skin", { categories:["skin","finish"], triggerWords:["oiled glossy skin"], keywords:["oil","oiled","shiny skin","body oil"], defaultStrength:0.42, auto:true, verified:true, conflicts:["realstagram"] }),
  item("qq-open-pussy", "Z-Image\\Curated\\QQ Collection\\lora-open-pussy.safetensors", "zimage", "body", "Open Pussy", { categories:["anatomy"], keywords:["open pussy","spread vulva","spread labia"], defaultStrength:0.58 }),
  item("qq-panty", "Z-Image\\Curated\\QQ Collection\\lora-panty.safetensors", "zimage", "body", "Panty", { categories:["wardrobe"], keywords:["panty","panties"], defaultStrength:0.5, conflicts:["qq-lingerie"] }),
  item("qq-penis", "Z-Image\\Curated\\QQ Collection\\lora-penis.safetensors", "zimage", "body", "Penis Anatomy", { categories:["anatomy"], keywords:["penis","cock"], defaultStrength:0.55 }),
  item("qq-penis-blowjob", "Z-Image\\Curated\\QQ Collection\\lora-penis-blowjob.safetensors", "zimage", "action", "Penis Blowjob", { categories:["play"], keywords:["blowjob","fellatio"], defaultStrength:0.62, conflicts:["qq-blowjob","qq-blowjob2"] }),
  item("qq-porn-master", "Z-Image\\Curated\\QQ Collection\\lora-porn-master.safetensors", "zimage", "quality", "Porn Master", { categories:["adult","style"], keywords:["explicit","pornographic"], defaultStrength:0.4, conflicts:["realstagram","zit-nsfw"] }),
  item("qq-pov-doggy", "Z-Image\\Curated\\QQ Collection\\lora-pov-doggy.safetensors", "zimage", "action", "POV Doggy", { categories:["pose","play"], triggerWords:["POV doggy style"], keywords:["pov doggy","first person doggy"], defaultStrength:0.72, auto:true, verified:true, conflicts:["qq-doggy"] }),
  item("qq-pussy", "Z-Image\\Curated\\QQ Collection\\lora-pussy.safetensors", "zimage", "body", "Vulva Detail", { categories:["anatomy","detail"], triggerWords:["detailed vulva"], keywords:["vulva","pussy","labia"], defaultStrength:0.5, auto:true, verified:true, conflicts:["qq-open-pussy"] }),
  item("qq-sex", "Z-Image\\Curated\\QQ Collection\\lora-sex.safetensors", "zimage", "action", "Sex", { categories:["play"], keywords:["sex","intercourse"], defaultStrength:0.55 }),
  item("qq-sex-machine", "Z-Image\\Curated\\QQ Collection\\lora-sex-machine.safetensors", "zimage", "action", "Sex Machine", { categories:["play"], triggerWords:["sex machine"], keywords:["sex machine","fucking machine"], defaultStrength:0.68, auto:true, verified:true }),
  item("qq-tattoo", "Z-Image\\Curated\\QQ Collection\\lora-tattoo.safetensors", "zimage", "body", "Tattoo", { categories:["appearance"], triggerWords:["detailed tattoo"], keywords:["tattoo","inked"], defaultStrength:0.5, auto:true, verified:true }),
  item("qq-tentacled", "Z-Image\\Curated\\QQ Collection\\lora-tentacled.safetensors", "zimage", "action", "Tentacles", { categories:["fantasy","play"], keywords:["tentacle"], defaultStrength:0.65 }),
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
const installedMatch = (entry, installed) => {
  const expected = normalized(entry.file);
  return installed.find((name) => {
    const actual = normalized(name);
    return actual === expected || actual.endsWith("/" + expected) ||
      actual.endsWith("/" + expected.split("/").pop()) || actual === expected.split("/").pop();
  });
};

export function planLoras({ workflow, dna, installed = [] }) {
  const family = workflowFamily(workflow);
  const searchable = normalized(JSON.stringify(dna || {}));
  const candidates = LORA_REGISTRY
    .filter((entry) => entry.family === family && entry.auto && entry.verified)
    .map((entry) => ({ ...entry, installedName: installedMatch(entry, installed) }))
    .filter((entry) => entry.installedName)
    .map((entry) => ({
      ...entry,
      score: entry.keywords.reduce((score, keyword) => score + (searchable.includes(keyword) ? 1 : 0), 0),
    }))
    .filter((entry) => entry.score > 0);

  const selected = [];
  for (const slot of ["quality", "body", "action"]) {
    const choices = candidates
      .filter((entry) => entry.slot === slot)
      .sort((a, b) => b.score - a.score || a.defaultStrength - b.defaultStrength);
    const choice = choices.find((entry) =>
      !selected.some((picked) => picked.conflicts.includes(entry.id) || entry.conflicts.includes(picked.id))
    );
    if (choice) selected.push(choice);
  }

  // Realistic Z-Image requests benefit from the installed finish LoRA even when
  // no literal style word is present. Never let it displace an explicit finish.
  if (family === "zimage" && !selected.some((entry) => entry.slot === "quality")) {
    const fallback = LORA_REGISTRY.find((entry) => entry.id === "realstagram");
    const installedName = fallback && installedMatch(fallback, installed);
    if (fallback && installedName) selected.unshift({ ...fallback, installedName, score: 0 });
  }

  return {
    family,
    selected,
    warnings: family === "unknown"
      ? ["This workflow has no verified LoRA compatibility profile. Use Manual mode."]
      : [],
  };
}

export function registryForInstalled(installed = []) {
  return LORA_REGISTRY.map((entry) => ({
    ...entry,
    installedName: installedMatch(entry, installed),
  })).filter((entry) => entry.installedName);
}
