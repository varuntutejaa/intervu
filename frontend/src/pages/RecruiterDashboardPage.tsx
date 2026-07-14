import { useEffect, useState } from "react";
import { Briefcase, Pencil, Users, X } from "lucide-react";
import { InputGroup, SelectGroup, TextAreaGroup, type Role } from "../components/AuroraLayout";
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
  status: string;
};

type Stats = {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  byStatus: Record<string, number>;
  jobs: { id: number; title: string; status: string; total: number; byStatus: Record<string, number> }[];
  totalCandidates: number;
  totalResumesUploaded: number;
  topCompanies: { company: string; count: number }[];
  interviewCompletionRate: number;
};

const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract"].map((v) => ({
  value: v,
  label: v,
}));
const WORK_MODE_OPTIONS = ["Onsite", "Remote", "Hybrid"].map((v) => ({ value: v, label: v }));
const JOB_EXPERIENCE_OPTIONS = [
  { value: "Fresher", label: "Fresher" },
  { value: "1-3 Years", label: "1–3 Years" },
  { value: "3-5 Years", label: "3–5 Years" },
  { value: "5-10 Years", label: "5–10 Years" },
];

type Applicant = {
  application_id: number;
  status: string;
  applied_on: string;
  feedback_technical_rating: number | null;
  feedback_communication_rating: number | null;
  feedback_overall_rating: number | null;
  feedback_strengths: string | null;
  feedback_weaknesses: string | null;
  feedback_recommendation: string | null;
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

const APPLICATION_STATUSES = [
  "Applied",
  "Interview Scheduled",
  "Technical Round",
  "HR Round",
  "Offer Received",
  "Rejected",
];
const RATING_OPTIONS = [1, 2, 3, 4, 5];
const RECOMMENDATION_OPTIONS = ["Strong Hire", "Hire", "No Hire", "Strong No Hire"];

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
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const loadJobs = () => {
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
  };

  const loadStats = () => {
    fetch("/api/jobs/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Stats | null) => setStats(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === "open" ? "closed" : "open";
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus }),
    });
    loadJobs();
    loadStats();
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
                <p className="text-2xl font-bold text-white">
                  {stats.byStatus["Offer Received"] ?? 0}
                </p>
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
                        {job.job_code && (
                          <span className="text-xs text-white/30">#{job.job_code}</span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            isClosed
                              ? "bg-red-400/20 text-red-300"
                              : "bg-emerald-400/20 text-emerald-300"
                          }`}
                        >
                          {job.status}
                        </span>
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

      {selectedJob && (
        <ApplicantsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}

      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={() => {
            setEditingJob(null);
            loadJobs();
          }}
        />
      )}
    </div>
  );
}

function EditJobModal({
  job,
  onClose,
  onSaved,
}: {
  job: Job;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(job.title);
  const [company, setCompany] = useState(job.company);
  const [location, setLocation] = useState(job.location);
  const [jobType, setJobType] = useState(job.job_type);
  const [workMode, setWorkMode] = useState(job.work_mode);
  const [experience, setExperience] = useState(job.experience);
  const [salaryMin, setSalaryMin] = useState(job.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(job.salary_max?.toString() ?? "");
  const [description, setDescription] = useState(job.description ?? "");
  const [skills, setSkills] = useState(job.skills.join(", "));
  const [applicationDeadline, setApplicationDeadline] = useState(
    job.application_deadline ? job.application_deadline.slice(0, 10) : "",
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          company,
          location,
          jobType,
          workMode,
          experience,
          salaryMin: salaryMin ? Number(salaryMin) : null,
          salaryMax: salaryMax ? Number(salaryMax) : null,
          description,
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          applicationDeadline: applicationDeadline || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save changes. Try again.");
        return;
      }
      onSaved();
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h2 className="pr-8 font-fustat text-2xl font-bold text-white">Edit job</h2>
        <p className="mt-1 text-sm text-white/50">#{job.job_code}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputGroup label="Job title" placeholder="" type="text" value={title} onChange={setTitle} />
          <InputGroup label="Company" placeholder="" type="text" value={company} onChange={setCompany} />

          <InputGroup
            label="Location"
            placeholder=""
            type="text"
            value={location}
            onChange={setLocation}
          />
          <SelectGroup
            label="Job type"
            placeholder="Select a type"
            value={jobType}
            onChange={setJobType}
            options={JOB_TYPE_OPTIONS}
          />

          <SelectGroup
            label="Work mode"
            placeholder="Select a mode"
            value={workMode}
            onChange={setWorkMode}
            options={WORK_MODE_OPTIONS}
          />
          <SelectGroup
            label="Experience"
            placeholder="Select a level"
            value={experience}
            onChange={setExperience}
            options={JOB_EXPERIENCE_OPTIONS}
          />

          <InputGroup
            label="Salary min"
            placeholder=""
            type="number"
            value={salaryMin}
            onChange={setSalaryMin}
          />
          <InputGroup
            label="Salary max"
            placeholder=""
            type="number"
            value={salaryMax}
            onChange={setSalaryMax}
          />

          <InputGroup
            label="Skills (comma separated)"
            placeholder=""
            type="text"
            value={skills}
            onChange={setSkills}
          />
          <InputGroup
            label="Application deadline"
            placeholder=""
            type="date"
            value={applicationDeadline}
            onChange={setApplicationDeadline}
          />
        </div>

        <div className="mt-4">
          <TextAreaGroup
            label="Job description"
            placeholder=""
            value={description}
            onChange={setDescription}
            rows={5}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
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

type FeedbackForm = {
  technicalRating: number | null;
  communicationRating: number | null;
  overallRating: number | null;
  strengths: string;
  weaknesses: string;
  recommendation: string;
};

function feedbackFormFromApplicant(applicant: Applicant): FeedbackForm {
  return {
    technicalRating: applicant.feedback_technical_rating,
    communicationRating: applicant.feedback_communication_rating,
    overallRating: applicant.feedback_overall_rating,
    strengths: applicant.feedback_strengths ?? "",
    weaknesses: applicant.feedback_weaknesses ?? "",
    recommendation: applicant.feedback_recommendation ?? "",
  };
}

function ApplicantCard({ jobId, applicant }: { jobId: number; applicant: Applicant }) {
  const [applicantStatus, setApplicantStatus] = useState(applicant.status);
  const [feedback, setFeedback] = useState<FeedbackForm>(feedbackFormFromApplicant(applicant));
  // What's actually saved server-side, tracked separately from props so a
  // successful save doesn't require mutating the applicant object passed
  // down from the parent's fetched list.
  const [savedStatus, setSavedStatus] = useState(applicant.status);
  const [savedFeedback, setSavedFeedback] = useState<FeedbackForm>(
    feedbackFormFromApplicant(applicant),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    applicantStatus !== savedStatus ||
    JSON.stringify(feedback) !== JSON.stringify(savedFeedback);

  const handleSave = async () => {
    setError("");
    setSaved(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants/${applicant.application_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: applicantStatus,
          feedback: {
            technicalRating: feedback.technicalRating,
            communicationRating: feedback.communicationRating,
            overallRating: feedback.overallRating,
            strengths: feedback.strengths || null,
            weaknesses: feedback.weaknesses || null,
            recommendation: feedback.recommendation || null,
          },
        }),
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

            <p className="mt-4 text-xs font-medium text-white/50">Interview feedback</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <RatingSelect
                label="Technical"
                value={feedback.technicalRating}
                onChange={(v) => setFeedback((prev) => ({ ...prev, technicalRating: v }))}
              />
              <RatingSelect
                label="Communication"
                value={feedback.communicationRating}
                onChange={(v) => setFeedback((prev) => ({ ...prev, communicationRating: v }))}
              />
              <RatingSelect
                label="Overall"
                value={feedback.overallRating}
                onChange={(v) => setFeedback((prev) => ({ ...prev, overallRating: v }))}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-white/50">Strengths</label>
                <textarea
                  value={feedback.strengths}
                  onChange={(e) => setFeedback((prev) => ({ ...prev, strengths: e.target.value }))}
                  placeholder="What stood out positively"
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-lg border-none bg-brand-gray px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50">Weaknesses</label>
                <textarea
                  value={feedback.weaknesses}
                  onChange={(e) => setFeedback((prev) => ({ ...prev, weaknesses: e.target.value }))}
                  placeholder="Areas of concern"
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-lg border-none bg-brand-gray px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-white/50">Recommendation</label>
              <select
                value={feedback.recommendation}
                onChange={(e) =>
                  setFeedback((prev) => ({ ...prev, recommendation: e.target.value }))
                }
                className="h-9 rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">No recommendation yet</option>
                {RECOMMENDATION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center gap-3">
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

function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="mt-1.5 h-9 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <option value="">Not rated</option>
        {RATING_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} / 5
          </option>
        ))}
      </select>
    </div>
  );
}
