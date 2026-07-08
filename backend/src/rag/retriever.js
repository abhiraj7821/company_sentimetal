// src/rag/retriever.js
import { embedText } from "./embeddings.js";
import { query } from "../db/pool.js";
import logger from "../lib/logger.js";

/**
 * Retrieve the top-k most similar chunks for a query string.
 * @param {string} queryText - the user/search query
 * @param {number} [k=4] - number of chunks to return
 * @returns {Promise<Array<{content: string, metadata: object, similarity: number}>>}
 */
export async function retrieveSimilarChunks(queryText, k = 4) {
  const embedding = await embedText(queryText);
  // pgvector cosine similarity operator: <=>
  const result = await query(
    `SELECT c.id, c.content, c.metadata, 1 - (c.embedding <=> $1) AS similarity
     FROM chunks c
     ORDER BY similarity DESC
     LIMIT $2`,
    [embedding, k],
  );
  logger.info(`Vector search returned ${result.rows.length} chunks`);
  return result.rows.map((row) => ({
    content: row.content,
    metadata: row.metadata,
    similarity: parseFloat(row.similarity),
  }));
}
