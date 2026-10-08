import { useEffect, useMemo, useState } from "react";
import {
  CUSTOM_CAMERA_OPTIONS,
  CUSTOM_EXPRESSION_OPTIONS,
  CUSTOM_FRAMING_OPTIONS,
  CUSTOM_POSE_GROUP_OPTIONS,
  resolvePhotoshootPreset,
} from "@/lib/batchSmartPhotoshoot";

const EMPTY_SHOT = {
  title: "New shot",
  pose_group: "",
  camera_match: "",
  framing: "full body",
  expression: "",
};

const slug = value => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .slice(0, 50);

const matcherText = matcher => String(matcher?.source || "").replace(/\\\//g, "/");

function toEditablePreset(source, customPresets) {
  if (source === "__blank__") {
    return {
      key: "",
      label: "My Photoshoot",
      category: "Custom",
      description: "",
      sequence: [{ ...EMPTY_SHOT }],
    };
  }
  const resolved = resolvePhotoshootPreset(source, customPresets);
  return {
    key: resolved.custom ? resolved.key : "",
    label: resolved.label || "My Photoshoot",
    category: resolved.categoryLabel || resolved.category || "Custom",
    description: resolved.description || "",
    sequence: (resolved.sequence || []).map(item => item.raw ? { ...item.raw } : ({
      title: item.title || "Shot",
      pose_group: matcherText(item.poseGroup),
      camera_match: matcherText(item.camera),
      framing: item.framing || "",
      expression: item.expression || "",
    })),
  };
}

export default function SmartPhotoshootDesigner({
  open,
  onClose,
  sourcePreset,
  customPresets = [],
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(() => toEditablePreset(sourcePreset, customPresets));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(toEditablePreset(sourcePreset, customPresets));
  }, [open, sourcePreset, customPresets]);

  const isExistingCustom = useMemo(
    () => !!draft.key && customPresets.some(item => item.key === draft.key),
    [draft.key, customPresets]
  );

  if (!open) return null;

  const updateShot = (index, patch) => {
    setDraft(current => ({
      ...current,
      sequence: current.sequence.map((shot, shotIndex) => shotIndex === index ? { ...shot, ...patch } : shot),
    }));
  };

  const moveShot = (index, direction) => {
    setDraft(current => {
      const next = [...current.sequence];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, sequence: next };
    });
  };

  const save = async () => {
    if (!draft.label.trim() || !draft.sequence.length) return;
    setSaving(true);
    try {
      const key = draft.key || `custom_${slug(draft.label) || "photoshoot"}_${Date.now()}`;
      await onSave?.({
        ...draft,
        key,
        label: draft.label.trim(),
        category: draft.category.trim() || "Custom",
        description: draft.description.trim(),
        sequence: draft.sequence.map(shot => ({
          title: shot.title.trim() || "Shot",
          pose_group: shot.pose_group || "",
          camera_match: shot.camera_match || "",
          framing: shot.framing || "",
          expression: shot.expression || "",
        })),
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3" data-testid="smart-photoshoot-designer">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border hairline bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b hairline p-4">
          <div>
            <div className="text-sm font-semibold text-zinc-100">{isExistingCustom ? "Edit photoshoot preset" : "Create photoshoot preset"}</div>
            <div className="mt-1 text-xs text-zinc-500">Duplicate a built-in shoot or build your own shot-by-shot sequence.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border hairline px-3 py-1.5 text-xs text-zinc-300">Close</button>
        </div>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-zinc-400">Name
              <input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })}
                className="mt-1 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100" />
            </label>
            <label className="text-xs text-zinc-400">Category
              <input value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}
                placeholder="Custom, Fashion, Glamour..."
                className="mt-1 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100" />
            </label>
          </div>
          <label className="mt-3 block text-xs text-zinc-400">Description
            <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
              className="mt-1 min-h-16 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100" />
          </label>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Shot sequence</div>
              <div className="text-[11px] text-zinc-500">Each row becomes one directed shot in the preset.</div>
            </div>
            <button type="button" onClick={() => setDraft(current => ({ ...current, sequence: [...current.sequence, { ...EMPTY_SHOT }] }))}
              disabled={draft.sequence.length >= 20}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-40">
              + Add shot
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {draft.sequence.map((shot, index) => (
              <div key={index} className="rounded-xl border hairline bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveShot(index, -1)} disabled={index === 0} className="rounded border hairline px-2 py-1 text-[10px] text-zinc-300 disabled:opacity-30">Up</button>
                    <button type="button" onClick={() => moveShot(index, 1)} disabled={index === draft.sequence.length - 1} className="rounded border hairline px-2 py-1 text-[10px] text-zinc-300 disabled:opacity-30">Down</button>
                    <button type="button" onClick={() => setDraft(current => ({ ...current, sequence: current.sequence.filter((_, i) => i !== index) }))}
                      disabled={draft.sequence.length <= 1}
                      className="rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-300 disabled:opacity-30">Remove</button>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 md:grid-cols-5">
                  <label className="text-[10px] text-zinc-500 md:col-span-1">Shot name
                    <input value={shot.title} onChange={e => updateShot(index, { title: e.target.value })}
                      className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 text-xs text-zinc-100" />
                  </label>
                  <label className="text-[10px] text-zinc-500">Pose family
                    <select value={shot.pose_group} onChange={e => updateShot(index, { pose_group: e.target.value })}
                      className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 text-xs text-zinc-100">
                      {CUSTOM_POSE_GROUP_OPTIONS.map(([value, label]) => <option key={value || "any"} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] text-zinc-500">Framing
                    <select value={shot.framing} onChange={e => updateShot(index, { framing: e.target.value })}
                      className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 text-xs text-zinc-100">
                      {CUSTOM_FRAMING_OPTIONS.map(value => <option key={value || "keep"} value={value}>{value || "Keep selected"}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] text-zinc-500">Camera
                    <select value={shot.camera_match} onChange={e => updateShot(index, { camera_match: e.target.value })}
                      className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 text-xs text-zinc-100">
                      {CUSTOM_CAMERA_OPTIONS.map(([value, label]) => <option key={value || "any"} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] text-zinc-500">Expression
                    <select value={shot.expression} onChange={e => updateShot(index, { expression: e.target.value })}
                      className="mt-1 w-full rounded-md border hairline bg-elevated px-2 py-2 text-xs text-zinc-100">
                      {CUSTOM_EXPRESSION_OPTIONS.map(value => <option key={value || "keep"} value={value}>{value || "Keep selected"}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t hairline p-4">
          <div>
            {isExistingCustom && <button type="button" onClick={() => onDelete?.(draft.key)}
              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300">Delete preset</button>}
          </div>
          <button type="button" onClick={save} disabled={saving || !draft.label.trim() || !draft.sequence.length}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black disabled:opacity-40">
            {saving ? "Saving…" : isExistingCustom ? "Save changes" : "Save custom preset"}
          </button>
        </div>
      </div>
    </div>
  );
}
