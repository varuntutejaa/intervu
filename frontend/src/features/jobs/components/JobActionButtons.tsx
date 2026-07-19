import { Bookmark } from "lucide-react";

export function SaveButton({
  isSaved,
  onToggle,
}: {
  isSaved: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        isSaved
          ? "border-accent/40 bg-accent/10 text-accent-soft"
          : "border-black/15 text-black/60 hover:border-black/25 hover:text-black"
      }`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-accent-soft" : ""}`} />
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}

export function ApplyButton({
  isApplied,
  isApplying,
  onApply,
}: {
  isApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onApply();
      }}
      disabled={isApplied || isApplying}
      className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isApplied ? "Applied" : isApplying ? "Applying…" : "Apply"}
    </button>
  );
}
