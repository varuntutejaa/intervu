import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CompanyLogo } from "../../../components/CompanyLogo";
import { NavBar } from "../../../components/chrome/NavBar";
import { formatSalary } from "../../../lib/format";
import { useSessionQuery } from "../../auth/api";
import { useAppliedJobIdsQuery, useApplyToJobMutation } from "../../applications/api";
import { useJobQuery } from "../api";
import { ResumePickerModal } from "../components/ResumePickerModal";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Parameter({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3 text-sm">
      <span className="text-black/40">{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string | null | undefined }) {
  if (!body) return null;
  return (
    <div className="mt-8 border-t border-black/10 pt-8 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="font-fustat text-xl font-semibold text-black">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-black/60">{body}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = Number(id);

  const { data: session } = useSessionQuery();
  const role = session?.role ?? null;
  const user = session?.user ?? null;

  const jobQuery = useJobQuery(jobId);
  const appliedJobIdsQuery = useAppliedJobIdsQuery(role === "candidate");
  const applyMutation = useApplyToJobMutation();
  const [showResumePicker, setShowResumePicker] = useState(false);

  const job = jobQuery.data;
  const appliedJobIds = appliedJobIdsQuery.data ?? new Set<number>();
  const hasApplied = job ? appliedJobIds.has(job.id) : false;
  const isApplying = applyMutation.isPending && applyMutation.variables?.jobId === jobId;
  const applyError =
    applyMutation.isError && applyMutation.variables?.jobId === jobId ? applyMutation.error.message : undefined;

  const handleConfirmApply = (resumeId: number | null) => {
    applyMutation.mutate({ jobId, resumeId }, { onSuccess: () => setShowResumePicker(false) });
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="w-full px-6 pb-16 pt-28 sm:px-10 lg:px-16 xl:px-24">
        <button
          type="button"
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-1.5 text-sm text-black/50 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </button>

        {!Number.isInteger(jobId) && <p className="mt-6 text-sm text-red-600">Invalid job id.</p>}

        {jobQuery.isPending && Number.isInteger(jobId) && (
          <p className="mt-6 text-sm text-black/50">Loading job…</p>
        )}
        {jobQuery.isError && (
          <p className="mt-6 text-sm text-red-600">Couldn't load this job. It may have been removed.</p>
        )}

        {job && (
          <>
            <div className="mt-6 flex items-start gap-4">
              <CompanyLogo src={job.company_logo_url} company={job.company} size={56} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h1 className="font-fustat text-3xl font-bold text-black sm:text-4xl">{job.title}</h1>
                  {job.status === "closed" && (
                    <span className="text-xs font-medium uppercase tracking-wide text-black/40">Closed</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-black/50">
                  {job.company} · {job.location}
                  {job.job_code && <span className="text-black/30"> · #{job.job_code}</span>}
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-16 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                {(() => {
                  const salary = formatSalary(job.salary_min, job.salary_max);
                  return salary ? (
                    <p className="text-lg font-semibold text-black">{salary}</p>
                  ) : null;
                })()}

                {job.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-black/40">
                      Skills: <span className="text-black/70">{job.skills.join(", ")}</span>
                    </p>
                  </div>
                )}

                <Section title="Overview" body={job.description} />
                <Section title="Responsibilities" body={job.responsibilities} />
                <Section title="Qualifications" body={job.qualifications} />
              </div>

              <div className="mt-10 lg:mt-0">
                <div className="border-t border-black/10">
                  <Parameter label="Job number" value={job.job_code ? `#${job.job_code}` : null} />
                  <Parameter label="Date posted" value={formatDate(job.created_at)} />
                  <Parameter label="Worksite" value={job.work_mode} />
                  <Parameter label="Travel" value={job.travel} />
                  <Parameter label="Discipline" value={job.discipline} />
                  <Parameter label="Employment type" value={job.job_type} />
                  <Parameter label="Experience" value={job.experience} />
                  <Parameter
                    label="Application deadline"
                    value={job.application_deadline ? formatDate(job.application_deadline) : null}
                  />
                </div>

                {applyError && <p className="mt-4 text-sm text-red-600">{applyError}</p>}

                {job.status === "closed" ? (
                  <p className="mt-6 text-center text-sm text-black/40">
                    This posting is no longer accepting applications.
                  </p>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98]"
                  >
                    Log in to apply
                  </Link>
                ) : role !== "candidate" ? (
                  <p className="mt-6 text-center text-sm text-black/40">Only candidates can apply to jobs.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResumePicker(true)}
                    disabled={hasApplied || isApplying}
                    className="mt-6 h-12 w-full rounded-xl bg-accent font-semibold text-white transition-all hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {hasApplied ? "Applied" : isApplying ? "Applying…" : "Apply now"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showResumePicker && (
        <ResumePickerModal
          onClose={() => setShowResumePicker(false)}
          onConfirm={handleConfirmApply}
          isSubmitting={applyMutation.isPending}
        />
      )}
    </div>
  );
}
