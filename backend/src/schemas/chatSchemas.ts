import { z } from "zod";

export const askChatSchema = z.object({
  // Preprocessed so a missing/non-string question fails with the same
  // "question is required" message as an empty one, rather than a generic
  // Zod type error.
  question: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(1, "question is required"),
  ),
  resumeData: z.string().optional(),
});
export type AskChatInput = z.infer<typeof askChatSchema>;
