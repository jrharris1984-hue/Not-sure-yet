import { useState } from "react";
import { X, Tag } from "lucide-react";

/**
 * Chip-based tag editor. `value` is an array of strings, `onChange` gets the next array.
 */
export default function TagInput({ value = [], onChange, placeholder = "add tag", testId = "tag-input" }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const t = String(raw || "").trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) { setDraft(""); return; }
    onChange([...value, t]);
    setDraft("");
  };

  const remove = (t) => onChange(value.filter((x) => x !== t));

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      data-testid={testId}
      className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg border border-hairline bg-elevated min-h-[38px]"
    >
      <Tag className="h-3.5 w-3.5 text-zinc-500" />
      {value.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => remove(t)}
          data-testid={`${testId}-chip-${t}`}
          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-100 border border-amber-500/40 px-2 py-0.5 text-[11px] hover:bg-amber-500/25"
        >
          {t} <X className="h-3 w-3" />
        </button>
      ))}
      <input
        data-testid={`${testId}-input`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500 py-0.5"
      />
    </div>
  );
}
