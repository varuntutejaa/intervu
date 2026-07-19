import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../../lib/api";
import type { NavUser, Role } from "../../types";

export type Session = { user: NavUser; role: Role | null; roles: Role[] };

export const sessionKey = ["session"] as const;

async function fetchSession(): Promise<Session | null> {
  try {
    return await apiFetch<Session>("/api/auth/me");
  } catch {
    return null;
  }
}

export function useSessionQuery() {
  return useQuery({ queryKey: sessionKey, queryFn: fetchSession });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      apiJson<{ status: string }>(
        "/api/auth/signup",
        "POST",
        input,
        "Couldn't create your account. Try again.",
      ),
  });
}

export function useConfirmSignupMutation() {
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      apiJson<{ status: string }>(
        "/api/auth/confirm",
        "POST",
        input,
        "Couldn't verify that code. Try again.",
      ),
  });
}

export function useResendCodeMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiJson<{ status: string }>("/api/auth/resend-code", "POST", { email }),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; role?: Role | null }) => {
      await apiJson("/api/auth/login", "POST", input, "Couldn't log in. Try again.");
      return fetchSession();
    },
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiJson<{ status: string }>("/api/auth/logout", "POST"),
    onSuccess: () => {
      queryClient.setQueryData(sessionKey, null);
    },
  });
}

