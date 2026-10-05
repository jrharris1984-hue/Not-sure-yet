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
  item("golden-chroma", "goldenchromaV1.safetensors", "chroma", "required", "Golden Chroma", { defaultStrength:0.7, verified:true }),

  // Krea 2 LoRAs installed for the local Krea 2 Turbo workflow. These stay
  // model-only and are intentionally single-select in the universal picker.
  item("krea-private-1970s", "Private_Magazine_1970s_v1.safetensors", "krea2", "quality", "Private Magazine · 1970s", { categories:["style","editorial"], triggerWords:["privatemag"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-private-1980s", "Private_Magazine_1980s_v1.safetensors", "krea2", "quality", "Private Magazine · 1980s", { categories:["style","editorial"], triggerWords:["privatemag"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-private-1990s", "Private_Magazine_1990s_v1.safetensors", "krea2", "quality", "Private Magazine · 1990s", { categories:["style","editorial"], triggerWords:["90s magazine photography"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-private-2000s", "Private_Magazine_2000s_v1.safetensors", "krea2", "quality", "Private Magazine · 2000s", { categories:["style","editorial"], triggerWords:["privatemag"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-freya", "Freya_Krea2.safetensors", "krea2", "body", "Freya · Krea 2", { defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-nicole", "Nicole_Nylan__OC__krea2_3345006_epoch_19.safetensors", "krea2", "body", "Nicole Nylan · Krea 2", { defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-laundromat", "Midnight_Laundromat__KREA2.safetensors", "krea2", "quality", "Midnight Laundromat · Krea 2", { categories:["style"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-retro-danish", "Krea2Retro_danish80sphoto-v2.safetensors", "krea2", "quality", "Danish 80s Photo · Krea 2", { categories:["style","retro"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-rly-briana", "RLY-thot_shot-KREA2-briana-v1-trigger-rlybriana.safetensors", "krea2", "body", "RLY Briana · Krea 2", { triggerWords:["rlybriana"], defaultStrength:0.8, maxStrength:1.5, verified:true }),
  item("krea-hanging-breasts", "Hanging breasts, huge sagging boobs for Krea2 V1.safetensors", "krea2", "body", "Hanging Breasts · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-gigantic-breasts", "Gigantic breasts, breasts expansion for Krea2 V1.safetensors", "krea2", "body", "Gigantic Breasts · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-futanari-flaccid", "Futanari flaccid penis for Krea2 V1.safetensors", "krea2", "body", "Futanari Flaccid · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-futanari-bulge", "Futanari_bulge_V2_for_Krea2_krea2_3298669_epoch_10.safetensors", "krea2", "body", "Futanari Bulge V2 · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-lngcon", "krea2_lngcon_v01_s1000.safetensors", "krea2", "body", "Krea 2 LNGCON", { defaultStrength:0.7, maxStrength:1.4, verified:true }),
  item("krea-meaty-pussy", "_Krea2__Meaty_Pussy_epoch_7.safetensors", "krea2", "body", "Meaty Pussy · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-third-person-selfie", "_Krea2__Taking_selfie_from_3rd-person_view_epoch_6.safetensors", "krea2", "quality", "Third-Person Selfie · Krea 2", { categories:["camera","selfie"], triggerWords:["th1rd-p3rson-self1e"], defaultStrength:0.75, maxStrength:1.4, verified:true }),
  item("krea-bbw", "BBW_v1_s2000_Krea2.safetensors", "krea2", "body", "BBW · Krea 2", { triggerWords:["BBW"], defaultStrength:0.7, maxStrength:1.1, verified:true }),
  item("krea-brkn-meaty-pussy", "brkn_krea2_meaty_pussy.safetensors", "krea2", "body", "BRKN Meaty Pussy · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-donghang-uniform", "donghang_uniform_krea2_3279335_epoch_10.safetensors", "krea2", "quality", "Donghang Uniform · Krea 2", { categories:["wardrobe"], triggerWords:["donghang outfit"], defaultStrength:0.8, maxStrength:1.4, verified:true }),
  item("krea-feet-v3", "krea_feet_lora_v3.safetensors", "krea2", "body", "Feet Detail V3 · Krea 2", { categories:["feet","detail"], defaultStrength:0.6, maxStrength:1.25, verified:true }),
  item("krea-69", "Krea2_69_v1.0.safetensors", "krea2", "action", "69 · Krea 2", { categories:["pose","play"], defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-cumshot", "KREA2_CUMSH0T_v1.safetensors", "krea2", "action", "Cumshot · Krea 2", { categories:["play","fluid"], triggerWords:["CUMSH0T"], defaultStrength:2.0, minStrength:0.5, maxStrength:3.5, verified:true }),
  item("krea-fingering", "Krea2_fingering_V0.1.safetensors", "krea2", "action", "Fingering · Krea 2", { categories:["play"], defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-banana-breasts", "krea2_gotd_banana_breasts_v1.safetensors", "krea2", "body", "Banana Breasts · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-butterfly-pussy", "krea2_gotd_butterfly_pussy_low.safetensors", "krea2", "body", "Butterfly Pussy · Krea 2", { triggerWords:["goddespussy"], defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-cum-on-tongue", "krea2_gotd_cum_on_tongue2.0.safetensors", "krea2", "action", "Cum on Tongue · Krea 2", { categories:["play","fluid"], triggerWords:["cumOnTongue"], defaultStrength:0.8, maxStrength:1.35, verified:true }),
  item("krea-open-panty", "krea2_gotd_openpanty.safetensors", "krea2", "action", "Open Panty · Krea 2", { categories:["wardrobe","pose"], defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-pussy-mix", "krea2_gotd_pussymix_2.0.safetensors", "krea2", "body", "Pussy Mix · Krea 2", { triggerWords:["pussyMix"], defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-spread-pussy", "krea2_gotd_spread_pussy.safetensors", "krea2", "action", "Spread Pussy · Krea 2", { categories:["pose","play"], defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-squirt-mix", "krea2_gotd_squirtmix_2.0.safetensors", "krea2", "action", "Squirt Mix · Krea 2", { categories:["play","fluid"], triggerWords:["goddessquirt"], defaultStrength:0.7, maxStrength:1.25, verified:true }),
  item("krea-yummy-anus", "krea2_gotd_yummy_anus.safetensors", "krea2", "body", "Yummy Anus · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-trans", "Krea2trans_V1.safetensors", "krea2", "body", "Trans · Krea 2", { defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-pawg", "KREA2PAWG.safetensors", "krea2", "body", "PAWG · Krea 2", { defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-turbo-svdquant", "krea2TurboSvdquant2_krea2TurboSvdquant_3101751.safetensors", "krea2", "quality", "Turbo SVD Quant · Krea 2", { categories:["utility"], defaultStrength:0.8, maxStrength:1.2, verified:true }),
  item("krea-nature-huge-breasts", "nature_huge_breasts_krea2_3267676_epoch_10.safetensors", "krea2", "body", "Natural Huge Breasts · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-pearshape", "pearshape-body-hms-krea2-V1.safetensors", "krea2", "body", "Pear-Shape Body · Krea 2", { defaultStrength:0.7, maxStrength:1.35, verified:true }),
  item("krea-pornmaster-breasts", "PornMaster_Breasts_Slider_Krea2_V1.safetensors", "krea2", "body", "PornMaster Breast Slider · Krea 2", { defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-pussy-hm", "PussyHM_krea2_epoch10.safetensors", "krea2", "body", "Pussy HM · Krea 2", { triggerWords:["Vagina"], defaultStrength:0.65, maxStrength:1.3, verified:true }),
  item("krea-seamless-pantyhose", "seamless_pantyhose_v2_krea2.safetensors", "krea2", "quality", "Seamless Pantyhose · Krea 2", { categories:["wardrobe"], triggerWords:["se@mless_p@ntyhose"], defaultStrength:0.75, maxStrength:1.4, verified:true }),
  // Version filenames and trained words checked against the supplied Civitai model metadata.
  item("krea-selfie-leak-v2", "Nude_Selfieleak_v2.safetensors", "krea2", "quality", "Selfie Aesthetic V2 · Krea 2", { categories:["camera","style"], defaultStrength:0.9, maxStrength:1.1, verified:true }),
  item("krea-breast-implanter-v3", "Krea_Breast_Implanter_v3_fix.safetensors", "krea2", "body", "Breast Implanter V3 · Krea 2", { defaultStrength:0.7, maxStrength:1.0, verified:true }),
  item("krea-milf-body", "milfbodyhms_v1.safetensors", "krea2", "body", "Mature Body · Krea 2", { defaultStrength:0.8, maxStrength:1.3, verified:true }),
  item("krea-ass-up", "ass-up-hms-V1.safetensors", "krea2", "action", "Ass Up · Krea 2", { categories:["pose"], triggerWords:["a55-up"], defaultStrength:0.7, maxStrength:1.3, verified:true }),
  item("krea-soles-pov-v2", "soles pov.safetensors", "krea2", "body", "Soles POV V2 · Krea 2", { categories:["feet","pose"], triggerWords:["soles pov"], defaultStrength:0.9, maxStrength:1.3, verified:true }),
  item("krea-squirt-fingering", "Vagina squirt and fingering for Krea2_v1.safetensors", "krea2", "action", "Squirt and Fingering · Krea 2", { categories:["play"], defaultStrength:0.8, maxStrength:1.3, verified:true }),
  item("krea-cervix", "cervix_krea2.safetensors", "krea2", "body", "Cervix · Krea 2", { defaultStrength:0.7, maxStrength:1.3, verified:true }),
  item("faceid-sd15", "ip-adapter-faceid-plusv2_sd15_lora.safetensors", "sd15", "identity", "IP-Adapter FaceID Plus v2", { defaultStrength:1, verified:true }),

  // Pony's realism LoRA is part of the bundled base workflow. The other local
  // Pony sliders remain optional one-at-a-time choices.
  item("pony-realism-base", "Pony\\Realism_Lora_By_Stable_Yogi_Pony_V2.safetensors", "pony", "required", "Pony Realism Base", { defaultStrength:0.3, verified:true }),
  item("pony-real-skin", "Pony\\real-skin-slider.safetensors", "pony", "quality", "Real Skin Slider · Pony", { defaultStrength:0.45, maxStrength:1.2, verified:true }),
  item("pony-detail-slider", "Pony\\detail-slider-lora-ponyxl-sdxl.safetensors", "pony", "quality", "Detail Slider · Pony/SDXL", { defaultStrength:0.4, maxStrength:1.2, verified:true }),
  item("pony-body-weight", "Pony\\body-weight-slider-pony.safetensors", "pony", "body", "Body Weight Slider · Pony", { defaultStrength:0.5, maxStrength:1.2, verified:true }),
  item("pony-breast-size", "Pony\\breasts-size-slider-pdxl.safetensors", "pony", "body", "Breast Size Slider · Pony", { defaultStrength:0.5, maxStrength:1.2, verified:true }),

  // Curated Z-Image utility LoRAs installed by install-curated-zimage-loras.ps1.
  // Basename matching keeps these recognized regardless of their category folder.
  item("zit-hands-feet-skin", "Hands + Feet + skin v1.1.safetensors", "zimage", "quality", "Hands + Feet + Skin", { categories:["quality","anatomy","feet","skin"], triggerWords:["natural hands and feet","realistic skin texture"], keywords:["hands","fingers","feet","foot","toes","soles","skin texture","pores"], defaultStrength:0.38, auto:true, verified:true, conflicts:["z-detail-slider"] }),
  item("z-detail-slider", "Z-Detail-Slider.safetensors", "zimage", "quality", "Z Detail Slider", { categories:["quality","detail"], triggerWords:["high detail"], keywords:["high detail","detailed","intricate","sharp focus","macro"], defaultStrength:0.35, auto:true, verified:true, conflicts:["zit-hands-feet-skin"] }),
  item("z-turbo-realism", "pytorch_lora_weights.safetensors", "zimage", "quality", "Z-Image Turbo Realism", { categories:["quality","realism"], triggerWords:["realistic photography"], keywords:["photorealistic","realistic photography","editorial","portrait","natural skin"], defaultStrength:0.5, auto:true, verified:true, conflicts:["realstagram","playboy-zimage","qq-porn-master"] }),
  item("z-nsfw-master", "NSFW_master_ZIT_000008766.safetensors", "zimage", "action", "NSFW Master", { categories:["adult","play"], triggerWords:["explicit adult scene"], keywords:["explicit","pornographic","nude","naked","sex","intercourse","vulva","pussy","penis"], defaultStrength:0.62, auto:true, verified:true, conflicts:["qq-porn-master"] }),
  item("z-ass-thighs", "ass_2_loraholic.safetensors", "zimage", "body", "Ass and Thighs Slider", { categories:["body","physique"], triggerWords:["full rounded buttocks","thick thighs"], keywords:["large ass","huge ass","big butt","buttocks","pawg","thick thighs","massive thighs","meaty legs"], defaultStrength:0.48, auto:true, verified:true }),
  item("z-breast-slider", "Z-Breast-Slider.safetensors", "zimage", "body", "Breast Slider", { categories:["body","physique"], triggerWords:["natural breast shape"], keywords:["breasts","breast","bust","cleavage","flat chest","small breasts","large breasts","huge breasts"], defaultStrength:0.46, auto:true, verified:true }),
  item("z-feet-v2", "feet v2.1.safetensors", "zimage", "body", "Feet Detail V2", { categories:["feet","detail"], triggerWords:["detailed human feet","five natural toes"], keywords:["feet","foot","toes","soles","sole showcase","footjob","foot worship","pedicure"], defaultStrength:0.48, auto:true, verified:true, conflicts:["qq-foot","qq-footing"] }),

  // Z-Image Turbo versions and trained words checked against the supplied model-page screenshots.
  // These are manual choices: several target the same body region and stacking them can distort anatomy.
  item("zit-bubble-butt", "bubble_butt_ZIT_turbo_lora_2ks_v4.safetensors", "zimage", "body", "Bubble Butt · ZIT", { categories:["body","butt"], triggerWords:["bubble butt"], defaultStrength:0.7, maxStrength:1.2, verified:true }),
  item("zit-fake-ass", "zit_fake_ass_v2.safetensors", "zimage", "body", "Fake Ass · ZIT", { categories:["body","butt"], triggerWords:["fake ass"], defaultStrength:0.7, maxStrength:1.0, verified:true }),
  item("zit-fake-breasts", "zit_fake_breasts_v2.safetensors", "zimage", "body", "Fake Breasts · ZIT", { categories:["body","bust"], triggerWords:["fake breasts"], defaultStrength:0.7, maxStrength:1.0, verified:true }),
  item("zit-gigabreasts", "GigaBreastsZit.safetensors", "zimage", "body", "Gigantic Breasts · ZIT", { categories:["body","bust"], triggerWords:["gigantic breasts"], defaultStrength:0.7, maxStrength:1.2, verified:true }),
  item("zit-huge-breasts-mix", "hbm_v3hbm_bs4_2000.safetensors", "zimage", "body", "Huge Breasts Mix V3 · ZIT", { categories:["body","bust"], triggerWords:["huge breasts"], defaultStrength:0.8, maxStrength:1.1, verified:true }),
  item("zit-hyper-gigantic", "hyper_gigantic_tits.safetensors", "zimage", "body", "Hyper Gigantic · ZIT", { categories:["body","bust"], triggerWords:["ZITHYPER"], defaultStrength:0.9, maxStrength:1.2, verified:true }),

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
  if (workflow.prompt_style === "qwen_image") return "qwen_image";
  const text = [workflow.name, workflow.kind, workflow.prompt_style].filter(Boolean).join(" ").toLowerCase();
  if (/flux[. _-]?2.*klein|flux2_klein/.test(text)) return "flux2_klein";
  if (/z[- ]?image/.test(text)) return "zimage";
  if (/krea\s*2|krea2/.test(text)) return "krea2";
  if (/chroma/.test(text)) return "chroma";
  if (/pony/.test(text)) return "pony";
  if (/sdxl|juggernaut xl/.test(text)) return "sdxl";
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
  krea2: 1.5,
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


function inferredFamilyForInstalled(name = "") {
  const value = normalized(name);
  if (/(^|\/)flux2_klein\//.test(value) || /flux[. _-]?2.*klein/.test(value)) return "flux2_klein";
  if (/(^|\/)krea2\//.test(value) || /krea\s*2|krea2/.test(value)) return "krea2";
  if (/(^|\/)z-?image\//.test(value) || /z[-_ ]?image|\bzit\b/.test(value)) return "zimage";
  if (/(^|\/)pony\//.test(value) || /pony/.test(value)) return "pony";
  if (/(^|\/)flux\//.test(value) || /flux/.test(value)) return "flux";
  if (/(^|\/)wan\//.test(value) || /wan2|lightx2v/.test(value)) return "wan22";
  // Image 2512 adapters must not be offered for the Edit 2511 model.
  if (/(^|\/)qwen[_ -]?image\//.test(value) || /qwen.*2512|qwen[-_ ]image(?![-_ ]edit)/.test(value)) return "qwen_image";
  if (/qwen/.test(value)) return "qwen_edit";
  if (/(^|\/)sd15\//.test(value) || /sd15/.test(value)) return "sd15";
  if (/(^|\/)sdxl\//.test(value) || /sdxl/.test(value)) return "sdxl";
  if (/chroma/.test(value)) return "chroma";
  return "unknown";
}

function displayNameFromFile(name = "") {
  const base = normalized(name).split("/").pop() || String(name);
  return base
    .replace(/\.safetensors$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferredTriggerWords(name = "") {
  const base = String(name).replace(/\\/g, "/").split("/").pop() || "";
  const match = base.match(/trigger[-_ ]+([a-z0-9_-]+)/i);
  if (!match) return [];
  return [match[1].replace(/\.safetensors$/i, "").replace(/[_-]+/g, " ").trim()];
}

export function compatibleInstalledLoras(workflow = {}, installed = [], preferences = {}) {
  const family = workflowFamily(workflow);
  const allowedFamilies = family === "pony" ? new Set(["pony", "sdxl"]) : new Set([family]);
  const registryMatches = compatibleRegistryForWorkflow(workflow, installed);
  const registryByInstalled = new Map(registryMatches.map((entry) => [normalized(entry.installedName), entry]));
  const results = [];

  installed.forEach((installedName) => {
    const normalizedName = normalized(installedName);
    const registered = registryByInstalled.get(normalizedName) ||
      LORA_REGISTRY.find((entry) => installedMatch(entry, [installedName]) && allowedFamilies.has(entry.family));
    const assignedFamily = preferences[normalizedName]?.family;
    const inferredFamily = assignedFamily || registered?.family || inferredFamilyForInstalled(installedName);
    if (!allowedFamilies.has(inferredFamily)) return;
    if (registered && ["required", "identity"].includes(registered.slot)) return;
    results.push({
      id: registered?.id || `local:${normalizedName}`,
      label: registered?.label || displayNameFromFile(installedName),
      family: inferredFamily,
      slot: registered?.slot || "manual",
      installedName,
      triggerWords: preferences[normalizedName]?.triggerWords ?? (registered ? registered.triggerWords : inferredTriggerWords(installedName)),
      defaultStrength: registered?.defaultStrength ?? 0.8,
      minStrength: registered?.minStrength ?? 0,
      maxStrength: registered?.maxStrength ?? 1.5,
      verified: !!registered?.verified,
      categories: registered?.categories || [],
    });
  });

  // The same file can exist in both the root LoRA folder and a family
  // subfolder. Show it only once, preferring the family-subfolder copy.
  const deduped = new Map();
  results.forEach((entry) => {
    const normalizedPath = normalized(entry.installedName);
    const basename = normalizedPath
      .split("/").pop()
      .replace(/\s*\(\d+\)(?=\.safetensors$)/, "");
    const existing = deduped.get(basename);
    const entryRegistered = !String(entry.id || "").startsWith("local:");
    const existingRegistered = existing && !String(existing.id || "").startsWith("local:");
    const entryInFamilyFolder = normalizedPath.includes(`/${family}/`) || normalizedPath.startsWith(`${family}/`);
    const existingPath = existing ? normalized(existing.installedName) : "";
    const existingInFamilyFolder = existingPath.includes(`/${family}/`) || existingPath.startsWith(`${family}/`);
    if (
      !existing ||
      (!existingRegistered && entryRegistered) ||
      (entryRegistered === existingRegistered && entryInFamilyFolder && !existingInFamilyFolder)
    ) {
      deduped.set(basename, entry);
    }
  });
  return [...deduped.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function registryForInstalled(installed = []) {
  return LORA_REGISTRY.map((entry) => ({
    ...entry,
    installedName: installedMatch(entry, installed),
  })).filter((entry) => entry.installedName);
}
