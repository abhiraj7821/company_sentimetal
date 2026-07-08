// src/nodes/agents/sentimentAgent.js
import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getLLM } from "../../lib/llm.js";
import { GraphAnnotation } from "../../graph/state.js";
import { sentimentScorerTool } from "../../tools/sentimentScorer.js";
import { classifyNewsTool } from "../../tools/classifyNews.js";

const tools = [sentimentScorerTool, classifyNewsTool];
const model = getLLM("claude-haiku-4-5-20251001", { temperature: 0 }).bindTools(
  tools,
);

function messagesOf(state) {
  return Array.isArray(state.messages) ? state.messages : [];
}

async function callModel(state) {
  const newsData = state.news_data || "No news data available.";
  const systemMsg = {
    role: "system",
    content: `You are a sentiment analyst. Use the available tools to classify and score the sentiment of the news below. Provide an overall sentiment summary.\n\nNews Articles:\n${newsData}`,
  };
  const priorMsgs = messagesOf(state);
  const humanTurn =
    priorMsgs.length > 0
      ? priorMsgs
      : [{ role: "user", content: "Begin the sentiment analysis." }];
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
  const content = lastMsg?.content || "No sentiment data.";
  return { messages: msgs, sentiment_data: content };
}

const toolNode = new ToolNode(tools);

const sentimentGraph = new StateGraph(GraphAnnotation)
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

export { sentimentGraph };
