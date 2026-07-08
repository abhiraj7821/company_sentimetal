// src/rag/embeddings.js
import config from "../config/index.js";
import logger from "../lib/logger.js";
import { OpenAIEmbeddings } from "@langchain/openai";

let embeddingsClient = null;

/**
 * Returns a configured LangChain Embeddings instance.
 * Uses OpenAI by default; can swap to Hugging Face if HF_TOKEN is set.
 */
export function getEmbeddingsClient() {
  if (embeddingsClient) return embeddingsClient;
  if (config.openaiApiKey) {
    embeddingsClient = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: config.embeddingModel,
      dimensions: config.embeddingDimension, // some models support this
    });
  } else if (config.hfToken) {
    // Hugging Face Inference Embeddings
    const { HuggingFaceInferenceEmbeddings } = await import(
      "@langchain/community/embeddings/hf"
    );
    embeddingsClient = new HuggingFaceInferenceEmbeddings({
      apiKey: config.hfToken,
      model: config.embeddingModel || "sentence-transformers/all-MiniLM-L6-v2",
    });
  } else {
    throw new Error(
      "No embedding API key found. Set OPENAI_API_KEY or HF_TOKEN."
    );
  }
  logger.info(`Embedding client initialized (model: ${config.embeddingModel})`);
  return embeddingsClient;
}

/**
 * Convenience: embed a single text and return vector.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  const client = getEmbeddingsClient();
  const result = await client.embedQuery(text);
  return result; // array of floats
}