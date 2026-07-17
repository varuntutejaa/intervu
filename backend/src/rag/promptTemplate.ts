import type { RetrievedChunk } from "./types.js";

export const NO_CONTEXT_ANSWER =
  "I could not find sufficient information to answer your question confidently.";

export const SYSTEM_PROMPT = `You are an AI Resume Assistant.

Use ONLY the provided context. Do not use outside knowledge.

If the answer cannot be found in the context, reply exactly:
"${NO_CONTEXT_ANSWER}"

Answer with citations, referencing each source inline as "(Document Name, Page N)".`;

export function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] Source: ${c.metadata.source} (Page ${c.metadata.page})\n${c.text}`)
    .join("\n\n");
}

export function buildUserPrompt(question: string, chunks: RetrievedChunk[]): string {
  return `Context:\n${formatContext(chunks)}\n\nQuestion:\n${question}`;
}
