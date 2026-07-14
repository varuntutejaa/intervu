import { useState } from "react";
import type { FormEvent } from "react";
import { AuroraShell, type Role } from "./AuroraLayout";
import {
  CandidateProfileFields,
  EMPTY_CANDIDATE,
  EMPTY_RECRUITER,
  RecruiterProfileFields,
  type CandidateFields,
  type RecruiterFields,
} from "./ProfileFields";

export default function ProfileSetupPage({
  onNavigateHome,
  onComplete,
  role,
}: {
  onNavigateHome: () => void;
  onComplete: () => void;
  role: Role;
}) {
  const [candidate, setCandidate] = useState<CandidateFields>(EMPTY_CANDIDATE);
  const [resume, setResume] = useState<File | null>(null);
  const [recruiter, setRecruiter] = useState<RecruiterFields>(EMPTY_RECRUITER);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const fields =
        role === "candidate"
          ? { ...candidate, resumeFilename: resume?.name }
          : { ...recruiter, companyLogoFilename: companyLogo?.name };

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
      onComplete();
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuroraShell
      brand="Intervu"
      onNavigateHome={onNavigateHome}
      heroTitle="Almost there"
      heroDescription="A complete profile gets you better matches, faster."
    >
      <div>
        <h2 className="text-3xl font-medium tracking-tight text-white">Set up your profile</h2>
        <p className="mt-2 text-sm text-white/40">
          {role === "candidate"
            ? "Tell us a bit about your experience so we can find the right roles."
            : "Tell us a bit about your company so we can find the right candidates."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {role === "candidate" ? (
          <CandidateProfileFields
            values={candidate}
            onChange={(patch) => setCandidate((prev) => ({ ...prev, ...patch }))}
            resume={resume}
            onResumeChange={setResume}
          />
        ) : (
          <RecruiterProfileFields
            values={recruiter}
            onChange={(patch) => setRecruiter((prev) => ({ ...prev, ...patch }))}
            companyLogo={companyLogo}
            onCompanyLogoChange={setCompanyLogo}
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onComplete}
            className="h-14 flex-1 rounded-xl border border-white/10 font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 flex-1 rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </AuroraShell>
  );
}
