import { Bookmark, X } from "lucide-react";

const EXPERIENCE_OPTIONS = ["Fresher", "1-3 Years", "3-5 Years", "5-10 Years"];
const WORK_MODE_OPTIONS = ["Onsite", "Remote", "Hybrid"];
const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract"];

export type JobFacetState = {
  experience: string[];
  workMode: string[];
  jobType: string[];
  minSalary: string;
  maxSalary: string;
  // Bookmarking has no backend model (see hooks/useSavedJobs.ts) — this
  // filters the already-fetched page client-side rather than a server query.
  savedOnly: boolean;
};

export const EMPTY_FACETS: JobFacetState = {
  experience: [],
  workMode: [],
  jobType: [],
  minSalary: "",
  maxSalary: "",
  savedOnly: false,
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="font-grotesk text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
      <div className="mt-2.5 space-y-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2.5 text-sm text-black/70">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(toggleValue(selected, option))}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-black/20 text-accent accent-accent focus:ring-accent/40"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

export function JobFiltersSidebar({
  facets,
  onChange,
  onClearAll,
}: {
  facets: JobFacetState;
  onChange: (facets: JobFacetState) => void;
  onClearAll: () => void;
}) {
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(facets.savedOnly
      ? [{ key: "saved", label: "Saved jobs", onRemove: () => onChange({ ...facets, savedOnly: false }) }]
      : []),
    ...facets.experience.map((v) => ({
      key: `exp-${v}`,
      label: v,
      onRemove: () => onChange({ ...facets, experience: facets.experience.filter((x) => x !== v) }),
    })),
    ...facets.workMode.map((v) => ({
      key: `wm-${v}`,
      label: v,
      onRemove: () => onChange({ ...facets, workMode: facets.workMode.filter((x) => x !== v) }),
    })),
    ...facets.jobType.map((v) => ({
      key: `jt-${v}`,
      label: v,
      onRemove: () => onChange({ ...facets, jobType: facets.jobType.filter((x) => x !== v) }),
    })),
    ...(facets.minSalary
      ? [{ key: "min", label: `Min ₹${facets.minSalary}`, onRemove: () => onChange({ ...facets, minSalary: "" }) }]
      : []),
    ...(facets.maxSalary
      ? [{ key: "max", label: `Max ₹${facets.maxSalary}`, onRemove: () => onChange({ ...facets, maxSalary: "" }) }]
      : []),
  ];

  const hasAnyFilter = activeChips.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-fustat text-sm font-semibold text-black">Filters</p>
        <button
          type="button"
          onClick={onClearAll}
          disabled={!hasAnyFilter}
          className="font-grotesk text-xs font-medium text-black/50 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black/50"
        >
          Reset
        </button>
      </div>

      {activeChips.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="font-grotesk text-xs font-semibold uppercase tracking-wide text-black/40">
              Active filters
            </p>
            <button
              type="button"
              onClick={onClearAll}
              className="font-grotesk text-xs font-medium text-accent-soft hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent-soft transition-colors hover:bg-accent/20"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-black/70">
        <input
          type="checkbox"
          checked={facets.savedOnly}
          onChange={(e) => onChange({ ...facets, savedOnly: e.target.checked })}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-black/20 text-accent accent-accent focus:ring-accent/40"
        />
        <Bookmark className="h-3.5 w-3.5 text-black/40" />
        Saved jobs only
      </label>

      <CheckboxGroup
        label="Experience level"
        options={EXPERIENCE_OPTIONS}
        selected={facets.experience}
        onChange={(values) => onChange({ ...facets, experience: values })}
      />

      <CheckboxGroup
        label="Work mode"
        options={WORK_MODE_OPTIONS}
        selected={facets.workMode}
        onChange={(values) => onChange({ ...facets, workMode: values })}
      />

      <CheckboxGroup
        label="Job type"
        options={JOB_TYPE_OPTIONS}
        selected={facets.jobType}
        onChange={(values) => onChange({ ...facets, jobType: values })}
      />

      <div>
        <p className="font-grotesk text-xs font-semibold uppercase tracking-wide text-black/40">
          Salary range (₹ per annum)
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={facets.minSalary}
            onChange={(e) => onChange({ ...facets, minSalary: e.target.value })}
            placeholder="Min"
            className="h-9 w-full min-w-0 rounded-lg border-none bg-brand-gray px-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <span className="shrink-0 text-black/30">–</span>
          <input
            type="number"
            min={0}
            value={facets.maxSalary}
            onChange={(e) => onChange({ ...facets, maxSalary: e.target.value })}
            placeholder="Max"
            className="h-9 w-full min-w-0 rounded-lg border-none bg-brand-gray px-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>
    </div>
  );
}
