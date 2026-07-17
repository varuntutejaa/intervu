import OpenAI from "openai";
import { ragConfig } from "./config.js";

let client: OpenAI | null = null;

// Ollama exposes an OpenAI-compatible /v1/embeddings endpoint, so the
// official openai SDK works unmodified against it, pointed at localhost
// instead of api.openai.com — it doesn't check the API key, but the SDK
// requires a non-empty string to construct.
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: "ollama", baseURL: `${ragConfig.ollamaBaseUrl}/v1` });
  }
  return client;
}

// Smaller than the old OpenAI-hosted batch size — this now runs on local
// CPU/GPU, where a single huge batch is slower and more failure-prone than
// several smaller ones.
const BATCH_SIZE = 20;

// L2-normalizing lets a FAISS inner-product index double as cosine similarity search.
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const openai = getClient();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: ragConfig.embeddingModel,
      input: batch,
    });
    for (const item of response.data) {
      vectors.push(normalize(item.embedding));
    }
  }

  return vectors;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
