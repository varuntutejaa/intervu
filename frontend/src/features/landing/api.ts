import { useMutation } from "@tanstack/react-query";
import { apiJson } from "../../lib/api";

export type Citation = { document: string; page: number };
export type ChatResponse = { answer: string; citations: Citation[] };

export type ChatRequest = { question: string; resumeData?: string };

export function useChatMutation() {
  return useMutation({
    mutationFn: (payload: ChatRequest) =>
      apiJson<ChatResponse>(
        "/api/chat",
        "POST",
        payload,
        "Couldn't reach the resume assistant. Try again.",
      ),
  });
}
