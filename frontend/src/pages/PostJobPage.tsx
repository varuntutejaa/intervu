import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Role } from "../components/AuroraLayout";
import { InputGroup, SelectGroup, TextAreaGroup } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

const JOB_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Internship", label: "Internship" },
  { value: "Contract", label: "Contract" },
];

const WORK_MODE_OPTIONS = [
  { value: "Onsite", label: "Onsite" },
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
];

const EXPERIENCE_OPTIONS = [
  { value: "Fresher", label: "Fresher" },
  { value: "1-3 Years", label: "1–3 Years" },
  { value: "3-5 Years", label: "3–5 Years" },
  { value: "5-10 Years", label: "5–10 Years" },
];

export default function PostJobPage({
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
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experience, setExperience] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [error, setError] = useState("");
  const [jobCode, setJobCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofill from the recruiter's own profile so they aren't retyping their
  // company name on every posting.
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile: { company_name: string | null } | null } | null) => {
        if (data?.profile?.company_name) setCompany(data.profile.company_name);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setJobCode("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't post this job. Try again.");
        return;
      }
      setTitle("");
      setLocation("");
      setJobType("");
      setWorkMode("");
      setExperience("");
      setSalaryMin("");
      setSalaryMax("");
      setDescription("");
      setSkills("");
      setApplicationDeadline("");
      setJobCode(data.job_code);
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
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

      <div className="mx-auto max-w-3xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">Post a job</h1>
        <p className="mt-2 text-sm text-white/40">
          This goes straight into the public jobs board candidates browse.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputGroup
              label="Job title"
              placeholder="Software Engineer Intern"
              type="text"
              value={title}
              onChange={setTitle}
            />
            <InputGroup
              label="Company"
              placeholder="Hewlett Packard Enterprise"
              type="text"
              value={company}
              onChange={setCompany}
            />

            <InputGroup
              label="Location"
              placeholder="Bangalore, India"
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
              options={EXPERIENCE_OPTIONS}
            />

            <InputGroup
              label="Salary min"
              placeholder="130000"
              type="number"
              value={salaryMin}
              onChange={setSalaryMin}
            />
            <InputGroup
              label="Salary max"
              placeholder="160000"
              type="number"
              value={salaryMax}
              onChange={setSalaryMax}
            />

            <InputGroup
              label="Skills (comma separated)"
              placeholder="React, Node.js, AWS"
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

          <TextAreaGroup
            label="Job description"
            placeholder="Responsibilities, requirements, and anything else candidates should know."
            value={description}
            onChange={setDescription}
            rows={5}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {jobCode && (
            <p className="text-sm text-emerald-400">
              Job posted. Reference code: <span className="font-semibold">{jobCode}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Posting…" : "Post job"}
          </button>
        </form>
      </div>
    </div>
  );
}
