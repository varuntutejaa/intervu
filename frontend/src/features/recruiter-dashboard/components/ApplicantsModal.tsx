import { X } from "lucide-react";
import { useJobApplicantsQuery, type Job } from "../../jobs/api";
import { ApplicantCard } from "./ApplicantCard";

export function ApplicantsModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const applicantsQuery = useJobApplicantsQuery(job.id);
  const applicants = applicantsQuery.data ?? [];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

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
          {applicantsQuery.isPending && <p className="text-sm text-white/50">Loading applicants…</p>}
          {applicantsQuery.isError && (
            <p className="text-sm text-red-400">Couldn't load applicants. Is the API running?</p>
          )}
          {applicantsQuery.isSuccess && applicants.length === 0 && (
            <p className="text-sm text-white/40">No one has applied to this job yet.</p>
          )}

          {applicants.length > 0 && (
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
