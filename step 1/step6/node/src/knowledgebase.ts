import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pinecone } from "@pinecone-database/pinecone";
import { extractText, getDocumentProxy } from "unpdf";
import { createOpenRouterEmbedder, type Embedder } from "./embedder";


type ChunkMetadata = { text: string; source: string; page: number };

export interface KnowledgeBase {
  ingest(): Promise<void>;
  search(question: string, topK?: number): Promise<string[]>;
}

// Splits text into ~size-character chunks with overlap, preferring sentence ends.
// 800 chars is roughly 200 tokens, which is safely under a 512-token embedding limit.
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const lastBreak = clean.lastIndexOf(". ", end);
      if (lastBreak > start + size * 0.5) end = lastBreak + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks.filter((c) => c.length >= 20);
}

async function readPdfPages(filePath: string): Promise<string[]> {
  const buffer = await readFile(filePath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

export function createKnowledgeBase({
  embed = createOpenRouterEmbedder(),
  knowledgeDir = process.env.KNOWLEDGE_DIR || path.join(process.cwd(), "knowledge"),
  indexName = process.env.PINECONE_INDEX,
  namespace = process.env.PINECONE_NAMESPACE || "",
  pineconeApiKey = process.env.PINECONE_API_KEY,
  batchSize = 20,
}: {
  embed?: Embedder;
  knowledgeDir?: string;
  indexName?: string;
  namespace?: string;
  pineconeApiKey?: string;
  batchSize?: number;
} = {}): KnowledgeBase {
  if (!pineconeApiKey) throw new Error("PINECONE_API_KEY is not set");
  if (!indexName) throw new Error("PINECONE_INDEX is not set");

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
 const index = pinecone.index<ChunkMetadata>(indexName).namespace(namespace);

  return {
    async ingest() {
      const files = (await readdir(knowledgeDir)).filter((f) =>
        f.toLowerCase().endsWith(".pdf"),
      );
      if (files.length === 0) {
        throw new Error(`No PDF files found in ${knowledgeDir}`);
      }

      // 1. read PDFs  2. split into chunks
      const chunks: { id: string; text: string; source: string; page: number }[] = [];
      for (const file of files) {
        const pages = await readPdfPages(path.join(knowledgeDir, file));
        const safeName = file.replace(/[^a-zA-Z0-9]/g, "_");
        pages.forEach((pageText, pageIdx) => {
          chunkText(pageText).forEach((text, i) => {
            // Deterministic id: re-ingesting overwrites instead of duplicating
            chunks.push({
              id: `${safeName}-p${pageIdx + 1}-c${i}`,
              text,
              source: file,
              page: pageIdx + 1,
            });
          });
        });
        console.log(`Read ${file}: ${pages.length} pages`);
      }

      // 3. embed + store in Pinecone, in small batches
      for (let start = 0; start < chunks.length; start += batchSize) {
        const batch = chunks.slice(start, start + batchSize);
        const vectors = await embed(batch.map((c) => c.text));
          await index.upsert({
        records: batch.map((c, i) => ({
          id: c.id,
          values: vectors[i],
          metadata: { text: c.text, source: c.source, page: c.page },
        })),
      });
      }
      console.log(`Stored ${chunks.length} chunks in Pinecone.`);
    },

    async search(question, topK = 4) {
      const [vector] = await embed([question]);
      const result = await index.query({ vector, topK, includeMetadata: true });
      return (result.matches ?? [])
        .map((m) => m.metadata?.text)
        .filter((t): t is string => typeof t === "string");
    },
  };
}