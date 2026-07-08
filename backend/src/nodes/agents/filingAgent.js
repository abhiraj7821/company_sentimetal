// src/nodes/agents/filingAgent.js
import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getLLM } from "../../lib/llm.js";
import { GraphAnnotation } from "../../graph/state.js";
import { fetchSecFilings } from "../../tools/secEdgar.js";

const tools = [fetchSecFilings];
const model = getLLM("claude-haiku-4-5-20251001", { temperature: 0 }).bindTools(
  tools,
);

function messagesOf(state) {
  return Array.isArray(state.messages) ? state.messages : [];
}

async function callModel(state) {
  const systemMsg = {
    role: "system",
    content: `You are a SEC filing analyst. Use the fetch_sec_filings tool to retrieve recent 10-K/10-Q filings for: ${state.company}. After getting results, summarise the key filing dates and types.`,
  };
  const priorMsgs = messagesOf(state);
  // Anthropic requires at least one non-system message in the array (the
  // system prompt is extracted separately). On the first call priorMsgs is
  // empty, so fall back to a starter human message to kick off the turn.
  const humanTurn =
    priorMsgs.length > 0
      ? priorMsgs
      : [
          {
            role: "user",
            content: `Begin researching SEC filings for ${state.company}.`,
          },
        ];
  const response = await model.invoke([systemMsg, ...humanTurn]);
  return { messages: [response] };
}

function shouldUseTools(state) {
  const msgs = messagesOf(state);
  const lastMsg = msgs[msgs.length - 1];
  return lastMsg?.tool_calls?.length ? "tool_node" : "write_output";
}

async function writeOutput(state) {
  const msgs = messagesOf(state);
  const lastMsg = msgs[msgs.length - 1];
  const content = lastMsg?.content || "No filing data obtained.";
  return {
    messages: msgs,
    filing_data: content,
  };
}

const toolNode = new ToolNode(tools);

const filingGraph = new StateGraph(GraphAnnotation)
  .addNode("call_model", callModel)
  .addNode("tool_node", toolNode)
  .addNode("write_output", writeOutput)
  .addEdge(START, "call_model")
  .addConditionalEdges("call_model", shouldUseTools, {
    tool_node: "tool_node",
    write_output: "write_output",
  })
  .addEdge("tool_node", "call_model")
  .addEdge("write_output", END)
  .compile();

export { filingGraph };
