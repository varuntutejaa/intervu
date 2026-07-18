import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { ragConfig } from "./config.js";

// Runs entirely in-process (ONNX/WASM) — no external service, no API key,
// no install beyond `npm install`. The model downloads once (cached under
// node_modules/.cache) on first use, so ingest and the chat route both share
// this single loaded pipeline instead of re-loading it per call.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", ragConfig.embeddingModel);
  }
  return extractorPromise;
}

const BATCH_SIZE = 32;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    // mean-pool token embeddings into one vector per input, L2-normalized so
    // a FAISS inner-product index doubles as cosine similarity search.
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    vectors.push(...(output.tolist() as number[][]));
  }

  return vectors;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
