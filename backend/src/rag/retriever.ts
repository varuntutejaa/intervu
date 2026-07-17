import { ragConfig } from "./config.js";
import { embedQuery } from "./embeddings.js";
import { search } from "./vectorStore.js";
import type { RetrievedChunk } from "./types.js";

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  topScore: number;
  confident: boolean;
}

export async function retrieve(question: string): Promise<RetrievalResult> {
  const queryVector = await embedQuery(question);
  const chunks = search(ragConfig.chunkStrategy, queryVector, ragConfig.topK);
  const topScore = chunks[0]?.score ?? -1;

  return {
    chunks,
    topScore,
    confident: topScore >= ragConfig.similarityThreshold,
  };
}
