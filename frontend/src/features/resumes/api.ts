import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";

export type Resume = {
  id: number;
  filename: string;
  uploaded_at: string;
};

export type ResumeDetail = Resume & { data: string };

export function useResumesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: () => apiFetch<Resume[]>("/api/resumes"),
    enabled,
  });
}

// Fetched on demand (not part of the list query, which deliberately omits
// the file data) — used by "View" to open the actual PDF.
export function useFetchResumeDetail() {
  return useMutation({
    mutationFn: (id: number) => apiFetch<ResumeDetail>(`/api/resumes/${id}`, { fallbackError: "Couldn't open that resume. Try again." }),
  });
}

export function useUploadResumeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { filename: string; data: string }) =>
      apiJson<{ id: number }>("/api/resumes", "POST", input, "Couldn't upload that resume. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useReplaceResumeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filename, data }: { id: number; filename: string; data: string }) =>
      apiJson(`/api/resumes/${id}`, "PUT", { filename, data }, "Couldn't replace that resume. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useDeleteResumeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/resumes/${id}`, "DELETE", undefined, "Couldn't delete that resume. Try again."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });
}
