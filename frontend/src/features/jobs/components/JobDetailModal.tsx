import { X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Job } from "../api";

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  return `Apply by ${new Date(deadline).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function JobDetailModal({
  job,
  onClose,
  canApply,
  isLoggedIn,
  hasApplied,
  isApplying,
  applyError,
  onApply,
}: {
  job: Job;
  onClose: () => void;
  canApply: boolean;
  isLoggedIn: boolean;
  hasApplied: boolean;
  isApplying: boolean;
  applyError?: string;
  onApply: () => void;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  const deadline = formatDeadline(job.application_deadline);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative h-[80vh] w-[90vw] overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1c1e] p-6 shadow-2xl sm:h-[70vh] sm:w-[70vw]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-wrap items-baseline gap-x-2 pr-8">
          <h2 className="font-fustat text-2xl font-bold text-white">{job.title}</h2>
          {job.job_code && <span className="text-xs text-white/30">#{job.job_code}</span>}
        </div>
        <p className="mt-1 text-sm text-white/50">
          {job.company} · {job.location}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[job.job_type, job.work_mode, job.experience].filter(Boolean).map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-1 text-sm">
          {salary && (
            <p>
              <span className="text-white/40">Salary: </span>
              <span className="text-white">{salary}</span>
            </p>
          )}
          {deadline && <p className="text-white/40">{deadline}</p>}
        </div>

        {job.description && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-white">Description</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-white/60">{job.description}</p>
          </div>
        )}

        {job.skills.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-white">Skills</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {applyError && <p className="mt-4 text-sm text-red-400">{applyError}</p>}

        {!isLoggedIn ? (
          <Link
            to="/login"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Log in to apply
          </Link>
        ) : !canApply ? (
          <p className="mt-6 text-center text-sm text-white/40">Only candidates can apply to jobs.</p>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={hasApplied || isApplying}
            className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hasApplied ? "Applied" : isApplying ? "Applying…" : "Apply now"}
          </button>
        )}
      </div>
    </div>
  );
}
