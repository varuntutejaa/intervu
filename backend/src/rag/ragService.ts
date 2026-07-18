import { generateGroundedAnswer } from "./llm.js";
import { NO_CONTEXT_ANSWER } from "./promptTemplate.js";
import { retrieve } from "./retriever.js";
import type { ChatAnswer, Citation, RetrievedChunk } from "./types.js";

function dedupeCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const c of chunks) {
    const key = `${c.metadata.source}#${c.metadata.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ document: c.metadata.source, page: c.metadata.page });
  }

  return citations;
}

export async function answerQuestion(
  question: string,
  resumeText?: string,
): Promise<ChatAnswer> {
  const { chunks, confident } = await retrieve(question);

  // Below-threshold similarity means the knowledge base likely has no good
  // answer, so we short-circuit before spending an LLM call on it.
  if (!confident || chunks.length === 0) {
    return { answer: NO_CONTEXT_ANSWER, citations: [] };
  }

  const answer = await generateGroundedAnswer(question, chunks, resumeText);
  if (answer === NO_CONTEXT_ANSWER) {
    return { answer: NO_CONTEXT_ANSWER, citations: [] };
  }

  return { answer, citations: dedupeCitations(chunks) };
}
