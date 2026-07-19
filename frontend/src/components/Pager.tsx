// Windowed page numbers around the current page, plus the first and last —
// e.g. [1, "ellipsis", 4, 5, 6, "ellipsis", 12] — so a long result set
// doesn't render a button per page.
function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="rounded-full border border-black/10 px-4 py-1.5 font-medium text-black/60 transition-colors hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        Previous
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-black/30">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-medium transition-colors ${
              p === page ? "bg-black text-white" : "text-black/60 hover:bg-black/5 hover:text-black"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="rounded-full border border-black/10 px-4 py-1.5 font-medium text-black/60 transition-colors hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
