import { requirementPresent } from "@/lib/promptPriority";
import { wardrobeNudity } from "@/lib/wardrobeNudity";

const PLACEHOLDER_SEGMENTS = new Set(["none", "average", "default", "n/a", "undefined", "null"]);

const PROFILE_LIMITS = {
  sdxl: { label: "SDXL / CLIP", warningTokens: 175, hardTokens: 225 },
  chroma: { label: "Golden Chroma", warningTokens: 480, hardTokens: 512 },
  krea2: { label: "Krea 2 Turbo", warningTokens: 480, hardTokens: 640 },
  pony: { label: "Pony / CLIP", warningTokens: 180, hardTokens: 225 },
  zimage: { label: "Z-Image Turbo", warningTokens: 300, hardTokens: 420 },
  qwen_edit: { label: "Qwen Image Edit", warningTokens: 170, hardTokens: 260 },
  wan_i2v: { label: "WAN Image → Video", warningTokens: 120, hardTokens: 190 },
  wan_t2v: { label: "WAN Text → Video", warningTokens: 360, hardTokens: 480 },
  flux: { label: "Flux", warningTokens: 420, hardTokens: 512 },
  flux2_klein: { label: "FLUX.2 Klein", warningTokens: 420, hardTokens: 512 },
  default: { label: "Selected model", warningTokens: 360, hardTokens: 512 },
};

export function estimatePromptTokens(text = "") {
  return Math.round(String(text).split(/[\s,]+/).filter(Boolean).length * 1.35);
}

export function promptProfile(workflow = {}) {
  const style = String(workflow?.prompt_style || "").toLowerCase();
  const kind = String(workflow?.kind || "").toLowerCase();
  const name = String(workflow?.name || "").toLowerCase();
  const haystack = `${style} ${name}`;
  if (kind === "edit" || kind === "enhance" || style === "qwen_edit" || haystack.includes("qwen")) return "qwen_edit";
  if (kind === "video" || style === "wan_i2v") return "wan_i2v";
  if (kind === "text_video" || style === "wan_t2v") return "wan_t2v";
  if (haystack.includes("chroma")) return "chroma";
  if (style === "krea2" || haystack.includes("krea 2") || haystack.includes("krea2")) return "krea2";
  if (haystack.includes("pony")) return "pony";
  if (style === "sdxl" || style === "sdxl_dmd2" || haystack.includes("juggernaut xl")) return "sdxl";
  if (haystack.includes("z-image") || haystack.includes("z image") || haystack.includes("z_image") || style === "zimage") return "zimage";
  if (style === "flux2_klein" || haystack.includes("flux.2 klein")) return "flux2_klein";
  if (haystack.includes("flux")) return "flux";
  return "default";
}

function normalizedSegment(segment) {
  return String(segment || "").toLowerCase().replace(/[()[\]{}:._-]/g, " ").replace(/\s+/g, " ").trim();
}

export function optimizePromptText(text = "") {
  const seen = new Set();
  return String(text).split(",").map((segment) => segment.trim()).filter(Boolean).filter((segment) => {
    const key = normalizedSegment(segment);
    if (!key || PLACEHOLDER_SEGMENTS.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(", ");
}

function hasAny(text, values) {
  return values.some((value) => new RegExp(`\\b${value}\\b`, "i").test(text));
}

const issue = (severity, code, message, extra = {}) => ({ severity, code, message, ...extra });

export function analyzePromptQuality({
  positive = "",
  dna = {},
  workflow = {},
  context = {},
  compilerMeta = {},
} = {}) {
  const profile = promptProfile(workflow);
  const limits = PROFILE_LIMITS[profile];
  const tokens = estimatePromptTokens(positive);
  const cleaned = optimizePromptText(positive);
  const segments = String(positive).split(",").map(normalizedSegment).filter(Boolean);
  const duplicateCount = segments.length - new Set(segments).size;
  const issues = [];

  if (!String(positive).trim()) {
    issues.push(issue("error", "empty-prompt", "The selected workflow does not have a prompt or instruction yet.", { blocking: true }));
  }
  if (tokens > limits.hardTokens) {
    issues.push(issue("error", "length", `${limits.label} may truncate this ~${tokens}-token prompt. Move essential identity, body, and pose details earlier.`));
  } else if (tokens > limits.warningTokens) {
    issues.push(issue("warning", "length", `This ~${tokens}-token prompt is long for ${limits.label}; later details may receive less attention.`));
  }
  if (duplicateCount > 0) {
    issues.push(issue("warning", "duplicates", `${duplicateCount} repeated prompt clause${duplicateCount === 1 ? "" : "s"} dilute other details.`, { fixable: true }));
  }
  if (cleaned !== String(positive).trim() && duplicateCount === 0) {
    issues.push(issue("info", "placeholders", "Empty/default filler can be removed safely.", { fixable: true }));
  }

  const priorityPlan = compilerMeta?.priorityPlan || { mustMatch: [], important: [], detail: [] };
  const missingMust = (priorityPlan.mustMatch || [])
    .filter((item) => !(profile === "krea2" && item.key === "pose.focus"
      && String(dna?.pose?.focus || "").toLowerCase() === "face"
      && ["", "full body", "wide shot", "waist-up", "thigh-up", "knees-up"].includes(String(dna?.pose?.distance || "").toLowerCase())))
    .filter((item) => !requirementPresent(positive, item));
  const droppedImportant = (compilerMeta?.droppedClauses || []).filter((item) => item.priority === "important");
  const droppedDetail = (compilerMeta?.droppedClauses || []).filter((item) => item.priority === "detail");

  if (missingMust.length) {
    const preview = missingMust.slice(0, 3).map((item) => `${item.label}: ${item.value}`).join(", ");
    issues.push(issue(
      "warning",
      "must-match-missing",
      `${missingMust.length} must-match requirement${missingMust.length === 1 ? "" : "s"} may not be explicit in the final prompt: ${preview}.`
    ));
  }
  if (droppedImportant.length) {
    const preview = droppedImportant.slice(0, 3).map((item) => item.label).join(", ");
    issues.push(issue(
      "warning",
      "priority-trim",
      `${droppedImportant.length} important detail${droppedImportant.length === 1 ? "" : "s"} were trimmed to protect higher-priority instructions${preview ? `: ${preview}` : ""}.`
    ));
  } else if (droppedDetail.length) {
    issues.push(issue(
      "info",
      "detail-trim",
      `${droppedDetail.length} lower-priority detail${droppedDetail.length === 1 ? "" : "s"} were trimmed to keep the prompt focused.`
    ));
  }

  if (compilerMeta?.negativeStrategy === "zeroed" && context.hasNegativeOverride) {
    issues.push(issue(
      "warning",
      "negative-zeroed",
      "This workflow uses zeroed negative conditioning, so a custom negative prompt will not steer the render the same way it does in Chroma or Pony."
    ));
  }

  if (["qwen_edit", "wan_i2v"].includes(profile) && !context.hasReferenceImage) {
    issues.push(issue("error", "source-image", `${limits.label} requires an uploaded source image.`, { blocking: true }));
  }
  if (profile === "qwen_edit" && !String(context.editInstruction || "").trim()) {
    issues.push(issue("error", "edit-instruction", "Describe the exact image change before rendering.", { blocking: true }));
  }
  if (["wan_i2v", "wan_t2v"].includes(profile) && !String(context.videoInstruction || "").trim()) {
    issues.push(issue("error", "motion-instruction", "Describe the movement or video action before rendering.", { blocking: true }));
  }

  const age = Number(dna?.identity?.age || 0);
  if (age > 0 && age < 21) {
    issues.push(issue("error", "adult-age", "The subject age must be 21 or older.", { blocking: true }));
  }

  const generatedImageProfile = ["default", "sdxl", "zimage", "chroma", "krea2", "pony", "flux", "flux2_klein", "wan_t2v"].includes(profile);
  if (generatedImageProfile) {
    const explicitLevel = Number(dna?.scenario?.explicit_level || 0);
    const nudityLevel = Number(dna?.wardrobe?.nudity_level || 0);
    const outfitPreset = String(dna?.wardrobe?.outfit_preset || "").toLowerCase();
    const hasSceneAction = Boolean(dna?.scenario?.extra_acts?.trim())
      || (Array.isArray(dna?.scenario?.acts) && dna.scenario.acts.length > 0);
    const hasNudityChoice = ["nude", "topless", "bottomless"].includes(outfitPreset);
    if (explicitLevel > 0 && !hasSceneAction && !hasNudityChoice && nudityLevel < 55) {
      issues.push(issue("warning", "explicit-intent-missing", "Explicit level sets intensity but does not describe what appears in the image. Choose a Bare outfit or add specific adult scene details in Fine Tune."));
    }
    if (wardrobeNudity(dna?.wardrobe).suppressClothing && outfitPreset && !hasNudityChoice) {
      issues.push(issue("info", "nudity-overrides-outfit", "The nudity slider takes priority over the selected outfit at this level."));
    }
    const wardrobe = dna?.wardrobe || {};
    for (const [color, type, label] of [
      ["hosiery_color", "hosiery_type", "pantyhose / stocking"],
      ["heel_color", "heel_type", "heel"],
      ["glasses_color", "glasses_style", "glasses"],
    ]) {
      if (wardrobe[color] && !wardrobe[type]) {
        issues.push(issue("info", `${color}-without-type`, `Choose a ${label} type to include its selected color in the prompt.`));
      }
    }
    if (wardrobe.heel_type && wardrobe.footwear && wardrobe.footwear !== "barefoot" && wardrobe.footwear !== wardrobe.heel_type) {
      issues.push(issue("info", "heel-overrides-footwear", "Heel type takes priority over the general footwear selection."));
    }
    if (profile === "krea2" && ["portrait", "close-up"].includes(String(dna?.pose?.distance || "").toLowerCase())
      && (hasSceneAction || hasNudityChoice)) {
      issues.push(issue("warning", "explicit-framing", "Portrait or close-up framing may crop out the adult scene details. Choose full body or a wider shot if those details must be visible."));
    }
    if (profile === "krea2") {
      const distance = String(dna?.pose?.distance || "").toLowerCase();
      if (!["", "full body", "knees-up", "thigh-up", "waist-up"].includes(distance)) {
        issues.push(issue("error", "krea-framing-choice", "Choose Full body, Knees-up, Thigh-up, or Waist-up for Krea 2 before rendering.", { blocking: true }));
      }
      const framingPattern = {
        "full body": /full[- ](?:length|body)|head[- ]to[- ]toe|head to (?:feet|soles)/i,
        "knees-up": /knees[- ]up|head[- ]to[- ]knees|head to (?:the )?knees/i,
        "thigh-up": /thigh[- ]up|head[- ]to[- ]mid[- ]thigh|head to mid[- ]thigh/i,
        "waist-up": /waist[- ]up|head to (?:the )?waist/i,
      }[distance || "full body"];
      if (framingPattern && !framingPattern.test(positive)) {
        issues.push(issue("error", "krea-framing-prompt", `The final Krea 2 prompt does not clearly request ${distance || "full body"} framing. Restore the generated prompt or add that crop to your custom prompt.`, { blocking: true }));
      }
      const selectedActions = Array.isArray(dna?.scenario?.acts) ? dna.scenario.acts.length : 0;
      const extraClauses = String(dna?.scenario?.extra_acts || "").split(/[,;]+/).filter((part) => part.trim()).length;
      if (selectedActions + extraClauses > 3) {
        issues.push(issue("warning", "krea-scene-overload", "Krea 2 has several competing scene details. Choose one main action and up to two supporting details for a more reliable image."));
      }
      if ((!dna?.pose?.distance || ["full body", "knees-up", "thigh-up", "waist-up"].includes(String(dna.pose.distance).toLowerCase()))
        && String(dna?.pose?.focus || "").toLowerCase() === "face") {
        issues.push(issue("info", "krea-face-in-frame", "Face focus will keep the face clear within the selected body crop; it will not request a face close-up."));
      }
    }
    const skinTone = String(dna?.skin?.tone || "").toLowerCase();
    const lightSkin = ["fair", "pale", "porcelain", "ivory"];
    const darkSkin = ["tan", "brown", "dark", "ebony", "deep"];
    if ((lightSkin.includes(skinTone) && hasAny(positive, darkSkin)) || (darkSkin.some((t) => skinTone.includes(t)) && hasAny(positive, lightSkin))) {
      issues.push(issue("error", "skin-conflict", `The compiled prompt may conflict with the selected “${dna?.skin?.tone}” skin tone. Review Heritage and Skin before rendering.`));
    }

    if (!dna?.pose?.action) issues.push(issue("warning", "pose", "No main body position is selected, so pose consistency will be left to the model."));
    if (profile === "krea2" && !dna?.pose?.distance) {
      issues.push(issue("info", "krea-framing-default", "No framing was selected. Krea 2 will request a full-length image by default. Choose Pose → Framing if you want a portrait or close-up."));
    }
    if (!dna?.scene?.environment) issues.push(issue("info", "scene", "No environment is selected; the model will invent the setting."));
    if (!dna?.lighting?.source && !dna?.lighting?.style) issues.push(issue("info", "lighting", "No lighting setup is selected; realism may vary between seeds."));

    const outfit = String(dna?.wardrobe?.outfit_preset || "").toLowerCase();
    const garmentFields = ["top", "bottom", "underwear"].filter((key) => {
      const value = String(dna?.wardrobe?.[key] || "").toLowerCase();
      return value && value !== "none";
    });
    if (["nude", "topless", "bottomless"].includes(outfit) && garmentFields.length) {
      issues.push(issue("warning", "wardrobe-conflict", `The “${outfit}” preset conflicts with selected ${garmentFields.join(" and ")} clothing fields.`));
    }

    const distance = String(dna?.pose?.distance || "").toLowerCase();
    const framing = String(dna?.feet?.framing || "").toLowerCase();
    if (["portrait", "waist-up", "close-up", "detail shot"].includes(distance)
      && ["feet close-up", "sole close-up", "pov under foot", "low angle sole"].includes(framing)) {
      issues.push(issue("warning", "camera-conflict", `The “${distance}” crop and “${framing}” framing compete. Choose the part of the subject the camera should show first.`));
    }

    const feet = dna?.feet || {};
    const feetRequested = !!(feet.sole_presentation || feet.framing || (feet.foot_act || []).length);
    const focus = String(dna?.pose?.focus || "").toLowerCase();
    if (feetRequested && focus && !["feet", "legs", "full frame"].includes(focus)) {
      issues.push(issue("warning", "feet-focus", `Feet details are selected, but composition priority is set to “${dna.pose.focus}”. Z-Image will keep that priority and treat feet as supporting detail.`));
    }

    if (profile === "zimage") {
      const zPose = String(dna?.pose?.action || "").toLowerCase();
      const zAngle = String(dna?.pose?.angle || "").toLowerCase();
      const zDistance = String(dna?.pose?.distance || "").toLowerCase();
      const zFeetDensity = Object.values(feet).filter((value) => (
        Array.isArray(value) ? value.filter(Boolean).length > 0 : Boolean(value) && value !== "none"
      )).length;
      const zComplexPose = ["kneeling", "squatting", "bending", "lying legs up", "on back legs up"].includes(zPose);
      const zAwkwardAngle = ["pov", "over-shoulder", "back"].includes(zAngle);
      const zTightCrop = ["portrait", "waist-up", "close-up", "detail shot"].includes(zDistance);

      if (zComplexPose && zAwkwardAngle) {
        issues.push(issue("warning", "zimage-overconstrained-pose", "The pose and camera angle are both demanding. Simplifying one of them usually improves alignment."));
      }
      if (zFeetDensity > 3 && zTightCrop && focus !== "feet") {
        issues.push(issue("warning", "zimage-overconstrained-feet", "Several foot details are selected, but the current crop does not prioritize feet. Some of those details may be ignored."));
      }

      const anatomyMode = String(dna?.style?.anatomy_mode || "natural").toLowerCase();
      if (anatomyMode === "extreme") {
        issues.push(issue("warning", "zimage-anatomy-mode", "Extreme mode preserves exaggerated proportions, but the structural Human Guard still rejects extra limbs, disconnected joints, duplicated anatomy, and impossible body structure."));
      } else {
        issues.push(issue("info", "zimage-anatomy-mode", `${anatomyMode === "enhanced" ? "Enhanced" : "Natural"} Human Guard is active. Completed still images will be inspected and malformed results can be retried automatically.`));
      }

      const hands = Array.isArray(dna?.pose?.hands) ? dna.pose.hands.filter(Boolean) : [];
      if (hands.length > 1) {
        issues.push(issue("info", "zimage-hand-guard", `Z-Image guard will keep “${hands[hands.length - 1]}” and remove ${hands.length - 1} competing hand action${hands.length === 2 ? "" : "s"}.`));
      }

      const hairStyle = String(dna?.hair?.style || "").toLowerCase();
      const hairLength = String(dna?.hair?.length || "").toLowerCase();
      if (["updo", "ponytail"].includes(hairStyle) && ["pixie", "short bob"].includes(hairLength)) {
        issues.push(issue("info", "zimage-hair-guard", "Z-Image guard will remove the incompatible short hair length from the tied-up hairstyle."));
      }
      if (hairLength === "pixie" && ["wavy", "curly"].includes(hairStyle)) {
        issues.push(issue("info", "zimage-pixie-guard", "Z-Image guard will keep the pixie cut and remove the competing long wave/curl wording."));
      }

      const bust = String(dna?.physique?.bust || "").toLowerCase();
      const bustShape = String(dna?.physique?.bust_shape || "").toLowerCase();
      if (bustShape === "athletic" && !["", "flat", "small", "medium"].includes(bust)) {
        issues.push(issue("info", "zimage-bust-guard", "Z-Image guard will remove the small athletic-chest wording that conflicts with the selected larger bust size."));
      }

      const distance = String(dna?.pose?.distance || "").toLowerCase();
      const feetFraming = String(feet.framing || "").toLowerCase();
      const fullBody = ["full body", "wide shot"].includes(distance);
      const feetCloseup = ["feet close-up", "sole close-up", "pov under foot", "low angle sole"].includes(feetFraming);
      if (fullBody && feetCloseup && focus !== "feet") {
        issues.push(issue("warning", "zimage-framing-guard", "Full-body framing conflicts with the selected foot close-up. Z-Image guard will preserve full-body framing and show the feet at a realistic scale."));
      }
      if (fullBody && feetRequested && ["butt", "hips"].includes(focus)) {
        issues.push(issue("info", "zimage-composition-guard", "Z-Image guard will use a rear three-quarter full-body composition so the lower-body priority and complete feet remain physically achievable."));
      }
      const action = String(dna?.pose?.action || "").toLowerCase();
      if (["lying legs up", "on back legs up"].includes(action) && (
        ["close-up", "portrait", "waist-up", "detail shot"].includes(distance) ||
        ["over-shoulder", "pov", "back"].includes(String(dna?.pose?.angle || "").toLowerCase())
      )) {
        issues.push(issue("warning", "zimage-raised-legs-guard", "Raised legs cannot fit reliably in the selected tight/rear framing. Z-Image guard will use a full-body three-quarter view and simplified hands."));
      }
    }

    const cast = String(dna?.scenario?.cast_size || "solo").toLowerCase();
    const expected = { solo: 1, duo: 2, threesome: 3, foursome: 4, group: 3, gangbang: 3, orgy: 4 }[cast] || 1;
    const configuredSubjects = Number(context.subjectCount || 1);
    if (configuredSubjects < expected) {
      issues.push(issue("warning", "cast-count", `The scenario requests ${cast}, but only ${configuredSubjects} subject profile is configured.`));
    }
    if (configuredSubjects > 1) {
      const multiAngle = String(dna?.pose?.angle || "").toLowerCase();
      const multiDistance = String(dna?.pose?.distance || "").toLowerCase();
      const multiFocus = String(dna?.pose?.focus || "").toLowerCase();
      if (["from below", "pov"].includes(multiAngle)
          && ["full body", "wide shot"].includes(multiDistance)
          && multiFocus !== "feet") {
        issues.push(issue(
          "warning",
          "multi-perspective",
          "Multiple full-body subjects plus an extreme low/POV camera angle can enlarge foreground limbs and fuse bodies. The anatomy guard will switch to a safer three-quarter view."
        ));
      }
      if (profile === "zimage") {
        issues.push(issue(
          "info",
          "multi-model-route",
          "For two or more people, Golden Chroma is usually the more stable first-pass workflow. Z-Image remains useful for single-subject anatomy or specialty detail."
        ));
      }
    }
  }

  const errors = issues.filter((entry) => entry.severity === "error").length;
  const warnings = issues.filter((entry) => entry.severity === "warning").length;
  const blockers = issues.filter((entry) => entry.blocking);
  const score = Math.max(0, 100 - (errors * 25) - (warnings * 10));

  const mustCount = (priorityPlan.mustMatch || []).length;
  const importantCount = (priorityPlan.important || []).length;
  const alignmentPenalty =
    (errors * 18)
    + (warnings * 7)
    + (missingMust.length * 10)
    + (droppedImportant.length * 4);
  const alignmentScore = Math.max(0, Math.min(100, 100 - alignmentPenalty));
  const alignmentLabel = alignmentScore >= 90
    ? "Strong match"
    : alignmentScore >= 75
      ? "Good match with notes"
      : alignmentScore >= 55
        ? "Review alignment"
        : "Prompt overloaded";

  return {
    profile,
    profileLabel: limits.label,
    tokens,
    score,
    alignmentScore,
    alignmentLabel,
    mustCount,
    importantCount,
    droppedImportantCount: droppedImportant.length,
    droppedDetailCount: droppedDetail.length,
    missingMust,
    issues,
    blockers,
    ready: blockers.length === 0,
    cleaned,
    canAutoFix: issues.some((entry) => entry.fixable),
  };
}
