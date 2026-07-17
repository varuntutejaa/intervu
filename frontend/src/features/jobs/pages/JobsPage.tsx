import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { NavBar } from "../../../components/chrome/NavBar";
import { useSessionQuery } from "../../auth/api";
import { useAppliedJobIdsQuery, useApplyToJobMutation } from "../../applications/api";
import { useJobsQuery, type Job } from "../api";
import { JobDetailModal } from "../components/JobDetailModal";

const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODE_OPTIONS = ["Onsite", "Remote", "Hybrid"];
const EXPERIENCE_OPTIONS = ["Fresher", "1-3 Years", "3-5 Years", "5-10 Years"];
const FILTER_SELECT_CLASS =
  "h-10 rounded-xl border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20";

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

export default function JobsPage() {
  const { data: session } = useSessionQuery();
  const role = session?.role ?? null;
  const user = session?.user ?? null;

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experience, setExperience] = useState("");

  // Debounce the search box so every keystroke doesn't fire a request — the
  // dropdown filters apply immediately since those only change on deliberate
  // selection.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const jobsQuery = useJobsQuery({ q: search, jobType, workMode, experience });
  const appliedJobIdsQuery = useAppliedJobIdsQuery(role === "candidate");
  const applyMutation = useApplyToJobMutation();

  const jobs = jobsQuery.data ?? [];
  const appliedJobIds = appliedJobIdsQuery.data ?? new Set<number>();

  const handleApply = (jobId: number) => {
    applyMutation.mutate(jobId);
  };

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">Jobs for you</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border-none bg-brand-gray px-3 text-white/60">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, company, or skill..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">All job types</option>
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">All work modes</option>
            {WORK_MODE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className={FILTER_SELECT_CLASS}
          >
            <option value="">All experience levels</option>
            {EXPERIENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {jobsQuery.isPending && <p className="mt-6 text-sm text-white/50">Loading jobs…</p>}
        {jobsQuery.isError && (
          <p className="mt-6 text-sm text-red-400">Couldn't load jobs. Is the API running?</p>
        )}
        {jobsQuery.isSuccess && jobs.length === 0 && (
          <p className="mt-6 text-sm text-white/40">No jobs match your search/filters.</p>
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
                    {job.job_code && <span className="text-xs text-white/30">#{job.job_code}</span>}
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
          isApplying={applyMutation.isPending && applyMutation.variables === selectedJob.id}
          applyError={
            applyMutation.isError && applyMutation.variables === selectedJob.id
              ? applyMutation.error.message
              : undefined
          }
          onApply={() => handleApply(selectedJob.id)}
        />
      )}
    </div>
  );
}
