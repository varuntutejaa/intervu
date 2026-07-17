import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export interface PageText {
  source: string;
  page: number;
  text: string;
}

export async function listKnowledgePdfs(knowledgeDir: string): Promise<string[]> {
  const entries = await fs.readdir(knowledgeDir);
  return entries.filter((f) => f.toLowerCase().endsWith(".pdf")).sort();
}

export async function loadPdfPages(filePath: string): Promise<PageText[]> {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const source = path.basename(filePath);
    return result.pages
      .map((p) => ({ source, page: p.num, text: p.text.trim() }))
      .filter((p) => p.text.length > 0);
  } finally {
    await parser.destroy();
  }
}
