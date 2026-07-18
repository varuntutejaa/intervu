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
  // 0.35 is calibrated for all-MiniLM-L6-v2's score distribution specifically
  // (empirically: unrelated questions land ~0.02-0.08, full-sentence
  // on-topic questions ~0.6-0.75, but short/terse on-topic queries like "ats
  // score" land as low as ~0.44-0.46 — see EVALUATION.md). 0.35 sits well
  // below that terse-query floor while staying well above the off-topic
  // ceiling. A different EMBEDDING_MODEL will very likely need a different
  // threshold.
  similarityThreshold: process.env.RAG_SIMILARITY_THRESHOLD
    ? Number(process.env.RAG_SIMILARITY_THRESHOLD)
    : 0.35,
  // Chat: Groq (OpenAI-compatible API, no embeddings support — see lib/groq.ts).
  chatModel: process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile",
  // Embeddings: a local sentence-transformer running in-process via
  // @huggingface/transformers (ONNX/WASM) — no external service, no API
  // key, nothing to install beyond `npm install`. Downloads once on first
  // use and is cached locally after that.
  embeddingModel: process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2",
};

export function chunkStrategyDir(strategy: ChunkStrategyKey = ragConfig.chunkStrategy): string {
  return path.join(ragConfig.dataDir, strategy);
}
