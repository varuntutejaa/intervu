import { MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

export function JobSearchBar({
  query,
  location,
  onQueryChange,
  onLocationChange,
  onSubmit,
  onQuickSearch,
  onToggleFilters,
}: {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: () => void;
  onQuickSearch: (query: string, location: string) => void;
  onToggleFilters: () => void;
}) {
  return (
    <section className="w-full bg-white px-6 pb-10 pt-28 sm:px-8 sm:pt-32 md:px-12 lg:px-20 xl:px-[120px]">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-fustat text-3xl font-bold text-black sm:text-4xl">Find your next role</h2>
        <p className="mt-2 text-sm text-black/50">Handpicked tech roles across every experience level.</p>

        <div className="mx-auto mt-8 flex h-14 w-full max-w-[720px] items-stretch overflow-hidden rounded-2xl border border-black/10 bg-brand-gray">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-5">
            <Search className="h-4 w-4 shrink-0 text-black/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Search by title, skill, or company"
              className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
            />
          </div>

          <div className="w-px shrink-0 bg-black/10" />

          <div className="flex w-[190px] shrink-0 items-center gap-2 px-5">
            <MapPin className="h-4 w-4 shrink-0 text-black/40" />
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Location"
              className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onSubmit}
            className="shrink-0 bg-accent px-8 text-sm font-bold text-white transition-colors hover:bg-accent-soft"
          >
            Search
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className="flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium text-black/60 transition-colors hover:bg-black/10 hover:text-black lg:hidden"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => onQuickSearch("intern", "")}
            className="flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs text-black/50 transition-colors hover:bg-black/10 hover:text-black"
          >
            <RotateCcw className="h-3 w-3" />
            intern
          </button>
        </div>
      </div>
    </section>
  );
}
