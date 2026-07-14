import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera } from "lucide-react";
import { FileUploadGroup, InputGroup, SelectGroup, TextAreaGroup, type Role } from "../components/AuroraLayout";
import { NavBar, type NavUser } from "../components/LandingChrome";
import {
  COMPANY_SIZE_OPTIONS,
  EMPTY_CANDIDATE,
  EMPTY_RECRUITER,
  EXPERIENCE_OPTIONS,
  type CandidateFields,
  type RecruiterFields,
} from "../components/ProfileFields";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB — stored inline as a data URL, no object storage wired up yet

type ProfileRow = {
  email: string;
  role: Role;
  desired_role: string | null;
  location: string | null;
  experience: string | null;
  portfolio_url: string | null;
  skills: string | null;
  bio: string | null;
  resume_filename: string | null;
  company_name: string | null;
  job_title: string | null;
  company_website: string | null;
  company_size: string | null;
  industry: string | null;
  company_bio: string | null;
  company_logo_filename: string | null;
  avatar_url: string | null;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function ProfilePage({
  onNavigateHome,
  onOpenJobs,
  onOpenApplications,
  onScrollToFeatures,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
  onOpenViewCandidates,
  onOpenProfileSetup,
  role: navRole,
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
  onOpenProfileSetup: () => void;
  role: Role | null;
  user: NavUser | null;
  onLogout: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "empty" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("candidate");
  const [candidate, setCandidate] = useState<CandidateFields>(EMPTY_CANDIDATE);
  const [resume, setResume] = useState<File | null>(null);
  const [existingResumeFilename, setExistingResumeFilename] = useState<string | undefined>();
  const [recruiter, setRecruiter] = useState<RecruiterFields>(EMPTY_RECRUITER);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [existingCompanyLogoFilename, setExistingCompanyLogoFilename] = useState<
    string | undefined
  >();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { profile: ProfileRow | null }) => {
        if (!data.profile) {
          setStatus("empty");
          return;
        }
        const p = data.profile;
        setEmail(p.email);
        setRole(p.role);
        setCandidate({
          desiredRole: p.desired_role ?? "",
          location: p.location ?? "",
          experience: p.experience ?? "",
          portfolioUrl: p.portfolio_url ?? "",
          skills: p.skills ?? "",
          bio: p.bio ?? "",
        });
        setExistingResumeFilename(p.resume_filename ?? undefined);
        setRecruiter({
          companyName: p.company_name ?? "",
          jobTitle: p.job_title ?? "",
          companyWebsite: p.company_website ?? "",
          companySize: p.company_size ?? "",
          industry: p.industry ?? "",
          companyBio: p.company_bio ?? "",
        });
        setExistingCompanyLogoFilename(p.company_logo_filename ?? undefined);
        setAvatarUrl(p.avatar_url);
        setStatus("ready");
      })
      .catch(() => setStatus("empty"));
  }, []);

  const handleAvatarPick = async (file: File | null) => {
    setAvatarError("");
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Please choose an image under 2MB.");
      return;
    }
    setAvatarUrl(await readFileAsDataUrl(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setIsSubmitting(true);
    try {
      const fields =
        role === "candidate"
          ? {
              ...candidate,
              resumeFilename: resume?.name ?? existingResumeFilename,
              avatarUrl,
            }
          : {
              ...recruiter,
              companyLogoFilename: companyLogo?.name ?? existingCompanyLogoFilename,
              avatarUrl,
            };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save your profile. Try again.");
        return;
      }
      setSaved(true);
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
          role={navRole}
          user={user}
          onLogout={onLogout}
        />
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <div>
          <h1 className="font-fustat text-3xl font-bold text-white">Your profile</h1>
          <p className="mt-2 text-sm text-white/40">
            Keep this up to date so your matches stay accurate.
          </p>
        </div>

        {status === "loading" && <p className="text-sm text-white/50">Loading your profile…</p>}

        {status === "empty" && (
          <div>
            <h2 className="text-xl font-medium tracking-tight text-white">No profile yet</h2>
            <p className="mt-2 text-sm text-white/40">
              You haven't set up your profile yet.
            </p>
            <button
              type="button"
              onClick={onOpenProfileSetup}
              className="mt-4 h-11 rounded-xl bg-white px-5 font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Complete your profile
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
                />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-brand-gray font-grotesk text-lg font-semibold text-white">
                    {initials(email)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white text-black transition-colors hover:bg-white/80"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{email}</p>
                <p className="text-xs text-white/40">
                  {role === "candidate" ? "Candidate" : "Recruiter"}
                </p>
              </div>
            </div>
            {avatarError && <p className="text-sm text-red-400">{avatarError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {role === "candidate" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputGroup
                    label="Desired role"
                    placeholder="Backend Engineer"
                    type="text"
                    value={candidate.desiredRole}
                    onChange={(desiredRole) => setCandidate((prev) => ({ ...prev, desiredRole }))}
                  />
                  <InputGroup
                    label="Location"
                    placeholder="San Francisco, CA"
                    type="text"
                    value={candidate.location}
                    onChange={(location) => setCandidate((prev) => ({ ...prev, location }))}
                  />

                  <SelectGroup
                    label="Years of experience"
                    placeholder="Select a range"
                    value={candidate.experience}
                    onChange={(experience) => setCandidate((prev) => ({ ...prev, experience }))}
                    options={EXPERIENCE_OPTIONS}
                  />
                  <InputGroup
                    label="Portfolio / LinkedIn URL"
                    placeholder="https://linkedin.com/in/you"
                    type="url"
                    value={candidate.portfolioUrl}
                    onChange={(portfolioUrl) => setCandidate((prev) => ({ ...prev, portfolioUrl }))}
                  />

                  <InputGroup
                    label="Key skills"
                    placeholder="React, TypeScript, Node.js"
                    type="text"
                    value={candidate.skills}
                    onChange={(skills) => setCandidate((prev) => ({ ...prev, skills }))}
                  />
                  <FileUploadGroup
                    label="Resume"
                    file={resume}
                    onChange={setResume}
                    accept=".pdf,.doc,.docx"
                    existingLabel={existingResumeFilename}
                  />

                  <div className="sm:col-span-2">
                    <TextAreaGroup
                      label="Short bio"
                      placeholder="A couple sentences about your experience and what you're looking for."
                      value={candidate.bio}
                      onChange={(bio) => setCandidate((prev) => ({ ...prev, bio }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputGroup
                    label="Company name"
                    placeholder="Northwind"
                    type="text"
                    value={recruiter.companyName}
                    onChange={(companyName) => setRecruiter((prev) => ({ ...prev, companyName }))}
                  />
                  <InputGroup
                    label="Your job title"
                    placeholder="Head of Talent"
                    type="text"
                    value={recruiter.jobTitle}
                    onChange={(jobTitle) => setRecruiter((prev) => ({ ...prev, jobTitle }))}
                  />

                  <InputGroup
                    label="Company website"
                    placeholder="https://northwind.com"
                    type="url"
                    value={recruiter.companyWebsite}
                    onChange={(companyWebsite) =>
                      setRecruiter((prev) => ({ ...prev, companyWebsite }))
                    }
                  />
                  <SelectGroup
                    label="Company size"
                    placeholder="Select a size"
                    value={recruiter.companySize}
                    onChange={(companySize) => setRecruiter((prev) => ({ ...prev, companySize }))}
                    options={COMPANY_SIZE_OPTIONS}
                  />

                  <InputGroup
                    label="Industry"
                    placeholder="Software"
                    type="text"
                    value={recruiter.industry}
                    onChange={(industry) => setRecruiter((prev) => ({ ...prev, industry }))}
                  />
                  <FileUploadGroup
                    label="Company logo"
                    file={companyLogo}
                    onChange={setCompanyLogo}
                    accept="image/*"
                    existingLabel={existingCompanyLogoFilename}
                  />

                  <div className="sm:col-span-2">
                    <TextAreaGroup
                      label="Company description"
                      placeholder="A couple sentences about what your company does."
                      value={recruiter.companyBio}
                      onChange={(companyBio) => setRecruiter((prev) => ({ ...prev, companyBio }))}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
              {saved && <p className="text-sm text-emerald-400">Saved.</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
