import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  work_mode: string;
  experience: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  skills: string[];
  application_deadline: string | null;
  job_code: string | null;
  status?: string;
  created_at: string;
  travel: string | null;
  discipline: string | null;
  responsibilities: string | null;
  qualifications: string | null;
};

export type JobStats = {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  byStatus: Record<string, number>;
  jobs: {
    id: number;
    title: string;
    status: string;
    total: number;
    byStatus: Record<string, number>;
  }[];
  totalCandidates: number;
  totalResumesUploaded: number;
  topCompanies: { company: string; count: number }[];
  interviewCompletionRate: number;
};

export type Applicant = {
  application_id: number;
  status: string;
  applied_on: string;
  feedback_technical_rating: number | null;
  feedback_communication_rating: number | null;
  feedback_overall_rating: number | null;
  feedback_strengths: string | null;
  feedback_weaknesses: string | null;
  feedback_recommendation: string | null;
  auth_sub: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  desired_role: string | null;
  location: string | null;
  experience: string | null;
  current_status: string | null;
  technical_skills: string[] | null;
  soft_skills: string[] | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  resume_filename: string | null;
  resume_data: string | null;
  resume_uploaded_at: string | null;
  avatar_url: string | null;
};

export type JobFilters = {
  q?: string;
  jobType?: string;
  workMode?: string;
  experience?: string;
};

function buildJobsQueryString(filters: JobFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.jobType) params.set("jobType", filters.jobType);
  if (filters.workMode) params.set("workMode", filters.workMode);
  if (filters.experience) params.set("experience", filters.experience);
  return params.toString();
}

export function useJobsQuery(filters: JobFilters) {
  return useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => apiFetch<Job[]>(`/api/jobs?${buildJobsQueryString(filters)}`),
  });
}

export function useJobQuery(id: number) {
  return useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: () => apiFetch<Job>(`/api/jobs/${id}`),
  });
}

export function useMyJobsQuery() {
  return useQuery({
    queryKey: ["jobs", "mine"],
    queryFn: () => apiFetch<Job[]>("/api/jobs/mine"),
  });
}

export function useJobStatsQuery() {
  return useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: () => apiFetch<JobStats>("/api/jobs/stats"),
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) =>
      apiJson<{ job_code: string }>("/api/jobs", "POST", payload, "Couldn't post this job. Try again."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "stats"] });
    },
  });
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: unknown }) =>
      apiJson(`/api/jobs/${id}`, "PATCH", payload, "Couldn't save changes. Try again."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "stats"] });
    },
  });
}

export function useJobApplicantsQuery(jobId: number) {
  return useQuery({
    queryKey: ["jobs", jobId, "applicants"],
    queryFn: () => apiFetch<Applicant[]>(`/api/jobs/${jobId}/applicants`),
  });
}

export type ApplicantFeedbackPayload = {
  status: string;
  feedback: {
    technicalRating: number | null;
    communicationRating: number | null;
    overallRating: number | null;
    strengths: string | null;
    weaknesses: string | null;
    recommendation: string | null;
  };
};

export function useUpdateApplicantMutation(jobId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      payload,
    }: {
      applicationId: number;
      payload: ApplicantFeedbackPayload;
    }) => apiJson(`/api/jobs/${jobId}/applicants/${applicationId}`, "PATCH", payload, "Couldn't save. Try again."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "applicants"] });
    },
  });
}
