// src/tools/vectorSearch.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieveSimilarChunks } from "../rag/retriever.js";

/**
 * LangChain tool that wraps the vector retriever.
 * Used by agents to pull context from ingested SEC filings, news, etc.
 */
async function vectorSearch(query, k = 4) {
  const chunks = await retrieveSimilarChunks(query, k);
  if (chunks.length === 0) return "No relevant documents found.";
  return chunks
    .map(
      (c, i) =>
        `--- Chunk ${i + 1} (similarity: ${c.similarity.toFixed(3)}) ---\n${c.content}`,
    )
    .join("\n\n");
}

export const vectorSearchTool = tool(vectorSearch, {
  name: "vector_search",
  description:
    "Search through ingested documents (SEC filings, news, etc.) using semantic similarity. Returns the most relevant text chunks.",
  schema: z.object({
    query: z.string().describe("The natural language query to search for"),
    k: z.number().optional().default(4).describe("Number of chunks to return"),
  }),
});
