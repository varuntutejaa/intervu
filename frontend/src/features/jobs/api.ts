import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";
import type { Paginated } from "../../lib/pagination";

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
  company_logo_url: string | null;
  applicant_count: number;
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

export type TrendingCompany = {
  company: string;
  company_logo_url: string | null;
  open_positions: number;
  titles: string[];
  has_remote: boolean;
  latest_posted_at: string;
};

export type JobFilters = {
  q?: string;
  // Each accepts either a single value or several — arrays are joined into
  // a comma-separated list the backend splits back apart (= ANY(...)),
  // which is what lets the sidebar's checkbox facets multi-select.
  jobType?: string | string[];
  workMode?: string | string[];
  experience?: string | string[];
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  pageSize?: number;
};

function csv(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value.join(",") : (value ?? "");
}

function buildJobsQueryString(filters: JobFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  const jobType = csv(filters.jobType);
  if (jobType) params.set("jobType", jobType);
  const workMode = csv(filters.workMode);
  if (workMode) params.set("workMode", workMode);
  const experience = csv(filters.experience);
  if (experience) params.set("experience", experience);
  if (filters.location) params.set("location", filters.location);
  if (filters.minSalary !== undefined) params.set("minSalary", String(filters.minSalary));
  if (filters.maxSalary !== undefined) params.set("maxSalary", String(filters.maxSalary));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  return params.toString();
}

export function useJobsQuery(filters: JobFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => apiFetch<Paginated<Job>>(`/api/jobs?${buildJobsQueryString(filters)}`),
    enabled: options?.enabled ?? true,
  });
}

export function useTrendingCompaniesQuery(limit = 4, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["jobs", "trending-companies", limit],
    queryFn: () => apiFetch<TrendingCompany[]>(`/api/jobs/trending-companies?limit=${limit}`),
    enabled: options?.enabled ?? true,
  });
}

export function useJobQuery(id: number) {
  return useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: () => apiFetch<Job>(`/api/jobs/${id}`),
  });
}

export function useMyJobsQuery(page: number, q?: string) {
  return useQuery({
    queryKey: ["jobs", "mine", page, q],
    queryFn: () =>
      apiFetch<Paginated<Job>>(`/api/jobs/mine?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
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

export type ApplicantFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
};

function buildApplicantsQueryString(filters: ApplicantFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  return params.toString();
}

export function useJobApplicantsQuery(jobId: number, filters: ApplicantFilters) {
  return useQuery({
    queryKey: ["jobs", jobId, "applicants", filters],
    queryFn: () =>
      apiFetch<Paginated<Applicant>>(`/api/jobs/${jobId}/applicants?${buildApplicantsQueryString(filters)}`),
  });
}

// Full detail (including the resume blob) for exactly one applicant,
// fetched only once a recruiter expands that row — not bundled into the
// paginated list, which needs to stay light even with huge applicant counts.
export function useApplicantDetailQuery(jobId: number, applicationId: number | null) {
  return useQuery({
    queryKey: ["jobs", jobId, "applicants", "detail", applicationId],
    queryFn: () => apiFetch<Applicant>(`/api/jobs/${jobId}/applicants/${applicationId}`),
    enabled: applicationId !== null,
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
