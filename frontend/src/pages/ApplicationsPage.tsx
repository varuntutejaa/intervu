import { useEffect, useState } from "react";
import type { Role } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

type ApplicationStatus = "Applied" | "Scheduled" | "Interviewing" | "Offer" | "Rejected";

type Application = {
  id: number;
  job_id: number;
  title: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  applied_on: string;
  feedback: string | null;
};

function formatAppliedOn(date: string) {
  return `Applied ${new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: "bg-white/10 text-white/60",
  Scheduled: "bg-sky-400/20 text-sky-300",
  Interviewing: "bg-amber-400/20 text-amber-300",
  Offer: "bg-emerald-400/20 text-emerald-300",
  Rejected: "bg-red-400/20 text-red-300",
};

export default function ApplicationsPage({
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    fetch("/api/applications", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Application[]) => {
        setApplications(data);
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
        <h1 className="font-fustat text-3xl font-bold text-white">Your applications</h1>

        {status === "loading" && (
          <p className="mt-6 text-sm text-white/50">Loading applications…</p>
        )}
        {status === "error" && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load applications. Is the API running?
          </p>
        )}

        <div className="mt-6 space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-grotesk text-sm font-semibold text-white">{app.title}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {app.company} · {app.location} · {formatAppliedOn(app.applied_on)}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[app.status]}`}
                >
                  {app.status}
                </span>
              </div>
              {app.feedback && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-medium text-white/40">Recruiter feedback</p>
                  <p className="mt-1 text-sm text-white/70">{app.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
