import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera } from "lucide-react";
import type { Role } from "./AuroraLayout";
import { NavBar, type NavUser } from "./LandingChrome";
import {
  CandidateProfileFields,
  EMPTY_CANDIDATE,
  EMPTY_RECRUITER,
  RecruiterProfileFields,
  type CandidateFields,
  type RecruiterFields,
} from "./ProfileFields";

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

      <div className="mx-auto max-w-2xl space-y-8 px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
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
              You haven't set up your profile. Head back to finish signing up to create one.
            </p>
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
                <CandidateProfileFields
                  values={candidate}
                  onChange={(patch) => setCandidate((prev) => ({ ...prev, ...patch }))}
                  resume={resume}
                  onResumeChange={setResume}
                  existingResumeFilename={existingResumeFilename}
                />
              ) : (
                <RecruiterProfileFields
                  values={recruiter}
                  onChange={(patch) => setRecruiter((prev) => ({ ...prev, ...patch }))}
                  companyLogo={companyLogo}
                  onCompanyLogoChange={setCompanyLogo}
                  existingCompanyLogoFilename={existingCompanyLogoFilename}
                />
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
