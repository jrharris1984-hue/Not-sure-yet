# Wardrobe prompt accuracy: before and after

## Scope

This change corrects 24 built-in descriptions for ordinary garments, footwear, accessories and materials. It removes unselected color, material, cut and styling details. Existing selection keys, categories, saved characters, model settings and exact render recipes are unchanged. This is the first scoped prompt-accuracy pass, not a complete semantic audit of all 2,443 choices.

New/default libraries use the revised mappings. Saved nonempty keyword overrides continue to take precedence. In **Edit Prompt Library**, expand **Review wardrobe wording**, inspect Current/Proposed text and choose **Stage unchanged defaults** (or one item). **Save library** applies the staged edits; Discard edits cancels them. A row is eligible only when its saved keywords exactly match the known old built-in phrase and neither compact override is present. Other custom wording is displayed for manual review and is never overwritten by the bulk action. This checks the active saved catalog, not only the uploaded snapshot.

## Uploaded backup comparison

Among these 24 entries: 0 match old defaults and are eligible for staging; 0 have customized wording or compact overrides; 24 already use revised/default behavior; 0 are absent. The user's backup itself is not committed or modified.

| Field | Choice | Before | After |
| --- | --- | --- | --- |
| footwear | stiletto heels | tall stiletto heels, pointed toe | stiletto heels |
| footwear | thigh-high boots | black thigh-high leather boots, stiletto heels | thigh-high boots |
| footwear | over-the-knee boots | over-the-knee black boots | over-the-knee boots |
| footwear | ankle boots | ankle boots, block heel | ankle boots |
| footwear | combat boots | chunky combat boots | combat boots |
| footwear | sneakers | trendy white sneakers | sneakers |
| footwear | platform heels | tall chunky platform heels | platform heels |
| footwear | sandals | strappy sandals | sandals |
| footwear | cowgirl boots | brown cowgirl boots | cowgirl boots |
| material | latex | shiny wet-look latex fabric, second-skin glossy black | latex fabric |
| material | fishnet | black fishnet mesh fabric | fishnet mesh fabric |
| material | chainmail | silver metallic chainmail fabric | metallic chainmail |
| material | leather | black leather, glossy grain | leather |
| top | mesh top | black mesh see-through top, fishnet fabric | mesh top |
| top | chainmail top | chainmail metal top, silver mesh armor | chainmail top |
| bottom | pencil skirt | tight pencil skirt hugging hips and thighs | pencil skirt |
| bottom | leather skirt | tight black leather mini skirt | leather skirt |
| bottom | denim shorts | tiny cutoff denim shorts | denim shorts |
| bottom | hot pants | tiny hot pants, spandex | short-cut hot pants |
| bottom | latex leggings | shiny black latex leggings, second-skin | latex leggings |
| bottom | wet look pants | shiny wet-look black pants | wet-look pants |
| accessories | gloves | elbow-length gloves | gloves |
| accessories | opera gloves | long black opera gloves | long opera gloves |
| accessories | sunglasses | designer sunglasses | sunglasses |

## Attribute scope

Compact and Scene formats now give previously unqualified attributes explicit scope: `red footwear color`, `gray hosiery color`, `leather clothing material`, `striped garment pattern`, and `40 hosiery denier`. Their selection-audit requirements use the same emitted phrases. User-authored keywords and explicit short/tag overrides retain their exact wording. Detailed compilers retain their existing attribute composition; corrected built-in mappings apply wherever those mappings are used.

This does not introduce per-garment color controls or infer colors for unspecified garments. Existing Outfit color remains a shared clothing control. Per-piece editing and complete-set decomposition belong to the later wardrobe UI phase.

## Validation

188 tests across five suites passed: mapping/migration coverage, Prompt Library editor stage/save integration, Compact, Scene and model compilers. New cross-model probes cover Standard, MOSS, Chroma, Krea2, Z-Image, FLUX.1, FLUX.2 Klein, Qwen Image, SDXL and Pony in Detailed/Compact/Scene formats. The neutral fixture retains blue cotton shirt, black trousers and sneakers without adding white footwear. Tests also preserve saved custom footwear wording and input DNA.

No GPU images were generated here. Prompt-string fidelity does not establish image-quality improvement. On Windows, use the same seed, workflow and generation settings before/after for a neutral full-body scene, checking garment color, shoe type and framing. Include a legacy saved override and a newly defaulted character. Browser desktop/mobile visual checks remain pending.
