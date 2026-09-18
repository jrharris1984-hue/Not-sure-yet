import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Sparkles, Save, X, Shuffle, Lock, LockOpen, Loader2,
  SkipForward,
} from "lucide-react";
import { endpoints } from "@/lib/api";
import {
  SECTIONS, DEFAULT_DNA, subjectsFromCharacter, makeSubject, subjectLabel,
  randomizeSection, expectedSubjectCount, seedSubjectFromPairing, MAX_SUBJECTS,
} from "@/lib/dna";
import CharacterPortrait from "@/components/CharacterPortrait";

// Flatten SECTIONS → an ordered array of steps { section, field }.
// Text fields (open notes) are kept but styled differently — they aren't skipped so
// the user can still name the character etc.
function flattenSteps() {
  const out = [];
  SECTIONS.forEach((sec) => {
    sec.fields.forEach((field) => {
      out.push({ section: sec.key, sectionTitle: sec.title, field });
    });
  });
  return out;
}

// Optional stock-image references per option (Unsplash direct URLs, curated).
// Falls back to a gradient tile when no match. Only a handful mapped — the rest
// use the auto-gradient. Keeping this minimal to avoid heavy asset dependency.
const IMAGE_MAP = {
  ethnicity: {
    latina: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format",
    "east asian": "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&auto=format",
    black: "https://images.unsplash.com/photo-1499651681375-8afc5a4db253?w=400&auto=format",
    white: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format",
    "middle eastern": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format",
    "south asian": "https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&auto=format",
  },
  body_type: {
    hourglass: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format",
    athletic: "https://images.unsplash.com/photo-1518310383802-640c2de311b6?w=400&auto=format",
    slim: "https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=400&auto=format",
    curvy: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400&auto=format",
    pear: "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=400&auto=format",
  },
  outfit_preset: {
    nude: null,
    lingerie: "https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?w=400&auto=format",
    bikini: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=400&auto=format",
    "sexy schoolgirl": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=400&auto=format",
    dominatrix: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&auto=format",
    "cocktail dress": "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format",
  },
  environment: {
    beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format",
    forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&auto=format",
    bedroom: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&auto=format",
    "urban street": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format",
    rooftop: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=400&auto=format",
    "neon alley": "https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=400&auto=format",
    studio: "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400&auto=format",
    castle: "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400&auto=format",
    desert: "https://images.unsplash.com/photo-1547235001-d703406d3b2c?w=400&auto=format",
    warehouse: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format",
  },
};

// Gradient palette for auto-fill tiles keyed by option name (stable per string).
function gradientFor(key = "") {
  const palettes = [
    "from-rose-500/25 via-fuchsia-500/15 to-amber-500/25",
    "from-amber-500/25 via-orange-500/15 to-rose-500/25",
    "from-fuchsia-500/25 via-purple-500/15 to-indigo-500/25",
    "from-emerald-500/25 via-teal-500/15 to-sky-500/25",
    "from-sky-500/25 via-indigo-500/15 to-violet-500/25",
    "from-red-500/25 via-rose-500/15 to-pink-500/25",
  ];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

function imageForOption(fieldKey, option) {
  return IMAGE_MAP?.[fieldKey]?.[option] ?? null;
}

export default function QuickCreate() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;
  const backTo = isNew ? "/character/new/s/identity" : `/character/${id}/s/identity`;

  const [name, setName] = useState("Untitled");
  const [subjects, setSubjects] = useState(() => [makeSubject({ label: "A" })]);
  const [activeSubjectId, setActiveSubjectId] = useState(() => "");
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => flattenSteps(), []);
  const step = steps[stepIdx];

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
    setActiveSubjectId(subs[0].id);
  }, [character?.id]);

  useEffect(() => {
    if (!activeSubjectId && subjects.length) setActiveSubjectId(subjects[0].id);
  }, [subjects, activeSubjectId]);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const activeDna = activeSubject?.dna || DEFAULT_DNA;

  const setActiveDna = (nextDna) =>
    setSubjects((cur) => cur.map((s) => (s.id === activeSubjectId ? { ...s, dna: nextDna } : s)));

  const setField = (sectionKey, fieldKey, value) => {
    const nextSection = { ...(activeDna[sectionKey] || {}), [fieldKey]: value };
    setActiveDna({ ...activeDna, [sectionKey]: nextSection });
  };

  // Auto-add subject B when scenario cast_size / cast_type upgrades to multi.
  const primaryDna = subjects[0]?.dna || DEFAULT_DNA;
  useEffect(() => {
    const expected = expectedSubjectCount(primaryDna);
    if (expected > subjects.length && subjects.length < MAX_SUBJECTS) {
      const seeded = seedSubjectFromPairing(primaryDna, subjects.length);
      setSubjects((cur) => [...cur, makeSubject({ label: subjectLabel(subjects.length), dna: seeded })]);
      toast.success(`Subject ${subjectLabel(subjects.length)} added — scenario expects ${expected}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDna?.scenario?.cast_size, primaryDna?.scenario?.cast_type]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        dna: subjects[0]?.dna || {},
        field_locks: subjects[0]?.field_locks || {},
        subjects: subjects.map((s) => ({ id: s.id, label: s.label, dna: s.dna, field_locks: s.field_locks })),
        active_subject_id: activeSubjectId,
      };
      if (isNew) return endpoints.createCharacter(payload);
      return endpoints.updateCharacter(id, payload);
    },
    onSuccess: (c) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["characters"] });
      if (isNew && c?.id) nav(`/character/${c.id}/quick`, { replace: true });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const goto = (idx) => setStepIdx(Math.max(0, Math.min(steps.length - 1, idx)));
  const next = () => (stepIdx === steps.length - 1 ? finish() : goto(stepIdx + 1));
  const prev = () => goto(stepIdx - 1);
  const skip = () => next();

  const finish = async () => {
    setSaving(true);
    try {
      const c = await save.mutateAsync();
      // Hand off to the detailed builder as promised in the design brief
      const cid = c?.id || id;
      if (cid) nav(`/character/${cid}/s/identity`);
    } finally {
      setSaving(false);
    }
  };

  const currentValue = activeDna?.[step.section]?.[step.field.key];
  const isMulti = subjects.length > 1;

  return (
    <div
      data-testid="quick-create"
      className="relative min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(245,158,11,0.10) 0%, rgba(15,16,22,0) 60%), radial-gradient(900px 500px at 90% 110%, rgba(236,72,153,0.10) 0%, rgba(15,16,22,0) 60%), #0f1016",
      }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur bg-obsidian/70 border-b hairline">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => nav(backTo)}
            data-testid="btn-quick-exit"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-4 w-4" /> Exit quick create
          </button>
          <div className="section-label !text-amber-300 hidden sm:inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Quick Create
          </div>
          {isMulti && (
            <div className="flex items-center gap-1 ml-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  data-testid={`quick-subject-tab-${s.label}`}
                  className={`h-7 w-7 grid place-items-center rounded-md text-xs font-display font-bold ${
                    s.id === activeSubjectId
                      ? "bg-emerald-500/20 border border-emerald-500 text-emerald-200"
                      : "border hairline text-zinc-300 hover:bg-white/5"
                  }`}
                  title={`Subject ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <input
              data-testid="quick-input-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled"
              className="bg-elevated border border-hairline rounded-md px-3 py-1.5 text-sm w-40 sm:w-56 font-display font-bold text-zinc-100"
            />
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || saving}
              data-testid="btn-quick-save"
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-1.5 disabled:opacity-40"
            >
              {save.isPending || saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 pb-2">
          <div className="h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-400 transition-all"
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <span>Step {stepIdx + 1} of {steps.length}</span>
            <span data-testid="quick-step-section">{step.sectionTitle} · <span className="text-amber-300">{step.field.label}</span>{isMulti && ` · Subject ${activeSubject.label}`}</span>
          </div>
        </div>
      </header>

      {/* Body: 2-col on desktop (question + preview) */}
      <main className="mx-auto max-w-[1500px] px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
        <section className="min-w-0">
          <div className="mb-6 sm:mb-8">
            <div className="section-label !text-amber-300 mb-2">{step.sectionTitle}</div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-zinc-100">
              {questionTextFor(step.field)}
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{helperTextFor(step.field, isMulti && activeSubject.label)}</p>
          </div>
          <QuickField
            field={step.field}
            sectionKey={step.section}
            value={currentValue}
            onChange={(v) => setField(step.section, step.field.key, v)}
          />
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={stepIdx === 0}
              data-testid="btn-quick-prev"
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextDna = { ...activeDna, [step.section]: randomizeSection(step.section, activeDna[step.section] || {}) };
                  setActiveDna(nextDna);
                }}
                data-testid="btn-quick-randomize-section"
                className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/5"
                title="Randomize this whole section"
              >
                <Shuffle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Randomize section</span><span className="sm:hidden">Random</span>
              </button>
              <button
                type="button"
                onClick={skip}
                data-testid="btn-quick-skip"
                className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                title="Skip and keep current default"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </button>
              <button
                type="button"
                onClick={next}
                data-testid="btn-quick-next"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-5 py-2.5"
              >
                {stepIdx === steps.length - 1 ? (
                  <><span className="hidden sm:inline">Finish & open detailed builder</span><span className="sm:hidden">Finish</span></>
                ) : (
                  "Next"
                )} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="pane p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="section-label">{isMulti ? `Subject ${activeSubject.label}` : "Character"}</div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live preview</span>
            </div>
            <div className="flex justify-center">
              <CharacterPortrait dna={activeDna} size={200} />
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg text-zinc-100 truncate">{name || "Untitled"}</div>
            </div>
          </div>
          {/* Multi-subject helper */}
          {isMulti && (
            <div className="pane p-3 mt-4 text-[11px] text-zinc-400 leading-relaxed" data-testid="quick-multi-hint">
              Multi-subject scene. Switch subjects using the tabs at the top — each choice you make applies to <span className="text-emerald-300 font-semibold">Subject {activeSubject.label}</span> only.
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function questionTextFor(field) {
  const map = {
    gender: "Who are they?",
    age: "How old?",
    ethnicity: "What's their look?",
    archetype: "What's their vibe?",
    name: "Give them a name",
    height: "How tall?",
    body_type: "What body type?",
    bust: "Bust size?",
    butt: "Butt shape?",
    hips: "Hips?",
    waist: "Waist?",
    thighs: "Thighs?",
    shoulders: "Shoulders?",
    legs: "Legs?",
    muscularity: "Muscle definition",
    curves: "Curviness",
    exaggeration: "How exaggerated?",
    eye_shape: "Eye shape",
    eye_color: "Eye color",
    jawline: "Jawline",
    nose: "Nose",
    lips: "Lips",
    expression: "Their expression",
    style: "Hair style",
    length: "Hair length",
    color: "Hair color",
    bangs: "Bangs?",
    texture: "Hair texture",
    tone: "Skin tone",
    freckles: "Freckles?",
    tattoos: "Any tattoos?",
    glow: "Skin glow",
    outfit_preset: "Pick an outfit",
    top: "Top",
    bottom: "Bottom",
    underwear: "Lingerie",
    footwear: "Footwear",
    accessories: "Accessories",
    material: "Fabric / material",
    palette: "Color palette",
    fit: "How does it fit?",
    state: "Outfit state",
    action: "What are they doing?",
    angle: "Camera angle",
    distance: "How close?",
    focus: "Focus on",
    hands: "Where are their hands?",
    body_language: "Their vibe",
    cast_size: "How many in the scene?",
    cast_type: "Any pairing?",
    roleplay: "Role play?",
    acts: "Explicit acts",
    explicit_level: "How explicit? 🔥",
    kink_level: "How kinky? 🖤",
    environment: "Where are they?",
    era: "Time period",
    props: "Any props?",
    source: "Source",
    direction: "Direction",
  };
  return map[field.key] || field.label;
}

function helperTextFor(field, subjectLbl) {
  if (subjectLbl) {
    return `Subject ${subjectLbl} — pick one, or skip to keep the default. You can refine everything later in the detailed builder.`;
  }
  return "Pick one, or skip to keep the default. You can refine everything later in the detailed builder.";
}

// -------- Field renderers --------
function QuickField({ field, sectionKey, value, onChange }) {
  if (field.type === "text") {
    return (
      <input
        data-testid={`quick-input-${sectionKey}-${field.key}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Type here…`}
        className="w-full bg-elevated border border-hairline rounded-xl px-5 py-4 text-lg text-zinc-100 focus:outline-none focus:border-amber-400/60"
        autoFocus
      />
    );
  }
  if (field.type === "slider") {
    const val = Number(value ?? Math.round((field.min + field.max) / 2));
    return (
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display font-bold text-5xl text-amber-300 tabular-nums" data-testid={`quick-slider-value-${sectionKey}-${field.key}`}>{val}</span>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">{field.min} – {field.max}</span>
        </div>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={val}
          onChange={(e) => onChange(Number(e.target.value))}
          data-testid={`quick-slider-${sectionKey}-${field.key}`}
          className="w-full accent-amber-400 h-2"
        />
      </div>
    );
  }
  // chips / pose_chips / chips_multi — all rendered as big picture-cards.
  const multi = field.type === "chips_multi";
  const groups = field.groups && field.groups.length
    ? field.groups
    : [{ name: null, options: field.options || [] }];
  const currentVal = multi
    ? (Array.isArray(value) ? value : [])
    : (value || "");
  const isActive = (opt) => multi ? currentVal.includes(opt) : currentVal === opt;
  const toggle = (opt) => {
    if (multi) {
      const next = currentVal.includes(opt) ? currentVal.filter((x) => x !== opt) : [...currentVal, opt];
      onChange(next);
    } else {
      onChange(currentVal === opt ? "" : opt);
    }
  };
  return (
    <div className="space-y-6">
      {groups.map((g, gi) => (
        <div key={g.name || gi} className="space-y-2">
          {g.name && (
            <div className="section-label !text-zinc-400">{g.name}</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid={`quick-grid-${sectionKey}-${field.key}`}>
            {g.options.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                image={imageForOption(field.key, opt)}
                gradient={gradientFor(opt)}
                active={isActive(opt)}
                onClick={() => toggle(opt)}
                testId={`quick-card-${sectionKey}-${field.key}-${opt.replace(/\s+/g, "-")}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OptionCard({ label, image, gradient, active, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-200 min-h-[110px] sm:min-h-[130px] ${
        active
          ? "border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)] scale-[1.02]"
          : "border-hairline hover:border-zinc-500 hover:scale-[1.01]"
      }`}
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent ${active ? "from-amber-950/70" : ""}`} />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-70`} />
      )}
      <div className="relative h-full w-full flex items-end p-3">
        <div className="text-left">
          <div className={`font-display font-bold leading-tight ${active ? "text-amber-100" : "text-zinc-100"} text-base sm:text-lg`}>
            {label}
          </div>
        </div>
      </div>
      {active && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-400 text-black grid place-items-center text-[10px] font-bold">
          ✓
        </div>
      )}
    </button>
  );
}
