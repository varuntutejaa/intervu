import { useState } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";

export function TagInput({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="mt-2 flex min-h-11 w-full flex-wrap items-center gap-2 rounded-xl border-none bg-brand-gray px-3 py-2 focus-within:ring-2 focus-within:ring-white/20">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="text-white/50 transition-colors hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm text-white placeholder:text-white/20 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
