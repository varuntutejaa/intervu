import "dotenv/config";
import path from "node:path";
import { chunkPages } from "../src/rag/chunker.js";
import { CHUNK_STRATEGIES, ragConfig, type ChunkStrategyKey } from "../src/rag/config.js";
import { embedTexts } from "../src/rag/embeddings.js";
import { listKnowledgePdfs, loadPdfPages } from "../src/rag/pdfLoader.js";
import type { IndexedChunk } from "../src/rag/types.js";
import { saveIndex } from "../src/rag/vectorStore.js";

async function ingestStrategy(strategy: ChunkStrategyKey): Promise<void> {
  const def = CHUNK_STRATEGIES[strategy];
  console.log(
    `\n[ingest] Strategy ${def.label} (${strategy}): ${def.chunkSizeWords}w chunks / ${def.chunkOverlapWords}w overlap`,
  );

  const files = await listKnowledgePdfs(ragConfig.knowledgeDir);
  if (files.length === 0) {
    throw new Error(`No PDFs found in ${ragConfig.knowledgeDir}`);
  }

  const allChunks: IndexedChunk[] = [];
  for (const file of files) {
    const filePath = path.join(ragConfig.knowledgeDir, file);
    const pages = await loadPdfPages(filePath);
    const chunks = await chunkPages(pages, strategy);
    console.log(`  - ${file}: ${pages.length} pages -> ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`  Embedding ${allChunks.length} chunks with ${ragConfig.embeddingModel}...`);
  const vectors = await embedTexts(allChunks.map((c) => c.text));

  await saveIndex(strategy, allChunks, vectors);
  console.log(`  Saved index -> data/rag/${strategy}/`);
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const strategies: ChunkStrategyKey[] =
    arg === "small" || arg === "large" ? [arg] : ["small", "large"];

  for (const strategy of strategies) {
    await ingestStrategy(strategy);
  }

  console.log("\n[ingest] Done.");
}

main().catch((err) => {
  console.error("[ingest] Failed:", err);
  process.exit(1);
});
