import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Role } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  work_mode: string;
  experience: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  skills: string[];
  application_deadline: string | null;
  job_code: string | null;
};

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

export default function JobsPage({
  onNavigateHome,
  onOpenJobs,
  onOpenApplications,
  onScrollToFeatures,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
  onOpenViewCandidates,
  role,
  user,
  onLogout,
}: {
  onNavigateHome: () => void;
  onOpenJobs: () => void;
  onOpenApplications: () => void;
  onScrollToFeatures: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenPostJob: () => void;
  onOpenViewCandidates: () => void;
  role: Role | null;
  user: NavUser | null;
  onLogout: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Job[]) => {
        setJobs(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (role !== "candidate") return;
    fetch("/api/applications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { job_id: number }[]) => {
        setAppliedJobIds(new Set(data.map((app) => app.job_id)));
      })
      .catch(() => {});
  }, [role]);

  const handleApply = async (jobId: number) => {
    setApplyError("");
    setApplyingJobId(jobId);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApplyError(data.error ?? "Couldn't apply. Try again.");
        return;
      }
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
    } catch {
      setApplyError("Couldn't reach the server. Is the API running?");
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar
          onNavigateHome={onNavigateHome}
          onOpenJobs={onOpenJobs}
          onOpenApplications={onOpenApplications}
          onScrollToFeatures={onScrollToFeatures}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onOpenPostJob={onOpenPostJob}
          onOpenViewCandidates={onOpenViewCandidates}
          role={role}
          user={user}
          onLogout={onLogout}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">Jobs for you</h1>

        {status === "loading" && <p className="mt-6 text-sm text-white/50">Loading jobs…</p>}
        {status === "error" && (
          <p className="mt-6 text-sm text-red-400">Couldn't load jobs. Is the API running?</p>
        )}

        <div className="mt-6 space-y-3">
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max);
            const deadline = formatDeadline(job.application_deadline);

            return (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-grotesk text-sm font-semibold text-white">{job.title}</p>
                    {job.job_code && (
                      <span className="text-xs text-white/30">#{job.job_code}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {job.company} · {job.location}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[job.job_type, job.work_mode, job.experience].filter(Boolean).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {job.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-white/40">{job.description}</p>
                  )}
                  {job.skills.length > 0 && (
                    <p className="mt-1 text-xs text-white/30">{job.skills.join(" · ")}</p>
                  )}
                  {deadline && <p className="mt-1 text-xs text-white/30">{deadline}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {salary && <span className="text-xs font-medium text-white/60">{salary}</span>}
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/80"
                  >
                    {appliedJobIds.has(job.id) ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          canApply={role === "candidate"}
          isLoggedIn={!!user}
          hasApplied={appliedJobIds.has(selectedJob.id)}
          isApplying={applyingJobId === selectedJob.id}
          applyError={applyError}
          onApply={() => handleApply(selectedJob.id)}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
}

function JobDetailModal({
  job,
  onClose,
  canApply,
  isLoggedIn,
  hasApplied,
  isApplying,
  applyError,
  onApply,
  onOpenAuth,
}: {
  job: Job;
  onClose: () => void;
  canApply: boolean;
  isLoggedIn: boolean;
  hasApplied: boolean;
  isApplying: boolean;
  applyError: string;
  onApply: () => void;
  onOpenAuth: () => void;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  const deadline = formatDeadline(job.application_deadline);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/70"
      />

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
            <span
              key={tag}
              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60"
            >
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
                <span
                  key={skill}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {applyError && <p className="mt-4 text-sm text-red-400">{applyError}</p>}

        {!isLoggedIn ? (
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Log in to apply
          </button>
        ) : !canApply ? (
          <p className="mt-6 text-center text-sm text-white/40">
            Only candidates can apply to jobs.
          </p>
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
