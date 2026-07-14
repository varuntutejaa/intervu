import { useEffect, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import type { Role } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

type ApplicationStatus =
  | "Applied"
  | "Interview Scheduled"
  | "Technical Round"
  | "HR Round"
  | "Offer Received"
  | "Rejected";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Interview Scheduled",
  "Technical Round",
  "HR Round",
  "Offer Received",
  "Rejected",
];

type Application = {
  id: number;
  job_id: number | null;
  title: string;
  company: string;
  location: string | null;
  status: ApplicationStatus;
  applied_on: string;
  feedback_technical_rating: number | null;
  feedback_communication_rating: number | null;
  feedback_overall_rating: number | null;
  feedback_strengths: string | null;
  feedback_weaknesses: string | null;
  feedback_recommendation: string | null;
};

function formatAppliedOn(date: string) {
  return `Applied ${new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: "bg-white/10 text-white/60",
  "Interview Scheduled": "bg-sky-400/20 text-sky-300",
  "Technical Round": "bg-amber-400/20 text-amber-300",
  "HR Round": "bg-amber-400/20 text-amber-300",
  "Offer Received": "bg-emerald-400/20 text-emerald-300",
  Rejected: "bg-red-400/20 text-red-300",
};

const SELECT_CLASS =
  "h-10 rounded-xl border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20";

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
  const [showAddModal, setShowAddModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const loadApplications = () => {
    setStatus("loading");
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("sort", sort);

    fetch(`/api/applications?${params.toString()}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data: Application[]) => {
        setApplications(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sort]);

  const handleStatusChange = async (app: Application, nextStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: nextStatus } : a)),
    );
    await fetch(`/api/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  const handleDelete = async (app: Application) => {
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    await fetch(`/api/applications/${app.id}`, { method: "DELETE", credentials: "include" });
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-fustat text-3xl font-bold text-white">Your applications</h1>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-black transition-colors hover:bg-white/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Log an application
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border-none bg-brand-gray px-3 text-white/60">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by company or position..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "asc" | "desc")}
            className={SELECT_CLASS}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {status === "loading" && (
          <p className="mt-6 text-sm text-white/50">Loading applications…</p>
        )}
        {status === "error" && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load applications. Is the API running?
          </p>
        )}
        {status === "ready" && applications.length === 0 && (
          <p className="mt-6 text-sm text-white/40">
            No applications match your search/filters yet.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {applications.map((app) => {
            const hasFeedback =
              app.feedback_technical_rating !== null ||
              app.feedback_communication_rating !== null ||
              app.feedback_overall_rating !== null ||
              app.feedback_strengths ||
              app.feedback_weaknesses ||
              app.feedback_recommendation;

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-grotesk text-sm font-semibold text-white">{app.title}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {[app.company, app.location, formatAppliedOn(app.applied_on)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app, e.target.value as ApplicationStatus)
                      }
                      className={`w-fit rounded-full border-none px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/20 ${STATUS_STYLES[app.status]}`}
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#1c1c1e] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDelete(app)}
                      aria-label="Delete application"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {hasFeedback && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-medium text-white/40">Recruiter feedback</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-white/60">
                      {app.feedback_technical_rating !== null && (
                        <span>Technical: {app.feedback_technical_rating}/5</span>
                      )}
                      {app.feedback_communication_rating !== null && (
                        <span>Communication: {app.feedback_communication_rating}/5</span>
                      )}
                      {app.feedback_overall_rating !== null && (
                        <span>Overall: {app.feedback_overall_rating}/5</span>
                      )}
                      {app.feedback_recommendation && (
                        <span className="font-medium text-white/80">
                          {app.feedback_recommendation}
                        </span>
                      )}
                    </div>
                    {app.feedback_strengths && (
                      <p className="mt-1.5 text-sm text-white/70">
                        <span className="text-white/40">Strengths: </span>
                        {app.feedback_strengths}
                      </p>
                    )}
                    {app.feedback_weaknesses && (
                      <p className="mt-1 text-sm text-white/70">
                        <span className="text-white/40">Weaknesses: </span>
                        {app.feedback_weaknesses}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            loadApplications();
          }}
        />
      )}
    </div>
  );
}

function AddApplicationModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [appliedOn, setAppliedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("Applied");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!company.trim() || !position.trim()) {
      setError("Company and position are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company: company.trim(),
          position: position.trim(),
          appliedOn,
          status: applicationStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't log this application. Try again.");
        return;
      }
      onAdded();
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

      <div className="relative w-[90vw] max-w-md rounded-2xl border border-white/10 bg-[#1c1c1e] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 font-fustat text-xl font-bold text-white">Log an application</h2>
        <p className="mt-1 text-sm text-white/50">
          Track an application you made outside Intervu.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Frontend Engineer"
              className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50">Applied on</label>
              <input
                type="date"
                value={appliedOn}
                onChange={(e) => setAppliedOn(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50">Status</label>
              <select
                value={applicationStatus}
                onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Saving…" : "Add application"}
        </button>
      </div>
    </div>
  );
}
