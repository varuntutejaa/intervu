import { useEffect, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Pager } from "../../../components/Pager";
import { useApplicantDetailQuery, useJobApplicantsQuery, type Applicant, type Job } from "../../jobs/api";
import { ApplicantCard } from "./ApplicantCard";

const PAGE_SIZE = 20;

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function ApplicantRow({
  jobId,
  applicant,
  isExpanded,
  onToggle,
}: {
  jobId: number;
  applicant: Applicant;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // The list row never carries the resume blob — fetch full detail only
  // once this row is actually expanded, so scrolling through a huge
  // applicant list never pulls resumes you're not looking at.
  const detailQuery = useApplicantDetailQuery(jobId, isExpanded ? applicant.application_id : null);

  return (
    <div className="rounded-2xl border border-black/10 bg-black/5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {applicant.avatar_url ? (
          <img
            src={applicant.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-black/10 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-brand-gray font-grotesk text-xs font-semibold text-black">
            {initials(applicant.email)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-fustat text-sm font-semibold text-black">
            {applicant.full_name || applicant.desired_role || "Candidate"}
          </p>
          <p className="truncate text-xs text-black/40">{applicant.email}</p>
        </div>

        <span className="shrink-0 rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-medium text-black/60">
          {applicant.status}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-black/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-black/10 p-4 pt-0">
          {detailQuery.isPending && <p className="pt-4 text-sm text-black/40">Loading details…</p>}
          {detailQuery.isError && (
            <p className="pt-4 text-sm text-red-600">Couldn't load this applicant's details.</p>
          )}
          {detailQuery.data && <ApplicantCard jobId={jobId} applicant={detailQuery.data} />}
        </div>
      )}
    </div>
  );
}

export function ApplicantsModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const applicantsQuery = useJobApplicantsQuery(job.id, { q: search, page, pageSize: PAGE_SIZE });
  const applicants = applicantsQuery.data?.items ?? [];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative flex h-[80vh] w-[90vw] flex-col rounded-2xl border border-black/10 bg-[#f7f7f8] p-6 shadow-2xl sm:h-[70vh] sm:w-[70vw]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/10 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 font-fustat text-2xl font-bold text-black">{job.title}</h2>
        <p className="mt-1 text-sm text-black/50">
          {job.company} · {job.location}
          {applicantsQuery.data && ` · ${applicantsQuery.data.total} applicant${applicantsQuery.data.total === 1 ? "" : "s"}`}
        </p>

        <div className="mt-4 flex h-10 w-full max-w-sm shrink-0 items-center gap-2 rounded-xl border-none bg-black/5 px-3 text-black/60">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
          />
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {applicantsQuery.isPending && <p className="text-sm text-black/50">Loading applicants…</p>}
          {applicantsQuery.isError && (
            <p className="text-sm text-red-600">Couldn't load applicants. Is the API running?</p>
          )}
          {applicantsQuery.isSuccess && applicants.length === 0 && (
            <p className="text-sm text-black/40">
              {search ? "No applicants match your search." : "No one has applied to this job yet."}
            </p>
          )}

          {applicants.length > 0 && (
            <div className="space-y-3">
              {applicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.application_id}
                  jobId={job.id}
                  applicant={applicant}
                  isExpanded={expandedId === applicant.application_id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === applicant.application_id ? null : applicant.application_id,
                    )
                  }
                />
              ))}
            </div>
          )}

          {applicantsQuery.data && (
            <Pager page={applicantsQuery.data.page} totalPages={applicantsQuery.data.totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}
