import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import type { Paginated } from "../../lib/pagination";

export type Candidate = {
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

export function useCandidatesQuery(page: number) {
  return useQuery({
    queryKey: ["candidates", page],
    queryFn: () => apiFetch<Paginated<Candidate>>(`/api/candidates?page=${page}`),
  });
}
