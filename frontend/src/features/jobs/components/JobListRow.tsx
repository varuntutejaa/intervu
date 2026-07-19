import { CompanyLogo } from "../../../components/CompanyLogo";
import { formatRelativeTime, formatSalary } from "../../../lib/format";
import type { Job } from "../api";
import { ApplyButton, SaveButton } from "./JobActionButtons";

export function JobListRow({
  job,
  isCandidate,
  isApplied,
  isApplying,
  onApply,
  isSaved,
  onToggleSave,
  onOpen,
}: {
  job: Job;
  isCandidate: boolean;
  isApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  const meta = [job.company, job.location, job.work_mode, salary, formatRelativeTime(job.created_at)]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="flex cursor-pointer items-center gap-4 py-4 transition-colors hover:bg-black/[0.02]"
    >
      <CompanyLogo src={job.company_logo_url} company={job.company} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-fustat text-sm font-bold text-black">{job.title}</p>
        <p className="mt-0.5 truncate text-xs text-black/50">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SaveButton isSaved={isSaved} onToggle={onToggleSave} />
        {isCandidate && <ApplyButton isApplied={isApplied} isApplying={isApplying} onApply={onApply} />}
      </div>
    </div>
  );
}
