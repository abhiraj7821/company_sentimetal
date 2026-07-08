// src/nodes/agents/newsAgent.js
import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getLLM } from "../../lib/llm.js";
import { GraphAnnotation } from "../../graph/state.js";
import { fetchNews } from "../../tools/newsApi.js";

const tools = [fetchNews];
const model = getLLM("claude-haiku-4-5-20251001", { temperature: 0 }).bindTools(
  tools,
);

function messagesOf(state) {
  return Array.isArray(state.messages) ? state.messages : [];
}

async function callModel(state) {
  const systemMsg = {
    role: "system",
    content: `You are a financial news researcher. Use the fetch_news tool to retrieve recent news about: ${state.company}. After fetching, summarise the top articles and key topics.`,
  };
  const priorMsgs = messagesOf(state);
  const humanTurn =
    priorMsgs.length > 0
      ? priorMsgs
      : [
          {
            role: "user",
            content: `Begin researching recent news for ${state.company}.`,
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
  const content = lastMsg?.content || "No news data obtained.";
  return { messages: msgs, news_data: content };
}

const toolNode = new ToolNode(tools);

const newsGraph = new StateGraph(GraphAnnotation)
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

export { newsGraph };
