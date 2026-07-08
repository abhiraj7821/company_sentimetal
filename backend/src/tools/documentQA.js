// src/tools/documentQA.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { getLLM } from "../lib/llm.js";

/**
 * Answer a question given a document's text content.
 * Uses Groq (free tier) for reasoning.
 */
async function documentQA(question, document) {
  const model = getLLM(); // uses default model (Gemini)
  const prompt = `You are a precise document analyst. Using ONLY the provided document text, answer the question. If the answer cannot be found, say so.\n\nDocument:\n${document}\n\nQuestion: ${question}\nAnswer:`;
  const response = await model.invoke(prompt);
  return response.content.trim();
}

export const documentQATool = tool(documentQA, {
  name: "document_qa",
  description:
    "Extract a specific fact or answer a question from a given document text (e.g., a SEC filing, news article).",
  schema: z.object({
    question: z.string().describe("The question to answer"),
    document: z.string().describe("The document text to search within"),
  }),
});
