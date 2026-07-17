import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

export type ChunkStrategyKey = "small" | "large";

interface ChunkStrategyDef {
  // The assignment's "Strategy A / Strategy B" labels, kept for log/debug output.
  label: string;
  chunkSizeWords: number;
  chunkOverlapWords: number;
}

export const CHUNK_STRATEGIES: Record<ChunkStrategyKey, ChunkStrategyDef> = {
  small: { label: "A", chunkSizeWords: 300, chunkOverlapWords: 50 },
  large: { label: "B", chunkSizeWords: 700, chunkOverlapWords: 100 },
};

function resolveChunkStrategy(): ChunkStrategyKey {
  const raw = process.env.CHUNK_STRATEGY?.toLowerCase();
  return raw === "small" || raw === "large" ? raw : "small";
}

export const ragConfig = {
  knowledgeDir: process.env.RAG_KNOWLEDGE_DIR ?? path.join(backendRoot, "knowledge"),
  dataDir: process.env.RAG_DATA_DIR ?? path.join(backendRoot, "data", "rag"),
  chunkStrategy: resolveChunkStrategy(),
  topK: process.env.RAG_TOP_K ? Number(process.env.RAG_TOP_K) : 5,
  similarityThreshold: process.env.RAG_SIMILARITY_THRESHOLD
    ? Number(process.env.RAG_SIMILARITY_THRESHOLD)
    : 0.75,
  // Chat: Groq (OpenAI-compatible API, no embeddings support — see lib/groq.ts).
  chatModel: process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile",
  // Embeddings: local Ollama (also OpenAI-compatible), so ingest/query never
  // leaves the machine and never costs anything.
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text",
};

export function chunkStrategyDir(strategy: ChunkStrategyKey = ragConfig.chunkStrategy): string {
  return path.join(ragConfig.dataDir, strategy);
}
