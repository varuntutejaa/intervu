import { useEffect, useState } from "react";
import { Briefcase, Pencil, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Pager } from "../../../components/Pager";
import { NavBar } from "../../../components/chrome/NavBar";
import { formatSalary } from "../../../lib/format";
import { useSessionQuery } from "../../auth/api";
import { useMyJobsQuery, useJobStatsQuery, useUpdateJobMutation, type Job } from "../../jobs/api";
import { ApplicantsModal } from "../components/ApplicantsModal";
import { EditJobModal } from "../components/EditJobModal";

export default function RecruiterDashboardPage() {
  const { data: session } = useSessionQuery();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [jobsPage, setJobsPage] = useState(1);
  const jobsQuery = useMyJobsQuery(jobsPage, search);
  const statsQuery = useJobStatsQuery();
  const updateJobMutation = useUpdateJobMutation();

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setJobsPage(1);
  }, [search]);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const jobs = jobsQuery.data?.items ?? [];
  const stats = statsQuery.data;

  const handleToggleStatus = (job: Job) => {
    const nextStatus = job.status === "open" ? "closed" : "open";
    updateJobMutation.mutate({ id: job.id, payload: { status: nextStatus } });
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-black">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-black/40">
          Post new roles and browse candidates looking for their next job.
        </p>

        {statsQuery.isPending && <p className="mt-6 text-sm text-black/50">Loading your stats…</p>}
        {statsQuery.isError && (
          <p className="mt-6 text-sm text-red-600">Couldn't load your stats. Is the API running?</p>
        )}

        {stats && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.openJobs}</p>
                <p className="text-xs text-black/40">Open jobs ({stats.totalJobs} total)</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.totalApplicants}</p>
                <p className="text-xs text-black/40">Total applicants</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">
                  {stats.byStatus["Technical Round"] ?? 0}
                </p>
                <p className="text-xs text-black/40">In technical rounds</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.byStatus["Offer Received"] ?? 0}</p>
                <p className="text-xs text-black/40">Offers made</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.totalCandidates}</p>
                <p className="text-xs text-black/40">Total candidates on Intervu</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.totalResumesUploaded}</p>
                <p className="text-xs text-black/40">Resumes uploaded</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-2xl font-bold text-black">{stats.interviewCompletionRate}%</p>
                <p className="text-xs text-black/40">Interview completion rate</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="truncate text-sm font-semibold text-black">
                  {stats.topCompanies[0]?.company ?? "—"}
                </p>
                <p className="text-xs text-black/40">Top applied company</p>
              </div>
            </div>

            {stats.topCompanies.length > 0 && (
              <div className="mt-3 rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="text-xs font-medium text-black/50">Top applied companies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stats.topCompanies.map((c) => (
                    <span
                      key={c.company}
                      className="rounded-full bg-black/10 px-3 py-1 text-xs text-black/70"
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
            className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-black/5 p-6 text-left transition-colors hover:bg-black/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Briefcase className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-black">Post a job</span>
              <span className="mt-0.5 block text-sm text-black/40">
                Create a new listing for candidates to find.
              </span>
            </span>
          </Link>

          <Link
            to="/recruiter/candidates"
            className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-black/5 p-6 text-left transition-colors hover:bg-black/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Users className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-black">View candidates</span>
              <span className="mt-0.5 block text-sm text-black/40">
                Browse everyone who's set up a candidate profile.
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-fustat text-xl font-semibold text-black">Your job postings</h2>
            <div className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border-none bg-brand-gray px-3 text-black/60">
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search your postings..."
                className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
              />
            </div>
          </div>

          {jobsQuery.isPending && <p className="mt-4 text-sm text-black/50">Loading…</p>}
          {jobsQuery.isError && (
            <p className="mt-4 text-sm text-red-600">Couldn't load your jobs. Is the API running?</p>
          )}
          {jobsQuery.isSuccess && jobs.length === 0 && (
            <p className="mt-4 text-sm text-black/40">
              {search ? "No postings match your search." : "You haven't posted any jobs yet. Get started above."}
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
                    className="w-full cursor-pointer rounded-xl border border-black/10 bg-black/5 p-4 text-left transition-colors hover:bg-black/10 sm:flex sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-medium text-black">{job.title}</p>
                        {job.job_code && <span className="text-xs text-black/30">#{job.job_code}</span>}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            isClosed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-black/40">
                        {job.company} · {job.location} · {job.applicant_count}{" "}
                        {job.applicant_count === 1 ? "applicant" : "applicants"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {[job.job_type, job.work_mode, job.experience].filter(Boolean).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-black/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {job.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-black/50">{job.description}</p>
                      )}
                    </div>
                    <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
                      {salary && <p className="text-sm text-black/60">{salary}</p>}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingJob(job);
                        }}
                        aria-label="Edit job"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:bg-black/10 hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(job);
                        }}
                        className="h-8 shrink-0 rounded-full border border-black/10 px-3 text-xs font-medium text-black/60 transition-colors hover:bg-black/10 hover:text-black"
                      >
                        {isClosed ? "Reopen" : "Close"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {jobsQuery.data && (
            <Pager
              page={jobsQuery.data.page}
              totalPages={jobsQuery.data.totalPages}
              onPageChange={setJobsPage}
            />
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
