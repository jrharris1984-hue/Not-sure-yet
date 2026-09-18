// Stylized SVG silhouette + trait chip stack. Driven purely by DNA:
//   skin.tone → silhouette fill
//   physique.body_type + physique.exaggeration → torso curve
//   hair.color + hair.length → hair shape + tint
//   wardrobe.outfit_preset → tiny label under portrait
// Zero external assets — always renders, even for a fresh DNA.

const SKIN_HEX = {
  porcelain: "#f7dcc4",
  fair: "#f0c9a8",
  olive: "#d3a984",
  tan: "#c08862",
  bronze: "#a26a44",
  "dark brown": "#7a4a2a",
  ebony: "#4a2a18",
};
const HAIR_HEX = {
  "jet black": "#0f0f14",
  chestnut: "#5a3220",
  auburn: "#7a3820",
  "fiery red": "#c14a1a",
  "platinum blonde": "#e8dcbf",
  "honey blonde": "#c99a55",
  silver: "#b8bcc4",
  raven: "#151520",
  ombre: "#3a2418",
};

function hairShape(length) {
  // A path drawn over the head area, differs by hair length.
  switch (length) {
    case "pixie":
    case "short bob":
      return "M60 62 Q100 32 140 62 Q145 88 140 100 Q100 88 60 100 Q55 88 60 62 Z";
    case "shoulder":
      return "M55 60 Q100 28 145 60 Q152 130 148 158 L138 160 Q140 118 130 100 Q100 92 70 100 Q60 118 62 160 L52 158 Q48 130 55 60 Z";
    case "long":
      return "M50 58 Q100 24 150 58 Q158 190 155 220 L138 224 Q142 130 130 100 Q100 92 70 100 Q58 130 62 224 L45 220 Q42 190 50 58 Z";
    case "waist-length":
      return "M48 56 Q100 20 152 56 Q162 240 158 270 L140 272 Q145 140 130 100 Q100 90 70 100 Q55 140 60 272 L42 270 Q38 240 48 56 Z";
    default:
      return "M55 60 Q100 26 145 60 Q152 110 148 132 L140 134 Q142 118 130 102 Q100 92 70 102 Q58 118 60 134 L52 132 Q48 110 55 60 Z";
  }
}

function torsoPath(bodyType, exaggeration = 0) {
  // Curve strength driven by "curvy" body types or high exaggeration.
  const curvy = ["hourglass", "voluptuous", "pear", "curvy", "bombshell"].includes(bodyType);
  const slim = ["slim", "athletic"].includes(bodyType);
  const ex = Number(exaggeration) || 0;
  let waistX = 78;
  let hipX = 68;
  if (slim) { waistX = 80; hipX = 76; }
  if (curvy) { waistX = 68; hipX = 52; }
  if (ex > 60) { waistX -= 6; hipX -= 8; }
  if (ex > 85) { waistX -= 4; hipX -= 6; }
  // Symmetric torso: shoulders → waist (inward) → hips (outward) → thighs
  return `M${100 - 40} 145
          Q${100 - 30} 155, ${waistX} 190
          Q${hipX} 220, ${hipX - 4} 250
          L${hipX + 6} 290
          L${200 - (hipX + 6)} 290
          L${200 - (hipX - 4)} 250
          Q${200 - hipX} 220, ${200 - waistX} 190
          Q${200 - (100 - 30)} 155, ${200 - (100 - 40)} 145 Z`;
}

export default function CharacterPortrait({ dna = {}, size = 260, label, className = "" }) {
  const skinTone = dna?.skin?.tone || "olive";
  const hairColor = dna?.hair?.color || "jet black";
  const hairLen = dna?.hair?.length || "long";
  const bodyType = dna?.physique?.body_type || "hourglass";
  const ex = dna?.physique?.exaggeration || 0;
  const outfit = dna?.wardrobe?.outfit_preset || "";
  const age = dna?.identity?.age;
  const ethnicity = dna?.identity?.ethnicity;

  const skinFill = SKIN_HEX[skinTone] || "#c08862";
  const hairFill = HAIR_HEX[hairColor] || "#3a2418";

  const hairD = hairShape(hairLen);
  const torsoD = torsoPath(bodyType, ex);

  return (
    <div
      data-testid="character-portrait"
      className={`relative inline-flex flex-col items-center gap-2 ${className}`}
    >
      <div className="relative">
        {/* Warm cinematic backdrop with amber glow */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "radial-gradient(circle at 50% 40%, rgba(245,158,11,0.14) 0%, rgba(15,16,22,0.9) 60%, rgba(15,16,22,1) 100%)",
          }}
        />
        <svg
          viewBox="0 0 200 320"
          width={size}
          height={size * 1.6}
          className="relative drop-shadow-[0_10px_40px_rgba(245,158,11,0.15)]"
          data-testid="character-portrait-svg"
        >
          <defs>
            <linearGradient id="skinShade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={skinFill} stopOpacity="1" />
              <stop offset="100%" stopColor={skinFill} stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="hairShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hairFill} stopOpacity="1" />
              <stop offset="100%" stopColor={hairFill} stopOpacity="0.75" />
            </linearGradient>
          </defs>
          {/* Head */}
          <ellipse cx="100" cy="80" rx="40" ry="52" fill="url(#skinShade)" />
          {/* Hair — drawn AFTER head so it overlaps forehead */}
          <path d={hairD} fill="url(#hairShade)" />
          {/* Neck */}
          <rect x="88" y="125" width="24" height="24" fill={skinFill} opacity="0.9" />
          {/* Torso silhouette */}
          <path d={torsoD} fill="url(#skinShade)" />
          {/* Subtle collarbone hint */}
          <path d="M78 148 Q100 152, 122 148" stroke={skinFill} strokeOpacity="0.4" strokeWidth="1" fill="none" />
          {/* Eyes hint — two small ovals for personality */}
          <ellipse cx="85" cy="75" rx="3" ry="1.6" fill="#0f1016" opacity="0.7" />
          <ellipse cx="115" cy="75" rx="3" ry="1.6" fill="#0f1016" opacity="0.7" />
          {/* Lip suggestion */}
          <path d="M92 96 Q100 100 108 96" stroke="#7a2a2a" strokeOpacity="0.7" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {label && (
        <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          {label}
        </div>
      )}
      {(age || ethnicity || bodyType || outfit) && (
        <div className="flex flex-wrap gap-1 justify-center max-w-[220px]" data-testid="portrait-chip-stack">
          {age && <span className="chip chip-body !py-0.5 !px-2 !text-[10px] !min-h-0">{age}yo</span>}
          {ethnicity && <span className="chip chip-body !py-0.5 !px-2 !text-[10px] !min-h-0">{ethnicity}</span>}
          {bodyType && <span className="chip chip-body !py-0.5 !px-2 !text-[10px] !min-h-0">{bodyType}</span>}
          {outfit && <span className="chip chip-style !py-0.5 !px-2 !text-[10px] !min-h-0">{outfit}</span>}
        </div>
      )}
    </div>
  );
}
