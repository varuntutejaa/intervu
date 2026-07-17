export interface ChunkMetadata {
  source: string;
  page: number;
  chunk: number;
}

export interface IndexedChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface RetrievedChunk extends IndexedChunk {
  score: number;
}

export interface Citation {
  document: string;
  page: number;
}

export interface ChatAnswer {
  answer: string;
  citations: Citation[];
}
