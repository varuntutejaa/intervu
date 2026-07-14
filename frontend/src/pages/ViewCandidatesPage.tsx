import { useEffect, useState } from "react";
import type { Role } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

type Candidate = {
  auth_sub: string;
  email: string;
  desired_role: string | null;
  location: string | null;
  experience: string | null;
  portfolio_url: string | null;
  skills: string | null;
  bio: string | null;
  resume_filename: string | null;
  avatar_url: string | null;
};

function initials(candidate: Candidate) {
  return candidate.email.slice(0, 2).toUpperCase();
}

export default function ViewCandidatesPage({
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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    fetch("/api/candidates", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Candidate[]) => {
        setCandidates(data);
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

      <div className="mx-auto max-w-4xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">Candidates</h1>
        <p className="mt-2 text-sm text-white/40">Everyone who's set up a candidate profile.</p>

        {status === "loading" && <p className="mt-6 text-sm text-white/50">Loading candidates…</p>}
        {status === "error" && (
          <p className="mt-6 text-sm text-red-400">Couldn't load candidates. Is the API running?</p>
        )}
        {status === "ready" && candidates.length === 0 && (
          <p className="mt-6 text-sm text-white/40">No candidate profiles yet.</p>
        )}

        {status === "ready" && candidates.length > 0 && (
          <div className="mt-6 space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.auth_sub}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-4">
                  {candidate.avatar_url ? (
                    <img
                      src={candidate.avatar_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-gray font-grotesk text-sm font-semibold text-white">
                      {initials(candidate)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-fustat text-lg font-semibold text-white">
                        {candidate.desired_role || "Candidate"}
                      </p>
                      <p className="text-xs text-white/40">{candidate.email}</p>
                    </div>
                    <p className="text-sm text-white/40">
                      {[candidate.location, candidate.experience && `${candidate.experience} experience`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {candidate.bio && (
                      <p className="mt-2 text-sm text-white/70">{candidate.bio}</p>
                    )}

                    {candidate.skills && (
                      <p className="mt-2 text-xs text-white/40">Skills: {candidate.skills}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {candidate.portfolio_url && (
                        <a
                          href={candidate.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white underline underline-offset-2"
                        >
                          Portfolio
                        </a>
                      )}
                      {candidate.resume_filename && (
                        <span className="text-white/40">Resume: {candidate.resume_filename}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
