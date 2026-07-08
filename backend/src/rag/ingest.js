// src/rag/ingest.js
import { getEmbeddingsClient } from "./embeddings.js";
import { query } from "../db/pool.js";
import logger from "../lib/logger.js";

/**
 * Ingest a document: chunk it, embed each chunk, store in `chunks` table.
 * @param {object} doc - { content: string, metadata?: object, documentId: number }
 * @param {number} [chunkSize=500] - max characters per chunk
 * @param {number} [overlap=100] - character overlap between chunks
 */
export async function ingestDocument(doc, chunkSize = 500, overlap = 100) {
  const { content, documentId } = doc;
  if (!content || !documentId) throw new Error("Missing content or documentId");

  const chunks = chunkText(content, chunkSize, overlap);
  const embeddingsClient = getEmbeddingsClient();

  logger.info(`Ingesting document ${documentId}: ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const embedding = await embeddingsClient.embedQuery(chunkContent);
    await query(
      `INSERT INTO chunks (document_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4)`,
      [documentId, i, chunkContent, embedding],
    );
  }
}

/**
 * Simple character-based chunker with overlap.
 * Splits by paragraphs first, then merges until chunk_size is reached.
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
  const paragraphs = text.split(/\n\s*\n/); // split by blank lines
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length < chunkSize) {
      current += (current ? "\n\n" : "") + para;
    } else {
      if (current) chunks.push(current.trim());
      // start new chunk with overlap from the end of previous
      const overlapText = current.slice(-overlap);
      current = overlapText + "\n\n" + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
