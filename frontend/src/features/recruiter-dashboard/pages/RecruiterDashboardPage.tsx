import { useState } from "react";
import { Briefcase, Pencil, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { formatSalary } from "../../../lib/format";
import { useSessionQuery } from "../../auth/api";
import { useMyJobsQuery, useJobStatsQuery, useUpdateJobMutation, type Job } from "../../jobs/api";
import { ApplicantsModal } from "../components/ApplicantsModal";
import { EditJobModal } from "../components/EditJobModal";

export default function RecruiterDashboardPage() {
  const { data: session } = useSessionQuery();
  const jobsQuery = useMyJobsQuery();
  const statsQuery = useJobStatsQuery();
  const updateJobMutation = useUpdateJobMutation();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const jobs = jobsQuery.data ?? [];
  const stats = statsQuery.data;

  const handleToggleStatus = (job: Job) => {
    const nextStatus = job.status === "open" ? "closed" : "open";
    updateJobMutation.mutate({ id: job.id, payload: { status: nextStatus } });
  };

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Post new roles and browse candidates looking for their next job.
        </p>

        {statsQuery.isPending && <p className="mt-6 text-sm text-white/50">Loading your stats…</p>}
        {statsQuery.isError && (
          <p className="mt-6 text-sm text-red-400">Couldn't load your stats. Is the API running?</p>
        )}

        {stats && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.openJobs}</p>
                <p className="text-xs text-white/40">Open jobs ({stats.totalJobs} total)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.totalApplicants}</p>
                <p className="text-xs text-white/40">Total applicants</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">
                  {stats.byStatus["Technical Round"] ?? 0}
                </p>
                <p className="text-xs text-white/40">In technical rounds</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.byStatus["Offer Received"] ?? 0}</p>
                <p className="text-xs text-white/40">Offers made</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.totalCandidates}</p>
                <p className="text-xs text-white/40">Total candidates on Intervu</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.totalResumesUploaded}</p>
                <p className="text-xs text-white/40">Resumes uploaded</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-white">{stats.interviewCompletionRate}%</p>
                <p className="text-xs text-white/40">Interview completion rate</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="truncate text-sm font-semibold text-white">
                  {stats.topCompanies[0]?.company ?? "—"}
                </p>
                <p className="text-xs text-white/40">Top applied company</p>
              </div>
            </div>

            {stats.topCompanies.length > 0 && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium text-white/50">Top applied companies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stats.topCompanies.map((c) => (
                    <span
                      key={c.company}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      {c.company} · {c.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/recruiter/post-job"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Briefcase className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-white">Post a job</span>
              <span className="mt-0.5 block text-sm text-white/40">
                Create a new listing for candidates to find.
              </span>
            </span>
          </Link>

          <Link
            to="/recruiter/candidates"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Users className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-white">View candidates</span>
              <span className="mt-0.5 block text-sm text-white/40">
                Browse everyone who's set up a candidate profile.
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="font-fustat text-xl font-semibold text-white">Your job postings</h2>

          {jobsQuery.isPending && <p className="mt-4 text-sm text-white/50">Loading…</p>}
          {jobsQuery.isError && (
            <p className="mt-4 text-sm text-red-400">Couldn't load your jobs. Is the API running?</p>
          )}
          {jobsQuery.isSuccess && jobs.length === 0 && (
            <p className="mt-4 text-sm text-white/40">
              You haven't posted any jobs yet. Get started above.
            </p>
          )}
          {jobs.length > 0 && (
            <div className="mt-4 space-y-3">
              {jobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max);
                const isClosed = job.status === "closed";
                return (
                  <div
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedJob(job)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 sm:flex sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-medium text-white">{job.title}</p>
                        {job.job_code && <span className="text-xs text-white/30">#{job.job_code}</span>}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            isClosed ? "bg-red-400/20 text-red-300" : "bg-emerald-400/20 text-emerald-300"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/40">
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
                        <p className="mt-1.5 line-clamp-2 text-sm text-white/50">{job.description}</p>
                      )}
                    </div>
                    <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
                      {salary && <p className="text-sm text-white/60">{salary}</p>}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingJob(job);
                        }}
                        aria-label="Edit job"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(job);
                        }}
                        className="h-8 shrink-0 rounded-full border border-white/10 px-3 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {isClosed ? "Reopen" : "Close"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedJob && <ApplicantsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}

      {editingJob && (
        <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} onSaved={() => setEditingJob(null)} />
      )}
    </div>
  );
}
