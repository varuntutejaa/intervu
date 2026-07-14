import { useEffect, useState } from "react";
import { Briefcase, Users, X } from "lucide-react";
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

type Applicant = {
  application_id: number;
  status: string;
  applied_on: string;
  feedback: string | null;
  auth_sub: string;
  email: string;
  desired_role: string | null;
  location: string | null;
  experience: string | null;
  portfolio_url: string | null;
  skills: string | null;
  bio: string | null;
  resume_filename: string | null;
  resume_data: string | null;
  avatar_url: string | null;
};

const APPLICATION_STATUSES = ["Applied", "Interviewing", "Offer", "Rejected"];

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function RecruiterDashboardPage({
  onNavigateHome,
  onOpenJobs,
  onOpenApplications,
  onScrollToFeatures,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
  onOpenViewCandidates,
  onSwitchRole,
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
  onSwitchRole: (role: Role) => void;
  role: Role | null;
  user: NavUser | null;
  onLogout: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetch("/api/jobs/mine", { credentials: "include" })
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
          onSwitchRole={onSwitchRole}
          role={role}
          user={user}
          onLogout={onLogout}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Post new roles and browse candidates looking for their next job.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenPostJob}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Briefcase className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-white">
                Post a job
              </span>
              <span className="mt-0.5 block text-sm text-white/40">
                Create a new listing for candidates to find.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenViewCandidates}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:bg-white/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Users className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-fustat text-lg font-semibold text-white">
                View candidates
              </span>
              <span className="mt-0.5 block text-sm text-white/40">
                Browse everyone who's set up a candidate profile.
              </span>
            </span>
          </button>
        </div>

        <div className="mt-10">
          <h2 className="font-fustat text-xl font-semibold text-white">Your job postings</h2>

          {status === "loading" && <p className="mt-4 text-sm text-white/50">Loading…</p>}
          {status === "error" && (
            <p className="mt-4 text-sm text-red-400">Couldn't load your jobs. Is the API running?</p>
          )}
          {status === "ready" && jobs.length === 0 && (
            <p className="mt-4 text-sm text-white/40">
              You haven't posted any jobs yet. Get started above.
            </p>
          )}
          {status === "ready" && jobs.length > 0 && (
            <div className="mt-4 space-y-3">
              {jobs.map((job) => {
                const salary = formatSalary(job.salary_min, job.salary_max);
                return (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 sm:flex sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-medium text-white">{job.title}</p>
                        {job.job_code && (
                          <span className="text-xs text-white/30">#{job.job_code}</span>
                        )}
                      </div>
                      <p className="text-sm text-white/40">
                        {job.company} · {job.location}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {[job.job_type, job.work_mode, job.experience]
                          .filter(Boolean)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                      {job.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-white/50">
                          {job.description}
                        </p>
                      )}
                    </div>
                    {salary && (
                      <p className="mt-2 shrink-0 text-sm text-white/60 sm:mt-0">{salary}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <ApplicantsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}

function ApplicantsModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    fetch(`/api/jobs/${job.id}/applicants`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Applicant[]) => {
        setApplicants(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [job.id]);

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

        <h2 className="pr-8 font-fustat text-2xl font-bold text-white">{job.title}</h2>
        <p className="mt-1 text-sm text-white/50">
          {job.company} · {job.location}
        </p>

        <div className="mt-6">
          {status === "loading" && <p className="text-sm text-white/50">Loading applicants…</p>}
          {status === "error" && (
            <p className="text-sm text-red-400">Couldn't load applicants. Is the API running?</p>
          )}
          {status === "ready" && applicants.length === 0 && (
            <p className="text-sm text-white/40">No one has applied to this job yet.</p>
          )}

          {status === "ready" && applicants.length > 0 && (
            <div className="space-y-4">
              {applicants.map((applicant) => (
                <ApplicantCard key={applicant.application_id} jobId={job.id} applicant={applicant} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({ jobId, applicant }: { jobId: number; applicant: Applicant }) {
  const [applicantStatus, setApplicantStatus] = useState(applicant.status);
  const [feedback, setFeedback] = useState(applicant.feedback ?? "");
  // What's actually saved server-side, tracked separately from props so a
  // successful save doesn't require mutating the applicant object passed
  // down from the parent's fetched list.
  const [savedStatus, setSavedStatus] = useState(applicant.status);
  const [savedFeedback, setSavedFeedback] = useState(applicant.feedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = applicantStatus !== savedStatus || feedback !== savedFeedback;

  const handleSave = async () => {
    setError("");
    setSaved(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants/${applicant.application_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: applicantStatus, feedback }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save. Try again.");
        return;
      }
      setSavedStatus(applicantStatus);
      setSavedFeedback(feedback);
      setSaved(true);
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-4">
        {applicant.avatar_url ? (
          <img
            src={applicant.avatar_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-gray font-grotesk text-sm font-semibold text-white">
            {initials(applicant.email)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-fustat text-lg font-semibold text-white">
              {applicant.desired_role || "Candidate"}
            </p>
            <p className="text-xs text-white/40">{applicant.email}</p>
          </div>
          <p className="text-sm text-white/40">
            {[applicant.location, applicant.experience && `${applicant.experience} experience`]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {applicant.bio && <p className="mt-2 text-sm text-white/70">{applicant.bio}</p>}
          {applicant.skills && (
            <p className="mt-2 text-xs text-white/40">Skills: {applicant.skills}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {applicant.portfolio_url && (
              <a
                href={applicant.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-white underline underline-offset-2"
              >
                Portfolio
              </a>
            )}
            {applicant.resume_data ? (
              <a
                href={applicant.resume_data}
                download={applicant.resume_filename ?? "resume"}
                className="font-medium text-white underline underline-offset-2"
              >
                Resume: {applicant.resume_filename ?? "download"}
              </a>
            ) : (
              applicant.resume_filename && (
                <span className="text-white/40">Resume: {applicant.resume_filename}</span>
              )
            )}
            <span className="text-white/30">
              Applied{" "}
              {new Date(applicant.applied_on).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-white/50">Status</label>
              <select
                value={applicantStatus}
                onChange={(e) => setApplicantStatus(e.target.value)}
                className="h-9 rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="mt-3 block text-xs font-medium text-white/50">
              Feedback for the candidate
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. notes from the interview, next steps..."
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border-none bg-brand-gray px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            />

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || isSaving}
                className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              {saved && !dirty && <span className="text-xs text-emerald-400">Saved.</span>}
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
