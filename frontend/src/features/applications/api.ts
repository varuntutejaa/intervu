import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";

export type ApplicationStatus =
  | "Applied"
  | "Interview Scheduled"
  | "Technical Round"
  | "HR Round"
  | "Offer Received"
  | "Rejected"
  | "Withdrawn";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Interview Scheduled",
  "Technical Round",
  "HR Round",
  "Offer Received",
  "Rejected",
  "Withdrawn",
];

export type Application = {
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

export type ApplicationFilters = { q?: string; status?: string; sort?: "asc" | "desc" };

function buildApplicationsQueryString(filters: ApplicationFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  return params.toString();
}

export function useApplicationsQuery(filters: ApplicationFilters) {
  return useQuery({
    queryKey: ["applications", "list", filters],
    queryFn: () =>
      apiFetch<Application[]>(`/api/applications?${buildApplicationsQueryString(filters)}`),
  });
}

// Candidate-only lookup of which jobs they've already applied to, used by
// JobsPage to show "Applied" vs "Apply". Disabled entirely for non-candidates.
export function useAppliedJobIdsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["applications", "appliedJobIds"],
    queryFn: async () => {
      const apps = await apiFetch<Application[]>("/api/applications");
      return new Set(apps.map((a) => a.job_id).filter((id): id is number => id !== null));
    },
    enabled,
  });
}

export function useApplyToJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: number) =>
      apiJson("/api/applications", "POST", { jobId }, "Couldn't apply. Try again."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      company: string;
      position: string;
      appliedOn: string;
      status: ApplicationStatus;
    }) => apiJson("/api/applications", "POST", input, "Couldn't log this application. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      apiJson(`/api/applications/${id}`, "PATCH", { status }, "Couldn't update status. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/applications/${id}/withdraw`, "PATCH", undefined, "Couldn't withdraw. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useDeleteApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/applications/${id}`, "DELETE", undefined, "Couldn't delete. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
}
