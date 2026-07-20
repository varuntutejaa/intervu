import { CompanyLogo } from "../../../components/CompanyLogo";
import { formatRelativeTime, formatSalary } from "../../../lib/format";
import type { Job } from "../api";
import { ApplyButton, SaveButton } from "./JobActionButtons";

export function JobCard({
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
  const applicants = `${job.applicant_count} ${job.applicant_count === 1 ? "applicant" : "applicants"}`;
  const meta = [job.company, job.work_mode, job.location, salary, formatRelativeTime(job.created_at), applicants]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="cursor-pointer rounded-xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo src={job.company_logo_url} company={job.company} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-fustat text-lg font-bold text-black">{job.title}</p>
          <p className="mt-1 truncate text-sm text-black/50">{meta}</p>
        </div>
      </div>

      {job.description && <p className="mt-3 line-clamp-1 text-sm text-black/50">{job.description}</p>}

      <div className="mt-5 flex items-center justify-end gap-2">
        <SaveButton isSaved={isSaved} onToggle={onToggleSave} />
        {isCandidate && <ApplyButton isApplied={isApplied} isApplying={isApplying} onApply={onApply} />}
      </div>
    </div>
  );
}
