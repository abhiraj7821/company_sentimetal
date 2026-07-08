// src/tools/tableQA.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { getLLM } from "../lib/llm.js";

/**
 * Answer a question based on tabular data (provided as a markdown/CSV string).
 * Uses Groq for reasoning.
 */
async function tableQA(question, table) {
  const model = getLLM();
  const prompt = `You are a financial data analyst. Given the following table, answer the question. Only use the data in the table.\n\nTable:\n${table}\n\nQuestion: ${question}\nAnswer (be concise, include numbers):`;
  const response = await model.invoke(prompt);
  return response.content.trim();
}

export const tableQATool = tool(tableQA, {
  name: "table_qa",
  description:
    "Answer questions about tabular data, such as financial statement tables (e.g., revenue, earnings). Provide the table as a markdown or CSV string.",
  schema: z.object({
    question: z.string().describe("The question to answer from the table"),
    table: z.string().describe("The table data as markdown or CSV"),
  }),
});
