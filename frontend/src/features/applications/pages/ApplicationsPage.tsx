import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Pager } from "../../../components/Pager";
import { NavBar } from "../../../components/chrome/NavBar";
import {
  APPLICATION_STATUSES,
  useApplicationsQuery,
  useDeleteApplicationMutation,
  useUpdateApplicationMutation,
  useWithdrawApplicationMutation,
  type Application,
  type ApplicationStatus,
} from "../api";
import { AddApplicationModal } from "../components/AddApplicationModal";

function formatAppliedOn(date: string) {
  return `Applied ${new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Applied: "bg-black/10 text-black/60",
  "Interview Scheduled": "bg-sky-100 text-sky-700",
  "Technical Round": "bg-amber-100 text-amber-700",
  "HR Round": "bg-amber-100 text-amber-700",
  "Offer Received": "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Withdrawn: "bg-black/10 text-black/40",
};

const SELECT_CLASS =
  "h-10 rounded-xl border-none bg-brand-gray px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20";

export default function ApplicationsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter/sort change starts back at page 1 — staying on page 4 of a
  // filtered-down result set would just show an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sort]);

  const applicationsQuery = useApplicationsQuery({ q: search, status: statusFilter, sort, page });
  const updateMutation = useUpdateApplicationMutation();
  const deleteMutation = useDeleteApplicationMutation();
  const withdrawMutation = useWithdrawApplicationMutation();

  const applications = applicationsQuery.data?.items ?? [];

  const handleStatusChange = (app: Application, nextStatus: ApplicationStatus) => {
    updateMutation.mutate({ id: app.id, status: nextStatus });
  };

  const handleDelete = (app: Application) => {
    deleteMutation.mutate(app.id);
  };

  const handleWithdraw = (app: Application) => {
    if (window.confirm("Withdraw this application? This can't be undone.")) {
      withdrawMutation.mutate(app.id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-fustat text-3xl font-bold text-black">Your applications</h1>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-black px-4 text-xs font-semibold text-white transition-colors hover:bg-black/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Log an application
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border-none bg-brand-gray px-3 text-black/60">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by company or position..."
              className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
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

        {applicationsQuery.isPending && (
          <p className="mt-6 text-sm text-black/50">Loading applications…</p>
        )}
        {applicationsQuery.isError && (
          <p className="mt-6 text-sm text-red-600">Couldn't load applications. Is the API running?</p>
        )}
        {applicationsQuery.isSuccess && applications.length === 0 && (
          <p className="mt-6 text-sm text-black/40">No applications match your search/filters yet.</p>
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

            const isUpdating = updateMutation.isPending && updateMutation.variables?.id === app.id;
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === app.id;
            const isWithdrawing = withdrawMutation.isPending && withdrawMutation.variables === app.id;
            const updateFailed = updateMutation.isError && updateMutation.variables?.id === app.id;
            const withdrawFailed = withdrawMutation.isError && withdrawMutation.variables === app.id;

            // Applications to a real posting (job_id set) are owned by the
            // recruiter's pipeline — the candidate can only see status and
            // withdraw, never set an arbitrary status or delete the row.
            // Manually-logged, off-platform entries (job_id null) have no
            // recruiter counterpart, so those stay fully self-managed.
            const isPlatformApplication = app.job_id !== null;

            return (
              <div key={app.id} className="rounded-2xl border border-black/10 bg-black/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-grotesk text-sm font-semibold text-black">{app.title}</p>
                    <p className="mt-1 text-xs text-black/50">
                      {[app.company, app.location, formatAppliedOn(app.applied_on)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlatformApplication ? (
                      <>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[app.status]}`}
                        >
                          {app.status}
                        </span>
                        {app.status !== "Withdrawn" && (
                          <button
                            type="button"
                            onClick={() => handleWithdraw(app)}
                            disabled={isWithdrawing}
                            className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-black/50 transition-colors hover:bg-black/10 hover:text-red-600 disabled:opacity-50"
                          >
                            {isWithdrawing ? "Withdrawing…" : "Withdraw"}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <select
                          value={app.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                          className={`w-fit rounded-full border-none px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50 ${STATUS_STYLES[app.status]}`}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#f7f7f8] text-black">
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDelete(app)}
                          disabled={isDeleting}
                          aria-label="Delete application"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/40 transition-colors hover:bg-black/10 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {withdrawFailed && (
                  <p className="mt-2 text-xs text-red-600">{withdrawMutation.error.message}</p>
                )}
                {updateFailed && (
                  <p className="mt-2 text-xs text-red-600">{updateMutation.error.message}</p>
                )}

                {hasFeedback && (
                  <div className="mt-3 rounded-xl border border-black/10 bg-white/20 p-3">
                    <p className="text-xs font-medium text-black/40">Recruiter feedback</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-black/60">
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
                        <span className="font-medium text-black/80">{app.feedback_recommendation}</span>
                      )}
                    </div>
                    {app.feedback_strengths && (
                      <p className="mt-1.5 text-sm text-black/70">
                        <span className="text-black/40">Strengths: </span>
                        {app.feedback_strengths}
                      </p>
                    )}
                    {app.feedback_weaknesses && (
                      <p className="mt-1 text-sm text-black/70">
                        <span className="text-black/40">Weaknesses: </span>
                        {app.feedback_weaknesses}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {applicationsQuery.data && (
          <Pager
            page={applicationsQuery.data.page}
            totalPages={applicationsQuery.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
