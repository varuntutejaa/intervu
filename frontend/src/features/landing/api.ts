import { useMutation } from "@tanstack/react-query";
import { apiJson } from "../../lib/api";

export type Citation = { document: string; page: number };
export type ChatResponse = { answer: string; citations: Citation[] };

export function useChatMutation() {
  return useMutation({
    mutationFn: (question: string) =>
      apiJson<ChatResponse>(
        "/api/chat",
        "POST",
        { question },
        "Couldn't reach the resume assistant. Try again.",
      ),
  });
}
