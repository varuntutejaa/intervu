import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateApplicantMutation, type Applicant } from "../../jobs/api";
import { applicantFeedbackSchema, type ApplicantFeedbackFormValues } from "../schema";
import { RatingSelect } from "./RatingSelect";

const APPLICATION_STATUSES = [
  "Applied",
  "Interview Scheduled",
  "Technical Round",
  "HR Round",
  "Offer Received",
  "Rejected",
  // A candidate can withdraw on their own (applications.ts's PATCH
  // /:id/withdraw) — included here so the dropdown still shows the real
  // current status instead of silently mismatching it.
  "Withdrawn",
];
const RECOMMENDATION_OPTIONS = ["Strong Hire", "Hire", "No Hire", "Strong No Hire"];

export function ApplicantCard({ jobId, applicant }: { jobId: number; applicant: Applicant }) {
  const updateApplicantMutation = useUpdateApplicantMutation(jobId);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<ApplicantFeedbackFormValues>({
    resolver: zodResolver(applicantFeedbackSchema),
    defaultValues: {
      status: applicant.status,
      technicalRating: applicant.feedback_technical_rating,
      communicationRating: applicant.feedback_communication_rating,
      overallRating: applicant.feedback_overall_rating,
      strengths: applicant.feedback_strengths ?? "",
      weaknesses: applicant.feedback_weaknesses ?? "",
      recommendation: applicant.feedback_recommendation ?? "",
    },
  });

  const onSubmit = async (values: ApplicantFeedbackFormValues) => {
    try {
      await updateApplicantMutation.mutateAsync({
        applicationId: applicant.application_id,
        payload: {
          status: values.status,
          feedback: {
            technicalRating: values.technicalRating,
            communicationRating: values.communicationRating,
            overallRating: values.overallRating,
            strengths: values.strengths || null,
            weaknesses: values.weaknesses || null,
            recommendation: values.recommendation || null,
          },
        },
      });
      reset(values);
    } catch {
      // surfaced via updateApplicantMutation.error below
    }
  };

  // A one-click path to the most common recruiter action, instead of
  // requiring "open the status dropdown, pick Rejected, then hit Save" for
  // what's usually a snap decision.
  const handleReject = async () => {
    const values = getValues();
    try {
      await updateApplicantMutation.mutateAsync({
        applicationId: applicant.application_id,
        payload: {
          status: "Rejected",
          feedback: {
            technicalRating: values.technicalRating,
            communicationRating: values.communicationRating,
            overallRating: values.overallRating,
            strengths: values.strengths || null,
            weaknesses: values.weaknesses || null,
            recommendation: values.recommendation || null,
          },
        },
      });
      reset({ ...values, status: "Rejected" });
    } catch {
      // surfaced via updateApplicantMutation.error below
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-black/40">
            {[
              applicant.desired_role,
              applicant.location,
              applicant.experience && `${applicant.experience} experience`,
              applicant.current_status,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {applicant.phone_number && (
            <p className="mt-0.5 text-xs text-black/40">{applicant.phone_number}</p>
          )}

          {applicant.bio && <p className="mt-2 text-sm text-black/70">{applicant.bio}</p>}
          {applicant.technical_skills && applicant.technical_skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {applicant.technical_skills.map((skill) => (
                <span key={skill} className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-black/60">
                  {skill}
                </span>
              ))}
            </div>
          )}
          {applicant.soft_skills && applicant.soft_skills.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {applicant.soft_skills.map((skill) => (
                <span key={skill} className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/40">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {applicant.linkedin_url && (
              <a
                href={applicant.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-black underline underline-offset-2"
              >
                LinkedIn
              </a>
            )}
            {applicant.github_url && (
              <a
                href={applicant.github_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-black underline underline-offset-2"
              >
                GitHub
              </a>
            )}
            {applicant.portfolio_url && (
              <a
                href={applicant.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-black underline underline-offset-2"
              >
                Portfolio
              </a>
            )}
            {applicant.resume_data ? (
              <a
                href={applicant.resume_data}
                download={applicant.resume_filename ?? "resume"}
                className="font-medium text-black underline underline-offset-2"
              >
                Resume: {applicant.resume_filename ?? "download"}
              </a>
            ) : (
              applicant.resume_filename && (
                <span className="text-black/40">Resume: {applicant.resume_filename}</span>
              )
            )}
            {applicant.resume_uploaded_at && (
              <span className="text-black/30">
                Uploaded{" "}
                {new Date(applicant.resume_uploaded_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            <span className="text-black/30">
              Applied{" "}
              {new Date(applicant.applied_on).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 rounded-xl border border-black/10 bg-white/20 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-medium text-black/50">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="h-9 rounded-lg border-none bg-brand-gray px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={applicant.status === "Rejected" || updateApplicantMutation.isPending}
                  className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reject candidate
                </button>
              </div>

              <p className="mt-4 text-xs font-medium text-black/50">Interview feedback</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Controller
                  name="technicalRating"
                  control={control}
                  render={({ field }) => (
                    <RatingSelect label="Technical" value={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="communicationRating"
                  control={control}
                  render={({ field }) => (
                    <RatingSelect label="Communication" value={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="overallRating"
                  control={control}
                  render={({ field }) => (
                    <RatingSelect label="Overall" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-black/50">Strengths</label>
                  <Controller
                    name="strengths"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="What stood out positively"
                        rows={2}
                        className="mt-1.5 w-full resize-none rounded-lg border-none bg-brand-gray px-3 py-2 text-sm text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50">Weaknesses</label>
                  <Controller
                    name="weaknesses"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Areas of concern"
                        rows={2}
                        className="mt-1.5 w-full resize-none rounded-lg border-none bg-brand-gray px-3 py-2 text-sm text-black placeholder:text-black/20 focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-xs font-medium text-black/50">Recommendation</label>
                <Controller
                  name="recommendation"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="h-9 rounded-lg border-none bg-brand-gray px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                    >
                      <option value="">No recommendation yet</option>
                      {RECOMMENDATION_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isDirty || updateApplicantMutation.isPending}
                  className="h-8 rounded-lg bg-black px-3 text-xs font-semibold text-white transition-all hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updateApplicantMutation.isPending ? "Saving…" : "Save"}
                </button>
                {!isDirty && updateApplicantMutation.isSuccess && (
                  <span className="text-xs text-emerald-600">Saved.</span>
                )}
                {updateApplicantMutation.isError && (
                  <span className="text-xs text-red-600">{updateApplicantMutation.error.message}</span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
