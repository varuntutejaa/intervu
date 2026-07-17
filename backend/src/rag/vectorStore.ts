import fs from "node:fs/promises";
import fsSync from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chunkStrategyDir, type ChunkStrategyKey } from "./config.js";
import type { IndexedChunk, RetrievedChunk } from "./types.js";

// faiss-node is a native CJS addon whose exports aren't statically analyzable,
// so Node's ESM/CJS interop can't see its named exports via a normal import —
// createRequire sidesteps that and gets the real named exports back.
const require = createRequire(import.meta.url);
const { IndexFlatIP } = require("faiss-node") as typeof import("faiss-node");
type FaissIndex = InstanceType<typeof IndexFlatIP>;

const INDEX_FILE = "index.faiss";
const METADATA_FILE = "metadata.json";

export async function saveIndex(
  strategy: ChunkStrategyKey,
  chunks: IndexedChunk[],
  vectors: number[][],
): Promise<void> {
  const dim = vectors[0]?.length;
  if (!dim) throw new Error("Cannot build an index from zero vectors");

  const dir = chunkStrategyDir(strategy);
  await fs.mkdir(dir, { recursive: true });

  const index = new IndexFlatIP(dim);
  index.add(vectors.flat());
  index.write(path.join(dir, INDEX_FILE));

  await fs.writeFile(
    path.join(dir, METADATA_FILE),
    JSON.stringify({ chunks, builtAt: new Date().toISOString() }, null, 2),
  );
}

interface LoadedIndex {
  index: FaissIndex;
  chunks: IndexedChunk[];
}

const cache = new Map<ChunkStrategyKey, LoadedIndex>();

function loadIndex(strategy: ChunkStrategyKey): LoadedIndex {
  const cached = cache.get(strategy);
  if (cached) return cached;

  const dir = chunkStrategyDir(strategy);
  const indexPath = path.join(dir, INDEX_FILE);
  const metadataPath = path.join(dir, METADATA_FILE);

  if (!fsSync.existsSync(indexPath) || !fsSync.existsSync(metadataPath)) {
    throw new Error(`No index found for chunk strategy "${strategy}". Run "npm run ingest" first.`);
  }

  const index = IndexFlatIP.read(indexPath) as FaissIndex;
  const { chunks } = JSON.parse(fsSync.readFileSync(metadataPath, "utf-8")) as {
    chunks: IndexedChunk[];
  };

  const loaded: LoadedIndex = { index, chunks };
  cache.set(strategy, loaded);
  return loaded;
}

export function search(
  strategy: ChunkStrategyKey,
  queryVector: number[],
  topK: number,
): RetrievedChunk[] {
  const { index, chunks } = loadIndex(strategy);
  const k = Math.min(topK, index.ntotal());
  if (k === 0) return [];

  const { distances, labels } = index.search(queryVector, k);
  return labels
    .map((label, i) => ({ label, score: distances[i] }))
    .filter(({ label }) => label >= 0)
    .map(({ label, score }) => ({ ...chunks[label], score }));
}
